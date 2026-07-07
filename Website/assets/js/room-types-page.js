console.log("HELLO! File room-types-page.js đã được tải thành công!");
/* =========================================================
   PETOPIA ADMIN PANEL — room-types-page.js
   CRUD phòng pet hotel: gọi API localhost:3500
   ========================================================= */

var ALL_ROOMS = [];
var ROOMS_PATH = 'http://localhost:3500/roomTypes';

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
  /* =========================================================
   PETOPIA ADMIN PANEL — room-types-page.js
   CRUD loại phòng pet hotel: gọi API localhost:3500
   ========================================================= */

var ALL_ROOMS = [];
var ALL_BOOKINGS = [];
var ROOMS_PATH = 'http://localhost:3500/roomTypes';
var BOOKINGS_PATH = 'http://localhost:3500/hotelBookings';

var state = {
  search: '',
  petTypeFilter: ''
};

var editingRoomId = null;

document.addEventListener('DOMContentLoaded', function () {
  requireAdmin(function () {
    bindEvents();
    loadRooms();
    loadBookings();
  });
});

function bindEvents() {
  var addBtn = document.getElementById('addRoomTypeBtn');
  if (addBtn) {
    addBtn.addEventListener('click', function () {
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

  var petTypeFilter = document.getElementById('petTypeFilter');
  if (petTypeFilter) {
    petTypeFilter.addEventListener('change', function (e) {
      state.petTypeFilter = e.target.value;
      renderRoomsTable();
    });
  }
}

function loadRooms() {
  fetch(ROOMS_PATH)
    .then(function (res) { return res.json(); })
    .then(function (rooms) {
      ALL_ROOMS = Array.isArray(rooms) ? rooms : [];
      renderRoomsTable();
      updateStats();
    })
    .catch(function (err) {
      console.error(err);
      showToast('Không tải được dữ liệu loại phòng', 'error');
    });
}

function loadBookings() {
  fetch(BOOKINGS_PATH)
    .then(function (res) { return res.json(); })
    .then(function (bookings) {
      ALL_BOOKINGS = Array.isArray(bookings) ? bookings : [];
      updateStats();
    })
    .catch(function (err) {
      console.error('Error loading bookings:', err);
    });
}

function getFilteredRooms() {
  var search = state.search;
  var petType = state.petTypeFilter;

  return ALL_ROOMS.filter(function (r) {
    var nameMatch = !search || (r.name || '').toLowerCase().indexOf(search) !== -1;
    var petMatch = !petType || r.petType === petType;
    return nameMatch && petMatch;
  });
}

// Kiểm tra phòng còn trống hay đã đặt
function getRoomStatus(roomType) {
  var bookings = ALL_BOOKINGS.filter(function (b) {
    return b.roomType === roomType.name && 
           ['booked', 'confirmed', 'checkin'].indexOf(b.status) !== -1;
  });
  
  return {
    booked: bookings.length,
    total: bookings.length
  };
}

function renderRoomsTable() {
  var tbody = document.querySelector('#roomTypesTable tbody');
  if (!tbody) return;

  var filtered = getFilteredRooms();

  tbody.innerHTML = filtered.map(function (r) {
    var status = getRoomStatus(r);
    var statusText = status.booked > 0 ? '✓ Có đặt' : '○ Trống';
    var statusClass = status.booked > 0 ? 'badge-warning' : 'badge-success';
    var petTypeText = r.petType === 'dog' ? '🐕 Chó' : '🐈 Mèo';

    return '' +
      '<tr data-id="' + r.id + '">' +
      '<td class="cell-product"><img src="' + (r.image || '') + '" alt="' + escapeHTML(r.name) + '" style="width:50px;height:50px;border-radius:4px;object-fit:cover;"> <div><strong>' + escapeHTML(r.name) + '</strong><br><small>' + petTypeText + '</small></div></td>' +
      '<td>' + escapeHTML(r.size || '-') + '</td>' +
      '<td>' + formatVND(r.price) + '/đêm</td>' +
      '<td><div class="truncate" title="' + escapeHTML(r.description || '') + '">' + (r.description ? escapeHTML(r.description.substring(0, 50)) + '...' : '-') + '</div></td>' +
      '<td><span class="badge ' + statusClass + '">' + statusText + '</span></td>' +
      '<td class="row-actions">' +
      '<button class="icon-btn view-room" title="Xem chi tiết"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>' +
      '<button class="icon-btn edit-room" title="Sửa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg></button>' +
      '<button class="icon-btn danger delete-room" title="Xóa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/></svg></button>' +
      '</td>' +
      '</tr>';
  }).join('');

  // Bind view button
  tbody.querySelectorAll('.view-room').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = parseInt(btn.closest('tr').getAttribute('data-id'), 10);
      viewRoomDetail(id);
    });
  });

  // Bind edit button
  tbody.querySelectorAll('.edit-room').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = parseInt(btn.closest('tr').getAttribute('data-id'), 10);
      openRoomForm(id);
    });
  });

  // Bind delete button
  tbody.querySelectorAll('.delete-room').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = parseInt(btn.closest('tr').getAttribute('data-id'), 10);
      var ok = window.confirm('Bạn có chắc muốn xóa loại phòng này?');
      if (!ok) return;
      deleteRoom(id);
    });
  });
}

function updateStats() {
  var totalEl = document.getElementById('totalRooms');
  var dogEl = document.getElementById('dogRooms');
  var catEl = document.getElementById('catRooms');
  var bookedEl = document.getElementById('bookedRooms');

  if (!totalEl) return;

  var dogCount = ALL_ROOMS.filter(function (r) { return r.petType === 'dog'; }).length;
  var catCount = ALL_ROOMS.filter(function (r) { return r.petType === 'cat'; }).length;
  
  var bookedRoomTypes = [];
  ALL_BOOKINGS.forEach(function (b) {
    if (['booked', 'confirmed', 'checkin'].indexOf(b.status) !== -1) {
      if (bookedRoomTypes.indexOf(b.roomType) === -1) {
        bookedRoomTypes.push(b.roomType);
      }
    }
  });

  totalEl.textContent = ALL_ROOMS.length;
  dogEl.textContent = dogCount;
  catEl.textContent = catCount;
  bookedEl.textContent = bookedRoomTypes.length;
}

function viewRoomDetail(id) {
  var room = ALL_ROOMS.find(function (r) { return r.id === id; });
  if (!room) return;

  var bookings = ALL_BOOKINGS.filter(function (b) {
    return b.roomType === room.name && 
           ['booked', 'confirmed', 'checkin'].indexOf(b.status) !== -1;
  });

  var petTypeText = room.petType === 'dog' ? 'Chó' : 'Mèo';

  var html = '' +
    '<div class="detail-container">' +
    '<div class="detail-image-section">' +
    '<img src="' + (room.image || '') + '" alt="' + escapeHTML(room.name) + '" class="detail-image">' +
    '</div>' +
    '<div class="detail-info-section">' +
    '<div class="detail-row">' +
    '<label>Tên loại phòng:</label>' +
    '<span><strong>' + escapeHTML(room.name) + '</strong></span>' +
    '</div>' +
    '<div class="detail-row">' +
    '<label>Loại pet:</label>' +
    '<span>' + petTypeText + '</span>' +
    '</div>' +
    '<div class="detail-row">' +
    '<label>Kích thước:</label>' +
    '<span>' + escapeHTML(room.size || '-') + '</span>' +
    '</div>' +
    '<div class="detail-row">' +
    '<label>Giá/đêm:</label>' +
    '<span class="price-highlight">' + formatVND(room.price) + '</span>' +
    '</div>' +
    '<div class="detail-row">' +
    '<label>Mô tả:</label>' +
    '<span>' + escapeHTML(room.description || '-') + '</span>' +
    '</div>' +
    '</div>' +
    '</div>';

  if (bookings.length > 0) {
    html += '<div class="bookings-section">' +
      '<h4>Đặt phòng hiện tại (' + bookings.length + ')</h4>' +
      '<div class="booking-list">';
    
    bookings.forEach(function (b) {
      var statusText = '';
      if (b.status === 'booked') statusText = 'Đã đặt';
      else if (b.status === 'confirmed') statusText = 'Đã xác nhận';
      else if (b.status === 'checkin') statusText = 'Đang ở';
      
      var petTypeEmoji = b.petType === 'dog' ? '🐕' : '🐈';

      html += '' +
        '<div class="booking-item">' +
        '<div class="booking-header">' +
        '<strong>' + petTypeEmoji + ' ' + escapeHTML(b.petName) + '</strong> (' + escapeHTML(b.breed) + ')' +
        '<span class="badge">' + statusText + '</span>' +
        '</div>' +
        '<div class="booking-details">' +
        '<small>Khách: ' + escapeHTML(b.customerName) + '</small><br>' +
        '<small>Check-in: ' + formatDate(b.checkIn) + ' | Check-out: ' + formatDate(b.checkOut) + '</small><br>' +
        '<small>Phòng: ' + escapeHTML(b.roomNumber) + '</small>' +
        '</div>' +
        '</div>';
    });

    html += '</div></div>';
  }

  document.getElementById('bookingDetailContent').innerHTML = html;
  
  var editBtn = document.getElementById('bookingDetailEditBtn');
  editBtn.onclick = function () {
    closeModal('bookingDetailModal');
    openRoomForm(id);
  };

  openModal('bookingDetailModal');
}

function openRoomForm(id) {
  var room = id ? ALL_ROOMS.find(function (r) { return r.id === id; }) : null;
  editingRoomId = id || null;

  document.getElementById('roomFormTitle').textContent = room ? 'Sửa loại phòng' : 'Thêm loại phòng';
  document.getElementById('roomFormName').value = room ? (room.name || '') : '';
  document.getElementById('roomFormPetType').value = room ? (room.petType || '') : '';
  document.getElementById('roomFormSize').value = room ? (room.size || '') : '';
  document.getElementById('roomFormPrice').value = room ? (room.price || '') : '';
  document.getElementById('roomFormImage').value = room ? (room.image || '') : '';
  document.getElementById('roomFormDesc').value = room ? (room.description || '') : '';

  openModal('roomFormModal');
}

function saveRoomForm() {
  var name = document.getElementById('roomFormName').value.trim();
  var petType = document.getElementById('roomFormPetType').value.trim();
  var size = document.getElementById('roomFormSize').value.trim();
  var price = parseInt(document.getElementById('roomFormPrice').value) || 0;
  var image = document.getElementById('roomFormImage').value.trim();
  var desc = document.getElementById('roomFormDesc').value.trim();

  if (!name) {
    showToast('Vui lòng nhập tên loại phòng', 'error');
    return;
  }
  if (!petType) {
    showToast('Vui lòng chọn loại pet', 'error');
    return;
  }
  if (!size) {
    showToast('Vui lòng nhập kích thước phòng', 'error');
    return;
  }
  if (price <= 0) {
    showToast('Vui lòng nhập giá hợp lệ', 'error');
    return;
  }

  var payload = {
    name: name,
    petType: petType,
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

// Utility functions
function escapeHTML(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatVND(number) {
  if (!number) return '0';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}

function formatDate(dateStr) {
  var date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN');
}

function debounce(func, wait) {
  var timeout;
  return function executedFunction() {
    var later = function () {
      clearTimeout(timeout);
      func.apply(this, arguments);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
      showToast('Xóa thất bại', 'error');
    });
}