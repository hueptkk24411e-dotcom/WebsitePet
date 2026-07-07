/* =========================================================
   PETOPIA ADMIN PANEL — bookings-page.js
   Trang quản lý đặt phòng Pet Hotel: tải dữ liệu giả lập từ json-server.
   ========================================================= */

var HOTEL_BOOKINGS_PATH = 'http://localhost:3500/hotelBookings';
var hotelBookings = [];

document.addEventListener('DOMContentLoaded', function () {
  fetchHotelBookings();

  var addBtn = document.getElementById('addBookingBtn');
  if (addBtn) {
    addBtn.addEventListener('click', function () {
      showToast('Dữ liệu đặt phòng mẫu đang được quản lý trong db.json', 'success');
    });
  }
});

function fetchHotelBookings() {
  fetch(HOTEL_BOOKINGS_PATH)
    .then(function (res) {
      if (!res.ok) throw new Error('Không tải được dữ liệu đặt phòng');
      return res.json();
    })
    .then(function (data) {
      hotelBookings = Array.isArray(data) ? data : [];
      renderHotelBookings();
    })
    .catch(function (err) {
      console.error(err);
      renderBookingError();
      showToast('Không tải được dữ liệu đặt phòng', 'error');
    });
}

function renderHotelBookings() {
  var tbody = document.getElementById('bookingsTableBody');
  if (!tbody) return;

  if (!hotelBookings.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--ink-400);padding:1.5rem;">Chưa có đặt phòng nào.</td></tr>';
    return;
  }

  tbody.innerHTML = hotelBookings.map(function (booking, index) {
    var petLabel = booking.petType === 'cat' ? 'Mèo' : 'Chó';
    var petText = escapeHTML(booking.petName) + '<div style="font-size:0.72rem;color:var(--ink-400);">' +
      petLabel + ' · ' + escapeHTML(booking.breed || '') + '</div>';
    var dateText = formatDateShort(booking.checkIn) + ' - ' + formatDateShort(booking.checkOut) +
      '<div style="font-size:0.72rem;color:var(--ink-400);">' + (booking.nights || countNights(booking.checkIn, booking.checkOut)) + ' đêm · ' + formatVND(booking.total) + '</div>';

    return '' +
      '<tr>' +
        '<td class="order-id">#' + escapeHTML(booking.bookingId || booking.id) + '</td>' +
        '<td>' + escapeHTML(booking.customerName) + '<div style="font-size:0.72rem;color:var(--ink-400);">' + escapeHTML(booking.customerPhone || '') + '</div></td>' +
        '<td>' + petText + '</td>' +
        '<td>' + escapeHTML(booking.roomType) + '<div style="font-size:0.72rem;color:var(--ink-400);">' + escapeHTML(booking.roomNumber || '') + '</div></td>' +
        '<td>' + dateText + '</td>' +
        '<td><span class="badge ' + getStatusClass(booking.status) + '">' + getStatusLabel(booking.status) + '</span></td>' +
        '<td class="row-actions">' +
          '<button class="icon-btn" title="Xem chi tiết" data-index="' + index + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg>' +
          '</button>' +
        '</td>' +
      '</tr>';
  }).join('');

  tbody.querySelectorAll('.icon-btn[data-index]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showBookingDetail(Number(btn.getAttribute('data-index')));
    });
  });
}

function renderBookingError() {
  var tbody = document.getElementById('bookingsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--orange-600);padding:1.5rem;">Không tải được dữ liệu. Hãy chạy npm run json-server.</td></tr>';
}

function getStatusClass(status) {
  switch (status) {
    case 'confirmed': return 'confirmed';
    case 'checkin': return 'checkin';
    case 'completed': return 'completed';
    case 'cancelled': return 'shipping';
    default: return 'booked';
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'confirmed': return 'Đã xác nhận';
    case 'checkin': return 'Check-in';
    case 'completed': return 'Hoàn thành';
    case 'cancelled': return 'Đã hủy';
    default: return 'Chờ xác nhận';
  }
}

function formatDateShort(value) {
  if (!value) return '-';
  var date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function countNights(checkIn, checkOut) {
  var start = new Date(checkIn);
  var end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
}

function showBookingDetail(index) {
  var booking = hotelBookings[index];
  if (!booking) return;

  alert(
    'Chi tiết đặt phòng\\n' +
    'Mã đặt: ' + (booking.bookingId || booking.id) + '\\n' +
    'Khách hàng: ' + booking.customerName + ' - ' + (booking.customerPhone || '') + '\\n' +
    'Thú cưng: ' + booking.petName + ' (' + (booking.petType === 'cat' ? 'Mèo' : 'Chó') + ', ' + (booking.breed || '-') + ')\\n' +
    'Phòng: ' + booking.roomType + ' - ' + (booking.roomNumber || '-') + '\\n' +
    'Ngày: ' + booking.checkIn + ' đến ' + booking.checkOut + '\\n' +
    'Đưa đón: ' + (booking.pickup ? 'Có' : 'Không') + '\\n' +
    'Tổng tiền: ' + formatVND(booking.total) + '\\n' +
    'Ghi chú: ' + (booking.notes || '-')
  );
}
