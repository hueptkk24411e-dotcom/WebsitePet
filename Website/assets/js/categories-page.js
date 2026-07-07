/* =========================================================
   PETOPIA ADMIN PANEL — categories-page.js
   Trang Danh mục sản phẩm: tổng hợp từ products-data.json,
   tìm kiếm/sắp xếp/lọc, thêm-sửa-xóa danh mục (phiên làm việc)
   ========================================================= */

var ALL_PRODUCTS = [];
var CATEGORY_OVERRIDES = {}; // tên gốc -> { name, image, desc } (chỉnh sửa trong phiên)
var DELETED_CATEGORIES = {}; // tên danh mục bị xóa -> true (sản phẩm chuyển "Chưa phân loại")
var CUSTOM_CATEGORIES = []; // danh mục thêm mới, chưa có sản phẩm nào: { name, image, desc }

var state = {
  search: '',
  sort: 'products_desc',
  stockFilter: 'all'
};

document.addEventListener('DOMContentLoaded', function () {
  // Load products từ API để có đúng danh mục + ảnh
  fetch('http://localhost:3500/products')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      ALL_PRODUCTS = Array.isArray(data) ? data : (data.products || []);
      renderAll();
    })
    .catch(function (err) {
      console.error(err);
      showToast('Không tải được dữ liệu sản phẩm', 'error');
    });

  document.getElementById('categorySearch').addEventListener('input', debounce(function (e) {

    state.search = e.target.value.trim().toLowerCase();
    renderAll();
  }, 200));

  document.getElementById('categorySort').addEventListener('change', function (e) {
    state.sort = e.target.value;
    renderAll();
  });

  document.getElementById('categoryStockFilter').addEventListener('change', function (e) {
    state.stockFilter = e.target.value;
    renderAll();
  });

  document.getElementById('addCategoryBtn').addEventListener('click', function () {
    openCategoryForm(null);
  });

  document.getElementById('categoryFormSaveBtn').addEventListener('click', saveCategoryForm);
  document.getElementById('categoryDeleteConfirmBtn').addEventListener('click', confirmDeleteCategory);
});

/* ---------------------------------------------------------
   Tổng hợp dữ liệu danh mục từ danh sách sản phẩm
   --------------------------------------------------------- */
function buildCategoryStats() {
  var map = {};

  ALL_PRODUCTS.forEach(function (p) {
    var catName = p.category;
    if (DELETED_CATEGORIES[catName]) catName = 'Chưa phân loại';

    if (!map[catName]) {
      map[catName] = {
        name: catName,
        products: [],
        totalStock: 0,
        lowStock: 0,
        outOfStock: 0,
        revenue: 0,
        image: ''
      };
    }
    var c = map[catName];
    c.products.push(p);
    c.totalStock += p.stock;
    if (p.status === 'low_stock') c.lowStock++;
    if (p.status === 'out_of_stock') c.outOfStock++;
    c.revenue += p.monthly_revenue;
    if (!c.image) c.image = p.image;
  });

  // Danh mục tùy chỉnh chưa có sản phẩm
  CUSTOM_CATEGORIES.forEach(function (cc) {
    if (!map[cc.name]) {
      map[cc.name] = {
        name: cc.name,
        products: [],
        totalStock: 0,
        lowStock: 0,
        outOfStock: 0,
        revenue: 0,
        image: cc.image || ''
      };
    }
  });

  // Áp override tên/ảnh/mô tả
  Object.keys(CATEGORY_OVERRIDES).forEach(function (origName) {
    var ov = CATEGORY_OVERRIDES[origName];
    if (map[origName]) {
      var entry = map[origName];
      if (ov.image) entry.image = ov.image;
      entry.desc = ov.desc || '';
      if (ov.name && ov.name !== origName && !map[ov.name]) {
        entry.name = ov.name;
        map[ov.name] = entry;
        delete map[origName];
      }
    }
  });

  return Object.values(map);
}

/* ---------------------------------------------------------
   Render toàn bộ: mini-stats + grid
   --------------------------------------------------------- */
function renderAll() {
  var categories = buildCategoryStats();
  renderMiniStats(categories);
  renderGrid(categories);
}

function renderMiniStats(categories) {
  var totalProducts = ALL_PRODUCTS.length;
  var lowOrOut = ALL_PRODUCTS.filter(function (p) { return p.status !== 'in_stock'; }).length;
  var monthlyRevenue = ALL_PRODUCTS.reduce(function (sum, p) { return sum + p.monthly_revenue; }, 0);

  document.getElementById('statTotalCategories').textContent = formatNumber(categories.length);
  document.getElementById('statTotalProducts').textContent = formatNumber(totalProducts);
  document.getElementById('statLowStock').textContent = formatNumber(lowOrOut);
  document.getElementById('statMonthlyRevenue').textContent = formatVND(monthlyRevenue);
}

function renderGrid(categories) {
  var grid = document.getElementById('categoryGrid');
  var emptyState = document.getElementById('categoryEmptyState');

  var filtered = categories.filter(function (c) {
    if (state.search && c.name.toLowerCase().indexOf(state.search) === -1) return false;
    if (state.stockFilter === 'low' && c.lowStock === 0) return false;
    if (state.stockFilter === 'out' && c.outOfStock === 0) return false;
    return true;
  });

  filtered.sort(function (a, b) {
    switch (state.sort) {
      case 'products_asc': return a.products.length - b.products.length;
      case 'revenue_desc': return b.revenue - a.revenue;
      case 'name_asc': return a.name.localeCompare(b.name, 'vi');
      default: return b.products.length - a.products.length; // products_desc
    }
  });

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  grid.innerHTML = filtered.map(renderCategoryCard).join('');

  // Bind events
  grid.querySelectorAll('.category-card').forEach(function (card) {
    var name = card.getAttribute('data-name');
    card.querySelector('.category-cover').addEventListener('click', function () {
      openCategoryProducts(name);
    });
    var editBtn = card.querySelector('.icon-btn.edit-cat');
    if (editBtn) editBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      openCategoryForm(name);
    });
    var delBtn = card.querySelector('.icon-btn.danger');
    if (delBtn) delBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      openDeleteCategory(name);
    });
  });
}

function renderCategoryCard(c) {
  var stockPct = c.products.length ? Math.round(((c.products.length - c.lowStock - c.outOfStock) / c.products.length) * 100) : 100;
  var isLow = c.lowStock + c.outOfStock > 0;
  var img = c.image || 'https://placehold.co/400x300/e9f7ee/1b934b?text=Petopia';

  return '' +
    '<div class="category-card" data-name="' + escapeHTML(c.name) + '">' +
      '<div class="category-cover" style="cursor:pointer;">' +
        '<img src="' + img + '" alt="' + escapeHTML(c.name) + '" loading="lazy" onerror="this.src=\'https://placehold.co/400x300/e9f7ee/1b934b?text=Petopia\'">' +
        '<span class="category-count-pill">' + c.products.length + ' sản phẩm</span>' +
        '<div class="category-cover-title">' + escapeHTML(c.name) + '</div>' +
      '</div>' +
      '<div class="category-body">' +
        '<div class="category-stat-row"><span>Tồn kho khả dụng</span><strong>' + stockPct + '%</strong></div>' +
        '<div class="category-stock-bar' + (isLow ? ' low' : '') + '"><span style="width:' + stockPct + '%"></span></div>' +
        '<div class="category-stat-row"><span>Sắp hết / hết hàng</span><strong style="color:' + (isLow ? 'var(--orange-600)' : 'var(--green-600)') + '">' + (c.lowStock + c.outOfStock) + '</strong></div>' +
      '</div>' +
      '<div class="category-footer">' +
        '<span class="category-revenue">' + formatVND(c.revenue) + '<span style="display:block;font-size:0.65rem;color:var(--ink-300);font-weight:600;">doanh thu / tháng</span></span>' +
        '<div class="category-actions">' +
          '<button class="icon-btn edit-cat" title="Sửa danh mục"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg></button>' +
          '<button class="icon-btn danger" title="Xóa danh mục"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/></svg></button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

/* ---------------------------------------------------------
   Modal: Thêm / sửa danh mục
   --------------------------------------------------------- */
function openCategoryForm(name) {
  var title = document.getElementById('categoryFormTitle');
  var nameInput = document.getElementById('categoryFormName');
  var imageInput = document.getElementById('categoryFormImage');
  var descInput = document.getElementById('categoryFormDesc');
  var originalInput = document.getElementById('categoryFormOriginalName');

  if (name) {
    var cat = buildCategoryStats().find(function (c) { return c.name === name; });
    title.textContent = 'Sửa danh mục';
    nameInput.value = name;
    imageInput.value = (cat && cat.image) || '';
    descInput.value = (cat && cat.desc) || '';
    originalInput.value = name;
  } else {
    title.textContent = 'Thêm danh mục';
    nameInput.value = '';
    imageInput.value = '';
    descInput.value = '';
    originalInput.value = '';
  }

  openModal('categoryFormModal');
}

function saveCategoryForm() {
  var nameInput = document.getElementById('categoryFormName');
  var imageInput = document.getElementById('categoryFormImage');
  var descInput = document.getElementById('categoryFormDesc');
  var originalInput = document.getElementById('categoryFormOriginalName');

  var newName = nameInput.value.trim();
  if (!newName) {
    showToast('Vui lòng nhập tên danh mục', 'error');
    return;
  }

  var original = originalInput.value;

  if (original) {
    CATEGORY_OVERRIDES[original] = {
      name: newName,
      image: imageInput.value.trim(),
      desc: descInput.value.trim()
    };
    showToast('Đã cập nhật danh mục "' + newName + '"');
  } else {
    var exists = buildCategoryStats().some(function (c) { return c.name.toLowerCase() === newName.toLowerCase(); });
    if (exists) {
      showToast('Danh mục này đã tồn tại', 'error');
      return;
    }
    CUSTOM_CATEGORIES.push({
      name: newName,
      image: imageInput.value.trim(),
      desc: descInput.value.trim()
    });
    showToast('Đã thêm danh mục "' + newName + '"');
  }

  closeModal('categoryFormModal');
  renderAll();
}

/* ---------------------------------------------------------
   Modal: Xem sản phẩm trong danh mục
   --------------------------------------------------------- */
function openCategoryProducts(name) {
  var cat = buildCategoryStats().find(function (c) { return c.name === name; });
  document.getElementById('categoryProductsTitle').textContent = 'Sản phẩm — ' + name;
  var list = document.getElementById('categoryProductsList');
  var viewAllBtn = document.getElementById('categoryProductsViewAllBtn');
  viewAllBtn.href = 'products.html?category=' + encodeURIComponent(name);

  if (!cat || cat.products.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>Danh mục này chưa có sản phẩm nào.</p></div>';
  } else {
    list.innerHTML = cat.products.slice(0, 30).map(function (p) {
      return '' +
        '<div class="list-row" style="border-radius:0.6rem;">' +
          '<img class="pet-avatar" style="border-radius:0.5rem;" src="' + p.image + '" alt="" onerror="this.src=\'https://placehold.co/60x60/e9f7ee/1b934b?text=%20\'">' +
          '<div class="schedule-body">' +
            '<div class="schedule-pet" style="font-size:0.85rem;">' + escapeHTML(p.name) + '</div>' +
            '<div class="schedule-sub">' + escapeHTML(p.brand || '') + ' · ' + formatVND(p.price) + '</div>' +
          '</div>' +
          '<span class="badge ' + (p.status === 'in_stock' ? 'completed' : (p.status === 'low_stock' ? 'pending' : 'shipping')) + '">' +
            (p.status === 'in_stock' ? 'Còn ' + p.stock : (p.status === 'low_stock' ? 'Sắp hết · ' + p.stock : 'Hết hàng')) +
          '</span>' +
        '</div>';
    }).join('');
    if (cat.products.length > 30) {
      list.innerHTML += '<p style="text-align:center;font-size:0.78rem;color:var(--ink-500);padding:0.5rem;">+ ' + (cat.products.length - 30) + ' sản phẩm khác — xem đầy đủ tại trang Sản phẩm</p>';
    }
  }

  openModal('categoryProductsModal');
}

/* ---------------------------------------------------------
   Modal: Xóa danh mục
   --------------------------------------------------------- */
var pendingDeleteName = null;

function openDeleteCategory(name) {
  pendingDeleteName = name;
  document.getElementById('categoryDeleteName').textContent = name;
  openModal('categoryDeleteModal');
}

function confirmDeleteCategory() {
  if (!pendingDeleteName) return;
  DELETED_CATEGORIES[pendingDeleteName] = true;
  CUSTOM_CATEGORIES = CUSTOM_CATEGORIES.filter(function (cc) { return cc.name !== pendingDeleteName; });
  showToast('Đã xóa danh mục "' + pendingDeleteName + '"');
  pendingDeleteName = null;
  closeModal('categoryDeleteModal');
  renderAll();
}
