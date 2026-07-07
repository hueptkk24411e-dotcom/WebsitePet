/* =========================================================
   PETOPIA ADMIN PANEL — room-types-page.js
   CRUD phòng pet hotel: gọi API localhost:3500
   ========================================================= */

var ALL_ROOMS = [];
var ROOMS_PATH = 'http://localhost:3500/room-types';

var state = {
  search: ''
};

var editingRoomId = null;
var deletingRoomId = null;

document.addEventListener('DOMContentLoaded', function () {
  requireAdmin(function () {
    bindEvents();
    loadRooms();
  });
});

function bindEvents() {
  var addBtn = document.getElementById('addRoomTypeBtn');
  if (addBtn) {
    addBtn.addEventListener('click', function () {
      // Trường hợp backend 404: vẫn mở popup để user nhập
      openRoomForm(null);
    });
  }


  var saveBtn = document.getElementById('roomFormSaveBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveRoomForm);

  var searchInput = document.getElementById('roomTypeSearch');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(function (e) {
      state.search = e.target.value.trim().toLowerCase();
      renderRoomsTable();
    }, 200));
  }
}

function loadRooms() {
  fetch(ROOMS_PATH)
    .then(function (res) { return res.json(); })
    .then(function (rooms) {
      ALL_ROOMS = Array.isArray(rooms) ? rooms : [];
      renderRoomsTable();
    })
    .catch(function (err) {
      console.error(err);
      showToast('Không tải được dữ liệu loại phòng', 'error');
    });
}

function getFilteredRooms() {
  var search = state.search;
  if (!search) return ALL_ROOMS;
  return ALL_ROOMS.filter(function (r) {
    return (r.name || '').toLowerCase().indexOf(search) !== -1;
  });
}

function renderRoomsTable() {
  var tbody = document.querySelector('#roomTypesTable tbody');
  if (!tbody) return;

  var filtered = getFilteredRooms();

  tbody.innerHTML = filtered.map(function (r) {
    return '' +
      '<tr data-id="' + r.id + '">' +
      '<td class="cell-product"><img src="' + (r.image || '') + '" alt="' + escapeHTML(r.name) + '" style="width:40px;height:40px;border-radius:4px;"> ' + escapeHTML(r.name) + '</td>' +
      '<td>' + escapeHTML(r.size || '-') + '</td>' +
      '<td>' + formatVND(r.price) + '/đêm</td>' +
      '<td>' + escapeHTML(r.description || '-') + '</td>' +
      '<td class="row-actions">' +
      '<button class="icon-btn edit-room" title="Sửa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg></button>' +
      '<button class="icon-btn danger delete-room" title="Xóa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/></svg></button>' +
      '</td>' +
      '</tr>';
  }).join('');

  tbody.querySelectorAll('.edit-room').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = parseInt(btn.closest('tr').getAttribute('data-id'), 10);
      openRoomForm(id);
    });
  });

  tbody.querySelectorAll('.delete-room').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = parseInt(btn.closest('tr').getAttribute('data-id'), 10);
      deletingRoomId = id;
      var ok = window.confirm('Bạn có chắc muốn xóa loại phòng này?');
      if (!ok) return;
      deleteRoom(id);
    });
  });
}

function openRoomForm(id) {
  var room = id ? ALL_ROOMS.find(function (r) { return r.id === id; }) : null;
  editingRoomId = id || null;

  document.getElementById('roomFormTitle').textContent = room ? 'Sửa loại phòng' : 'Thêm loại phòng';
  document.getElementById('roomFormName').value = room ? (room.name || '') : '';
  document.getElementById('roomFormSize').value = room ? (room.size || '') : '';
  document.getElementById('roomFormPrice').value = room ? (room.price || '') : '';
  document.getElementById('roomFormImage').value = room ? (room.image || '') : '';
  document.getElementById('roomFormDesc').value = room ? (room.description || '') : '';

  openModal('roomFormModal');
}

function saveRoomForm() {
  var name = document.getElementById('roomFormName').value.trim();
  var size = document.getElementById('roomFormSize').value.trim();
  var price = parseInt(document.getElementById('roomFormPrice').value) || 0;
  var image = document.getElementById('roomFormImage').value.trim();
  var desc = document.getElementById('roomFormDesc').value.trim();

  if (!name) {
    showToast('Vui lòng nhập tên loại phòng', 'error');
    return;
  }

  var payload = {
    name: name,
    size: size,
    price: price,
    image: image,
    description: desc
  };

  if (editingRoomId) {
    fetch(ROOMS_PATH + '/' + editingRoomId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function () {
        showToast('Đã cập nhật loại phòng');
        closeModal('roomFormModal');
        loadRooms();
      })
      .catch(function (err) {
        console.error(err);
        showToast('Cập nhật thất bại', 'error');
      });
  } else {
    fetch(ROOMS_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function () {
        showToast('Đã thêm loại phòng');
        closeModal('roomFormModal');
        loadRooms();
      })
      .catch(function (err) {
        console.error(err);
        showToast('Thêm thất bại', 'error');
      });
  }
}

function deleteRoom(id) {
  if (!id && id !== 0) return;

  fetch(ROOMS_PATH + '/' + id, { method: 'DELETE' })
    .then(function () {
      showToast('Đã xóa loại phòng');
      loadRooms();
    })
    .catch(function (err) {
      console.error(err);
      showToast('Xóa thất bại', 'error');
    });
}

