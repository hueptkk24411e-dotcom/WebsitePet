/* Grooming profile page: read bookings from localStorage and allow view/reschedule/cancel actions. */

var bookingsTableBody = document.querySelector('#bookingsTable tbody');
var bookingData = [];

function loadBookings() {
  try {
    bookingData = JSON.parse(localStorage.getItem('groomingBookings')) || [];
  } catch (err) {
    bookingData = [];
  }
  renderBookings();
}

function formatVND(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

function formatDateTime(isoString) {
  if (!isoString) return '-';
  var date = new Date(isoString);
  return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function renderBookings() {
  if (!bookingsTableBody) return;
  bookingsTableBody.innerHTML = '';
  bookingData.forEach(function (booking, index) {
    var row = document.createElement('tr');
    row.innerHTML = '<td>' + booking.bookingId + '</td>' +
      '<td>' + booking.serviceName + '</td>' +
      '<td>' + booking.appointmentDate + '</td>' +
      '<td>' + booking.appointmentTime + '</td>' +
      '<td>' + formatVND(booking.estimatedPrice) + '</td>' +
      '<td>' + booking.status + '</td>' +
      '<td>' + formatDateTime(booking.createdAt) + '</td>' +
      '<td>' +
         '<button class="action-btn" data-action="view" data-index="' + index + '">Xem</button>' +
         '<button class="action-btn" data-action="reschedule" data-index="' + index + '">Chuyển lịch</button>' +
         '<button class="action-btn" data-action="cancel" data-index="' + index + '">Hủy</button>' +
      '</td>';
    bookingsTableBody.appendChild(row);
  });
}

function handleAction(event) {
  var button = event.target.closest('.action-btn');
  if (!button) return;
  var index = Number(button.dataset.index);
  var action = button.dataset.action;
  var booking = bookingData[index];
  if (!booking) return;
  if (action === 'view') {
    alert('Chi tiết booking:\n' +
      'Mã đơn: ' + booking.bookingId + '\n' +
      'Dịch vụ: ' + booking.serviceName + '\n' +
      'Thú cưng: ' + booking.pet.name + '\n' +
      'Ngày: ' + booking.appointmentDate + '\n' +
      'Giờ: ' + booking.appointmentTime + '\n' +
      'Giá: ' + formatVND(booking.estimatedPrice) + '\n' +
      'Trạng thái: ' + booking.status);
  }
  if (action === 'reschedule') {
    var newDate = prompt('Ngày hẹn mới (YYYY-MM-DD)', booking.appointmentDate);
    var newTime = prompt('Giờ mới (ví dụ 14:00)', booking.appointmentTime);
    if (!newDate || !newTime) return;
    booking.appointmentDate = newDate;
    booking.appointmentTime = newTime;
    booking.status = 'Chuyển lịch';
    booking.createdAt = new Date().toISOString();
    persistBookings();
    renderBookings();
    alert('Chuyển lịch thành công');
  }
  if (action === 'cancel') {
    var confirmCancel = confirm('Xác nhận hủy booking ' + booking.bookingId + '?');
    if (!confirmCancel) return;
    booking.status = 'Đã hủy';
    persistBookings();
    renderBookings();
    alert('Hủy booking thành công');
  }
}

function persistBookings() {
  localStorage.setItem('groomingBookings', JSON.stringify(bookingData));
}

if (bookingsTableBody) {
  bookingsTableBody.addEventListener('click', handleAction);
}

document.addEventListener('DOMContentLoaded', loadBookings);
