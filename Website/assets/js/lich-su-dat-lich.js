const BOOKINGS_KEY = 'petProfileBookings';
var currentBookingFilter = 'all';

function getPetProfileBookings() {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function bpFormatVND(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('vi-VN') + ' VNĐ';
}

var BOOKING_STATUS_STYLES = {
  'Pending': { label: 'Chờ xác nhận', bg: '#fff8e1', color: '#f57c00' },
  'Booked': { label: 'Đã xác nhận', bg: '#e8f5e9', color: '#2e7d32' },
  'Confirmed': { label: 'Đã xác nhận', bg: '#e8f5e9', color: '#2e7d32' },
  'CheckedIn': { label: 'Đang lưu trú', bg: '#e3f2fd', color: '#1565c0' },
  'Completed': { label: 'Hoàn thành', bg: '#f3e5f5', color: '#6a1b9a' },
  'Cancelled': { label: 'Đã hủy', bg: '#ffebee', color: '#c62828' }
};

function bpStatusBadge(status) {
  const style = BOOKING_STATUS_STYLES[status] || BOOKING_STATUS_STYLES['Booked'];
  return `<span style="background:${style.bg};color:${style.color};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;">${style.label}</span>`;
}

function renderGroomingBookingCard(booking, index) {
  const petName = booking.pet && booking.pet.name ? booking.pet.name : '-';
  return `
    <div class="pet-card" style="border:1px solid #f0f0f0;border-radius:12px;padding:14px 16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong style="color:#ff6600;"><i class="fa-solid fa-spa"></i> ${booking.serviceName || 'Dịch vụ grooming'}</strong>
        ${bpStatusBadge(booking.status)}
      </div>
      <div style="font-size:13px;color:#555;line-height:1.8;">
        <p style="margin:0;"><b>Mã đơn:</b> ${booking.bookingId || '-'}</p>
        <p style="margin:0;"><b>Thú cưng:</b> ${petName}</p>
        <p style="margin:0;"><b>Ngày giờ:</b> ${booking.appointmentDate || '-'} ${booking.appointmentTime || ''}</p>
        <p style="margin:0;"><b>Giá:</b> ${bpFormatVND(booking.estimatedPrice)}</p>
      </div>
    </div>
  `;
}

function renderHotelBookingCard(booking, index) {
  const petName = booking.pet && booking.pet.name ? booking.pet.name : '-';
  return `
    <div class="pet-card" style="border:1px solid #f0f0f0;border-radius:12px;padding:14px 16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong style="color:#ff6600;"><i class="fa-solid fa-hotel"></i> ${booking.roomName || 'Phòng lưu trú'}</strong>
        ${bpStatusBadge(booking.status)}
      </div>
      <div style="font-size:13px;color:#555;line-height:1.8;">
        <p style="margin:0;"><b>Mã đơn:</b> ${booking.bookingId || '-'}</p>
        <p style="margin:0;"><b>Thú cưng:</b> ${petName}</p>
        <p style="margin:0;"><b>Nhận phòng:</b> ${booking.checkIn || '-'} &nbsp; <b>Trả phòng:</b> ${booking.checkOut || '-'}</p>
        <p style="margin:0;"><b>Số đêm:</b> ${booking.nights || '-'}</p>
        <p style="margin:0;"><b>Tổng tiền:</b> ${bpFormatVND(booking.totalPrice)}</p>
      </div>
    </div>
  `;
}

function setBookingFilter(filter) {
  currentBookingFilter = filter;
  updateBookingFilterUI();
  renderBookingHistory(filter);
}

function updateBookingFilterUI() {
  const buttons = document.querySelectorAll('#bookingFilterTabs .booking-filter-btn');
  buttons.forEach(function(btn) {
    var onclickAttr = btn.getAttribute('onclick') || '';
    var isActive = onclickAttr.includes("'" + currentBookingFilter + "'");
    btn.classList.toggle('active', isActive);
    if (isActive) {
      btn.style.background = '#ff6600';
      btn.style.color = 'white';
      btn.style.borderColor = '#ff6600';
    } else {
      btn.style.background = 'white';
      btn.style.color = '#888';
      btn.style.borderColor = '#ddd';
    }
  });
}

function renderBookingHistory(filter) {
  const container = document.getElementById('bookingHistoryList');
  if (!container) return;

  var bookings = getPetProfileBookings().slice().sort(function (a, b) {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  if (filter && filter !== 'all') {
    bookings = bookings.filter(function(b) { return b.type === filter; });
  }

  if (!bookings.length) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:#aaa;">Chưa có đơn đặt lịch nào.</div>';
    return;
  }

  container.innerHTML = bookings.map(function (booking, index) {
    if (booking.type === 'hotel') return renderHotelBookingCard(booking, index);
    return renderGroomingBookingCard(booking, index);
  }).join('');
}

document.addEventListener('DOMContentLoaded', function () {
  currentBookingFilter = 'all';
  updateBookingFilterUI();
  renderBookingHistory('all');
});
