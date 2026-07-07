/* =========================================================
   PETOPIA ADMIN PANEL — products-page.js
   Trang quản lý sản phẩm: dùng dữ liệu tĩnh
   ========================================================= */

var ALL_PRODUCTS = [];
var PRODUCTS_PATH = 'http://localhost:3500/products';
var ALL_CATEGORIES = [];

var state = {
  search: '',
  page: 1,
  pageSize: 8,
  category: 'all',
  stock: 'all',
  status: 'all'
};

document.addEventListener('DOMContentLoaded', function () {
    
    bindEvents();
    loadCategories();
    loadProducts();

});

function bindEvents() {
  var addBtn = document.getElementById('addProductBtn');
  if (addBtn) addBtn.addEventListener('click', function () { openProductForm(null); });

  var saveBtn = document.getElementById('productFormSaveBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveProductForm);

  var searchInput = document.getElementById('productSearch');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(function (e) {
      state.search = e.target.value.trim().toLowerCase();
      state.page = 1;
      renderProductsTable();
    }, 200));
  }

  var catFilter = document.getElementById('productCategoryFilter');
  if (catFilter) {
    catFilter.addEventListener('change', function (e) {
      state.category = e.target.value;
      state.page = 1;
      renderProductsTable();
    });
  }

  var stockFilter = document.getElementById('productStockFilter');
  if (stockFilter) {
    stockFilter.addEventListener('change', function (e) {
      state.stock = e.target.value;
      state.page = 1;
      renderProductsTable();
    });
  }

  var statusFilter = document.getElementById('productStatusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', function (e) {
      state.status = e.target.value;
      state.page = 1;
      renderProductsTable();
    });
  }
}

function loadCategories() {
  fetch('http://localhost:3500/categories')
    .then(function (res) { return res.json(); })
    .then(function (categories) {
      ALL_CATEGORIES = categories;

      var filter = document.getElementById('productCategoryFilter');
      if (filter) {
        filter.innerHTML = '<option value="all">Tất cả danh mục</option>' +
          categories.map(function (c) {
            return '<option value="' + escapeHTML(c.name) + '">' + escapeHTML(c.name) + '</option>';
          }).join('');
      }

      var formSelect = document.getElementById('productFormCategory');
      if (formSelect) {
        formSelect.innerHTML = categories.map(function (c) {
          return '<option value="' + escapeHTML(c.name) + '">' + escapeHTML(c.name) + '</option>';
        }).join('');
      }

      renderProductsTable();
    });
}

function loadProducts() {
  fetch(PRODUCTS_PATH)
    .then(function (res) { return res.json(); })
    .then(function (products) {
      ALL_PRODUCTS = products;
      renderProductsTable();
    })
    .catch(function (err) {
      console.error(err);
      showToast('Không tải được dữ liệu sản phẩm', 'error');
    });
}

function getFilteredProducts() {
  var search = state.search;
  return ALL_PRODUCTS.filter(function (p) {
    var okSearch = !search || (p.name || '').toLowerCase().indexOf(search) !== -1 || (p.sku || '').toLowerCase().indexOf(search) !== -1;

    var okCat = state.category === 'all' || (p.category || '') === state.category;

    var okStock = true;
    if (state.stock === 'low') okStock = p.status === 'low_stock' || (p.stock != null && p.stock < 50);
    if (state.stock === 'out') okStock = p.status === 'out_of_stock' || (p.stock === 0);

    var okStatus = true;
    if (state.status === 'active') okStatus = p.status === 'in_stock' || (p.stock > 0);
    if (state.status === 'inactive') okStatus = p.status === 'out_of_stock' || (p.stock === 0);

    return okSearch && okCat && okStock && okStatus;
  });
}

function ensurePaginationFooter() {
  var container = document.getElementById('productsTable');
  if (!container) return null;

  var footer = document.getElementById('productsPagination');
  if (footer) return footer;

  footer = document.createElement('div');
  footer.id = 'productsPagination';
  footer.className = 'pagination-wrap';
  container.parentElement.appendChild(footer);
  return footer;
}

function renderProductsTable() {
  var tbody = document.querySelector('#productsTable tbody');
  if (!tbody) return;

  var filtered = getFilteredProducts();

  var totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;

  var start = (state.page - 1) * state.pageSize;
  var pageItems = filtered.slice(start, start + state.pageSize);

  tbody.innerHTML = pageItems.map(function (p) {
    var statusBadge = p.status === 'in_stock' ? 'completed' : (p.status === 'low_stock' ? 'pending' : 'shipping');
    var statusText = p.status === 'in_stock' ? ('Còn ' + p.stock) : (p.status === 'low_stock' ? ('Sắp hết · ' + p.stock) : 'Hết hàng');
    var oldPriceHtml = p.oldPrice && p.oldPrice > p.price ? '<span class="cell-price-old">' + formatVND(p.oldPrice) + '</span>' : '';
    return '' +
      '<tr data-id="' + p.id + '">' +
      '<td class="cell-product"><img src="' + p.image + '" alt="' + escapeHTML(p.name) + '">' +
      '<div><div class="cell-product-name">' + escapeHTML(p.name) + '</div>' +
      '<div class="cell-product-sub">SKU: ' + escapeHTML(p.sku) + ' | ' + escapeHTML(p.category) + '</div></div></td>' +
      '<td><strong>' + formatVND(p.price) + '</strong> ' + oldPriceHtml + '</td>' +
      '<td>' + p.stock + '</td>' +
      '<td><span class="badge ' + statusBadge + '">' + statusText + '</span></td>' +
      '<td class="row-actions">' +
      '<button class="icon-btn edit-product" title="Sửa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg></button>' +
      '<button class="icon-btn danger delete-product" title="Xóa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/></svg></button>' +
      '</td>' +
      '</tr>';
  }).join('');

  tbody.querySelectorAll('.edit-product').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = parseInt(btn.closest('tr').getAttribute('data-id'), 10);
      openProductForm(id);
    });
  });

  tbody.querySelectorAll('.delete-product').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = parseInt(btn.closest('tr').getAttribute('data-id'), 10);
      deleteProduct(id);
    });
  });

  var pag = ensurePaginationFooter();
  if (pag) {
    renderPagination(pag, state.page, totalPages, function (nextPage) {
      state.page = nextPage;
      renderProductsTable();
    });
  }
}

var editingProductId = null;
function openProductForm(id) {
  var product = id ? ALL_PRODUCTS.find(function (p) { return p.id === id; }) : null;
  editingProductId = id || null;

  document.getElementById('productFormTitle').textContent = product ? 'Sửa sản phẩm' : 'Thêm sản phẩm';
  document.getElementById('productFormName').value = product ? product.name : '';
  document.getElementById('productFormSku').value = product ? product.sku : '';
  document.getElementById('productFormPrice').value = product ? product.price : '';
  document.getElementById('productFormStock').value = product ? product.stock : '';
  document.getElementById('productFormImage').value = product ? product.image : '';

  // category select options already loaded in loadCategories
  var catSelect = document.getElementById('productFormCategory');
  if (catSelect) {
    if (!catSelect.options || catSelect.options.length === 0) {
      catSelect.innerHTML = (ALL_CATEGORIES || []).map(function (c) {
        return '<option value="' + escapeHTML(c.name) + '">' + escapeHTML(c.name) + '</option>';
      }).join('');
    }

    var catVal = product ? product.category : (ALL_CATEGORIES[0] ? ALL_CATEGORIES[0].name : '');
    catSelect.value = catVal;
  }


  openModal('productFormModal');
}

function saveProductForm() {
  var name = document.getElementById('productFormName').value.trim();
  var sku = document.getElementById('productFormSku').value.trim();
  var category = document.getElementById('productFormCategory').value;
  var price = parseInt(document.getElementById('productFormPrice').value) || 0;
  var stock = parseInt(document.getElementById('productFormStock').value) || 0;
  var image = document.getElementById('productFormImage').value.trim();

  if (!name || !sku) {
    showToast('Vui lòng nhập đầy đủ thông tin', 'error');
    return;
  }

  var status = stock > 0 ? (stock < 50 ? 'low_stock' : 'in_stock') : 'out_of_stock';

  if (editingProductId) {
    var payload = { name: name, sku: sku, category: category, price: price, stock: stock, status: status, image: image };
    fetch(PRODUCTS_PATH + '/' + editingProductId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function () {
        showToast('Đã cập nhật sản phẩm');
        closeModal('productFormModal');
        loadProducts();
      })
      .catch(function (err) {
        console.error(err);
        showToast('Cập nhật thất bại', 'error');
      });
  } else {
    var payloadAdd = { name: name, sku: sku, category: category, price: price, stock: stock, status: status, image: image };
    fetch(PRODUCTS_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadAdd)
    })
      .then(function (res) { return res.json(); })
      .then(function () {
        showToast('Đã thêm sản phẩm');
        closeModal('productFormModal');
        loadProducts();
      })
      .catch(function (err) {
        console.error(err);
        showToast('Thêm thất bại', 'error');
      });
  }
}

function deleteProduct(id) {
  if (!id && id !== 0) return;
  fetch(PRODUCTS_PATH + '/' + id, { method: 'DELETE' })
    .then(function () {
      showToast('Đã xóa sản phẩm');
      loadProducts();
    })
    .catch(function (err) {
      console.error(err);
      showToast('Xóa thất bại', 'error');
    });
}

