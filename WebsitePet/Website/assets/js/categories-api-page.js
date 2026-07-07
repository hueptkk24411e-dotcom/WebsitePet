/* =========================================================
   PETOPIA ADMIN PANEL — categories-api-page.js
   Trang Danh mục sản phẩm: dùng dữ liệu tĩnh từ dataset
   ========================================================= */

var ALL_CATEGORIES = [];
var CATEGORIES_PATH = 'http://localhost:3500/categories';

var state = {
  search: '',
  page: 1,
  pageSize: 8
};

document.addEventListener('DOMContentLoaded', function () {
  bindEvents();
  loadCategories();
});


function bindEvents() {
  var addBtn = document.getElementById('addCategoryBtn');
  if (addBtn) addBtn.addEventListener('click', function () { openCategoryForm(null); });

  var saveBtn = document.getElementById('categoryFormSaveBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveCategoryForm);

  var deleteBtn = document.getElementById('categoryDeleteConfirmBtn');
  if (deleteBtn) deleteBtn.addEventListener('click', confirmDeleteCategory);

  var searchInput = document.getElementById('categorySearch');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(function (e) {
      state.search = e.target.value.trim().toLowerCase();
      state.page = 1;
      renderCategoriesTable();
    }, 200));
  }
}

function loadCategories() {
  fetch(CATEGORIES_PATH)
    .then(function (res) { return res.json(); })
    .then(function (categories) {
      ALL_CATEGORIES = categories;
      renderCategoriesTable();
    })
    .catch(function (err) {
      console.error(err);
      showToast('Không tải được dữ liệu danh mục', 'error');
    });
}

function getFilteredCategories() {
  var search = state.search;
  return ALL_CATEGORIES.filter(function (c) {
    if (!search) return true;
    return (c.name || '').toLowerCase().indexOf(search) !== -1;
  });
}

function ensurePaginationFooter() {
  var container = document.getElementById('categoryGrid');
  if (!container) return null;

  var footer = document.getElementById('categoriesPagination');
  if (footer) return footer;

  footer = document.createElement('div');
  footer.id = 'categoriesPagination';
  footer.className = 'pagination-wrap';
  container.parentElement.appendChild(footer);
  return footer;
}

function renderCategoriesTable() {
  var grid = document.getElementById('categoryGrid');
  var emptyState = document.getElementById('categoryEmptyState');

  if (!grid || !emptyState) return;

  var filtered = getFilteredCategories();

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  var totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;

  var start = (state.page - 1) * state.pageSize;
  var pageItems = filtered.slice(start, start + state.pageSize);

  grid.innerHTML = pageItems.map(function (c) {
    var img = c.image || 'https://placehold.co/400x300/e9f7ee/1b934b?text=Petopia';
    return '' +
      '<div class="category-card" data-id="' + c.id + '">' +
      '<div class="category-cover"><img src="' + img + '" alt="' + escapeHTML(c.name) + '"></div>' +
      '<div class="category-body">' +
      '<div class="category-stat-row"><span>' + escapeHTML(c.name) + '</span></div>' +
      '<div class="category-stat-row"><span>' + escapeHTML(c.description || '') + '</span></div>' +
      '</div>' +
      '<div class="category-footer">' +
      '<div class="category-actions">' +
      '<button class="icon-btn edit-cat" title="Sửa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg></button>' +
      '<button class="icon-btn danger delete-cat" title="Xóa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/></svg></button>' +
      '</div>' +
      '</div>' +
      '</div>';
  }).join('');

  pageItems.forEach(function () {});

  grid.querySelectorAll('.edit-cat').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var id = parseInt(btn.closest('.category-card').getAttribute('data-id'), 10);
      openCategoryForm(id);
    });
  });

  grid.querySelectorAll('.delete-cat').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var id = parseInt(btn.closest('.category-card').getAttribute('data-id'), 10);
      openDeleteCategory(id);
    });
  });

  var pag = ensurePaginationFooter();
  if (pag) {
    renderPagination(pag, state.page, totalPages, function (nextPage) {
      state.page = nextPage;
      renderCategoriesTable();
    });
  }
}

var editingCatId = null;
function openCategoryForm(id) {
  var cat = id ? ALL_CATEGORIES.find(function (c) { return c.id === id; }) : null;
  editingCatId = id || null;

  document.getElementById('categoryFormTitle').textContent = cat ? 'Sửa danh mục' : 'Thêm danh mục';
  document.getElementById('categoryFormName').value = cat ? cat.name : '';
  document.getElementById('categoryFormImage').value = cat ? (cat.image || '') : '';
  document.getElementById('categoryFormDesc').value = cat ? (cat.description || '') : '';

  openModal('categoryFormModal');

}

function saveCategoryForm() {
  var name = document.getElementById('categoryFormName').value.trim();
  var image = document.getElementById('categoryFormImage').value.trim();
  var desc = document.getElementById('categoryFormDesc').value.trim();

  if (!name) {
    showToast('Vui lòng nhập tên danh mục', 'error');
    return;
  }

  if (editingCatId) {
    var payload = { name: name, image: image, description: desc };
    fetch(CATEGORIES_PATH + '/' + editingCatId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function () {
        showToast('Đã cập nhật danh mục');
        closeModal('categoryFormModal');
        loadCategories();
      })
      .catch(function (err) {
        console.error(err);
        showToast('Cập nhật thất bại', 'error');
      });
  } else {
    var payloadAdd = { name: name, image: image, description: desc };
    fetch(CATEGORIES_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadAdd)
    })
      .then(function (res) { return res.json(); })
      .then(function () {
        showToast('Đã thêm danh mục');
        closeModal('categoryFormModal');
        loadCategories();
      })
      .catch(function (err) {
        console.error(err);
        showToast('Thêm thất bại', 'error');
      });
  }
}

var deletingCatId = null;
function openDeleteCategory(id) {
  var cat = ALL_CATEGORIES.find(function (c) { return c.id === id; });
  deletingCatId = id;
  document.getElementById('categoryDeleteName').textContent = cat ? cat.name : '';
  openModal('categoryDeleteModal');
}

function confirmDeleteCategory() {
  if (!deletingCatId) return;
  fetch(CATEGORIES_PATH + '/' + deletingCatId, { method: 'DELETE' })
    .then(function () {
      showToast('Đã xóa danh mục');
      closeModal('categoryDeleteModal');
      loadCategories();
    })
    .catch(function (err) {
      console.error(err);
      showToast('Xóa thất bại', 'error');
    });
}
