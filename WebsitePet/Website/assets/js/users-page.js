    /* =========================================================
    PETOPIA ADMIN PANEL — users-page.js
    Trang quản lý người dùng: dùng dữ liệu tĩnh từ dataset
    ========================================================= */

    var ALL_USERS = [];
    var USERS_PATH = 'http://localhost:3500/users';

    var state = {
    search: '',
    page: 1,
    pageSize: 8
    };

 
document.addEventListener('DOMContentLoaded', function () {
    bindEvents();
    loadUsers();
});


    function bindEvents() {
      
    var addBtn = document.getElementById('addUserBtn');
    if (addBtn) addBtn.addEventListener('click', function () { openUserForm(null); });



var saveBtn = document.getElementById('userFormSaveBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveUserForm);


    var deleteBtn = document.getElementById('userDeleteConfirmBtn');
    if (deleteBtn) deleteBtn.addEventListener('click', confirmDeleteUser);

    var searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function (e) {
        state.search = e.target.value.trim().toLowerCase();
        state.page = 1;
        renderUsersTable();
        }, 200));
    }
    }

    function loadUsers() {
    fetch(USERS_PATH)
        .then(function (res) { return res.json(); })
        .then(function (users) {
        ALL_USERS = users;
        renderUsersTable();
        })
        .catch(function (err) {
        console.error(err);
        showToast('Không tải được dữ liệu người dùng', 'error');
        });
    }

    function getFilteredUsers() {
    var search = state.search;
    return ALL_USERS.filter(function (u) {
        if (!search) return true;
        var name = (u.name || '').toLowerCase();
        var email = (u.email || '').toLowerCase();
        return name.indexOf(search) !== -1 || email.indexOf(search) !== -1;
    });
    }

    function ensurePaginationFooter() {
    // Trang users.html hiện không có element pagination cố định.
    // Nếu Chart/pagination CSS cần, vẫn render động ở đây.
    // Nhưng không bắt buộc: nếu renderPagination không có container thì bỏ qua.
    var container = document.getElementById('usersTable');
    if (!container) return null;

    var footer = document.getElementById('usersPagination');
    if (footer) return footer;

    footer = document.createElement('div');
    footer.id = 'usersPagination';
    footer.className = 'pagination-wrap';
    container.parentElement.appendChild(footer);
    return footer;
    }

    function renderUsersTable() {
    var tbody = document.querySelector('#usersTable tbody');
    if (!tbody) return;

    var filtered = getFilteredUsers();

    var totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;

    var start = (state.page - 1) * state.pageSize;
    var pageItems = filtered.slice(start, start + state.pageSize);

    tbody.innerHTML = pageItems.map(function (u) {
        var roleBadge = u.role === 'admin' ? 'completed' : (u.role === 'staff' ? 'pending' : '');
        var roleText = u.role === 'admin' ? 'Admin' : (u.role === 'staff' ? 'Nhân viên' : 'Khách hàng');
        return '' +
        '<tr data-id="' + u.id + '">' +
        '<td><img src="../assets/img/admin/avatar-dog.png" alt="' + escapeHTML(u.name) + '" style="width:32px;height:32px;border-radius:50%;margin-right:8px;vertical-align:middle;">' + escapeHTML(u.name) + '</td>' +
        '<td>' + escapeHTML(u.email) + '</td>' +
        '<td>' + escapeHTML(u.phone || '-') + '</td>' +
        '<td><span class="badge ' + roleBadge + '">' + roleText + '</span></td>' +
        '<td>' + escapeHTML(u.createdAt || '-') + '</td>' +
        '<td class="row-actions">' +
        '<button class="icon-btn edit-user" title="Sửa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg></button>' +
        '<button class="icon-btn danger delete-user" title="Xóa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/></svg></button>' +
        '</td>' +
        '</tr>';
    }).join('');

    pageItems.forEach(function () {});

    tbody.querySelectorAll('.edit-user').forEach(function (btn) {
        btn.addEventListener('click', function () {
        var id = parseInt(btn.closest('tr').getAttribute('data-id'), 10);
        openUserForm(id);
        });
    });

    tbody.querySelectorAll('.delete-user').forEach(function (btn) {
        btn.addEventListener('click', function () {
        var id = parseInt(btn.closest('tr').getAttribute('data-id'), 10);
        openDeleteUser(id);
        });
    });

    var pag = ensurePaginationFooter();
    if (pag) {
        renderPagination(pag, state.page, totalPages, function (nextPage) {
        state.page = nextPage;
        renderUsersTable();
        });
    }
    }

    var editingUserId = null;
    function openUserForm(id) {
    var user = id ? ALL_USERS.find(function (u) { return u.id === id; }) : null;
    editingUserId = id || null;

    document.getElementById('userFormTitle').textContent = user ? 'Sửa người dùng' : 'Thêm người dùng';
    document.getElementById('userFormName').value = user ? user.name : '';
    document.getElementById('userFormEmail').value = user ? user.email : '';
    document.getElementById('userFormPhone').value = user ? (user.phone || '') : '';
    document.getElementById('userFormRole').value = user ? user.role : 'customer';

    var pwEl = document.getElementById('userFormPassword');
    if (pwEl) pwEl.value = '';

    openModal('userFormModal');

}

function saveUserForm() {
    console.log(3); 
  var name = document.getElementById('userFormName').value.trim();
  var email = document.getElementById('userFormEmail').value.trim();
  var phone = document.getElementById('userFormPhone').value.trim();
  var role = document.getElementById('userFormRole').value;
  var password = (document.getElementById('userFormPassword') && document.getElementById('userFormPassword').value.trim()) || '';

  if (!name || !email) {
    showToast('Vui lòng nhập đầy đủ thông tin', 'error');
    return;
  }

  if (editingUserId) {
var payload = { name: name, email: email, phone: phone, role: role };
    // backend có thể không cần/không cho update password
    if (password && password.length > 0) payload.password = password;


    fetch(USERS_PATH + '/' + editingUserId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function () {
        showToast('Đã cập nhật người dùng');
        closeModal('userFormModal');
        loadUsers();
      })
      .catch(function (err) {
        console.error(err);
        showToast('Cập nhật thất bại', 'error');
      });
  } else {
    var newPayload = {
      name: name,
      email: email,
      phone: phone,
      role: role,
      password: password || '123456',
      createdAt: new Date().toLocaleDateString('vi-VN')
    };

    fetch(USERS_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPayload)
    })
      .then(function (res) { return res.json(); })
      .then(function () {
        showToast('Đã thêm người dùng');
        closeModal('userFormModal');
        loadUsers();
      })
      .catch(function (err) {
        console.error(err);
        showToast('Thêm thất bại', 'error');
      });
  }
}

var deletingUserId = null;
function openDeleteUser(id) {
  var user = ALL_USERS.find(function (u) { return u.id === id; });
  deletingUserId = id;
  document.getElementById('userDeleteName').textContent = user ? user.name : '';
  openModal('userDeleteModal');
}

function confirmDeleteUser() {
  if (!deletingUserId) return;

  fetch(USERS_PATH + '/' + deletingUserId, {
    method: 'DELETE'
  })
    .then(function () {
      showToast('Đã xóa người dùng');
      closeModal('userDeleteModal');
      loadUsers();
    })
    .catch(function (err) {
      console.error(err);
      showToast('Xóa thất bại', 'error');
    });
}

