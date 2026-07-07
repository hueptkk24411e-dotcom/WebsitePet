/* =========================================================
   PETOPIA ADMIN PANEL — admin-common.js
   Tiện ích dùng chung: sidebar, load data, toast, modal, format
   ========================================================= */

/* ---- Kiểm tra quyền truy cập admin ---- */
function checkAdminAuth() {
  var currentUser = JSON.parse(sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser') || 'null');
  if (!currentUser || currentUser.role !== 'admin') {
    window.location.href = '../login.html';
    return false;
  }
  return true;
}

function requireAdmin(callback) {
  if (typeof callback !== 'function') {
    return checkAdminAuth();
  }
  
  // Nếu trang web đã tải xong rồi thì chạy luôn
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    if (checkAdminAuth()) {
      callback();
    }
  } else {
    // Nếu trang web chưa tải xong thì mới chờ
    document.addEventListener('DOMContentLoaded', function () {
      if (checkAdminAuth()) {
        callback();
      }
    });
  }
}

function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser') || 'null');
}

function updateAdminProfile() {
  var user = getCurrentUser();
  if (user) {
    var profileMeta = document.querySelector('.profile-meta strong');
    var profileSpan = document.querySelector('.profile-meta span');
    if (profileMeta) profileMeta.textContent = user.name || 'Admin';
    if (profileSpan) profileSpan.textContent = user.role === 'admin' ? 'Admin' : (user.role === 'staff' ? 'Nhân viên' : 'Khách hàng');
    var topbarSpan = document.querySelector('.admin-profile-btn span');
    if (topbarSpan) topbarSpan.textContent = user.name || 'Admin';
  }
}

/* ---- Sidebar toggle (giống admin-dashboard.js) ---- */
function initSidebarToggle() {
  var shell = document.getElementById('adminShell');
  var btn = document.getElementById('toggleSidebar');
  if (!btn || !shell) return;

  btn.addEventListener('click', function () {
    var isMobile = window.matchMedia('(max-width: 61.25rem)').matches;
    if (isMobile) {
      shell.classList.toggle('sidebar-open');
    } else {
      shell.classList.toggle('sidebar-collapsed');
    }
  });
}

/* ---- Format tiền VNĐ ---- */
function formatVND(n) {
  n = Number(n) || 0;
  return n.toLocaleString('vi-VN') + 'đ';
}

function formatNumber(n) {
  return Number(n || 0).toLocaleString('vi-VN');
}

/* ---- Load JSON (cache trong session để các trang dùng lại) ---- */
var __dataCache = {};
function loadJSON(path) {
  if (__dataCache[path]) return Promise.resolve(__dataCache[path]);
  return fetch(path)
    .then(function (res) {
      if (!res.ok) throw new Error('Không tải được dữ liệu: ' + path);
      return res.json();
    })
    .then(function (data) {
      __dataCache[path] = data;
      return data;
    });
}

/* ---- Toast ---- */
function ensureToastStack() {
  var stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}

function showToast(message, type) {
  type = type || 'success';
  var stack = ensureToastStack();
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;

  var icon = type === 'success'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';

  toast.innerHTML = icon + '<span>' + message + '</span>';
  stack.appendChild(toast);

  setTimeout(function () {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.2s ease';
    setTimeout(function () { toast.remove(); }, 200);
  }, 2600);
}

/* ---- Modal helpers ---- */
function openModal(id) {
  var overlay = document.getElementById(id);
  if (!overlay) {
    console.error('[admin-common] openModal: not found element id =', id);
    return;
  }
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}


function closeModal(id) {
  var overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function initModalDismiss() {
  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
  document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      closeModal(btn.getAttribute('data-close-modal'));
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(function (o) {
        closeModal(o.id);
      });
    }
  });
}

/* ---- Debounce (dùng cho search input) ---- */
function debounce(fn, delay) {
  var timer = null;
  return function () {
    var args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () { fn.apply(null, args); }, delay || 250);
  };
}

/* ---- Escape HTML (tránh injection khi render tên do người dùng nhập) ---- */
function escapeHTML(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---- Render thanh phân trang ---- */
function renderPagination(container, current, totalPages, onChange) {
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  var html = '';
  html += '<button class="page-btn" data-page="prev" ' + (current === 1 ? 'disabled' : '') + '>' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>';

  var pages = [];
  var windowSize = 1;
  for (var p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - current) <= windowSize) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  pages.forEach(function (p) {
    if (p === '...') {
      html += '<span class="page-btn" style="border:none;background:transparent;cursor:default;">…</span>';
    } else {
      html += '<button class="page-btn ' + (p === current ? 'active' : '') + '" data-page="' + p + '">' + p + '</button>';
    }
  });

  html += '<button class="page-btn" data-page="next" ' + (current === totalPages ? 'disabled' : '') + '>' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>';

  container.innerHTML = html;

  container.querySelectorAll('.page-btn[data-page]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var val = btn.getAttribute('data-page');
      var next = current;
      if (val === 'prev') next = current - 1;
      else if (val === 'next') next = current + 1;
      else next = parseInt(val, 10);
      if (next >= 1 && next <= totalPages && next !== current) onChange(next);
    });
  });
}

function autoBindAddButtons() {
  // Global fallback: nếu trang nào đó không bind click cho nút Add,
  // vẫn mở modal dựa theo map id nút -> id modal.
  var map = {
    addCategoryBtn: 'categoryFormModal',
    addProductBtn: 'productFormModal',
    addUserBtn: 'userFormModal',
    addRoomTypeBtn: 'roomFormModal'
  };

  Object.keys(map).forEach(function (btnId) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    if (btn.__autoBindPatched) return;
    btn.__autoBindPatched = true;

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var modalId = map[btnId];
      openModal(modalId);
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  if (!checkAdminAuth()) return;
  initSidebarToggle();
  initModalDismiss();
  updateAdminProfile();
  autoBindAddButtons();
});

