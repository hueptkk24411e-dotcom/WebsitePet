/* =========================================================
   PETOPIA — LỊCH SỬ ĐẶT LỊCH (Grooming + Hotel)
   File này là nguồn xử lý DUY NHẤT cho danh sách lịch sử
   đặt lịch, dùng chung cho:
     - Trang "Lịch sử đặt lịch" (#bookingHistoryList)
     - Tab "Đặt phòng" trong modal "Hồ sơ thú cưng" (#modalBookingHistoryList)
   Tính năng:
     - Xem chi tiết đơn (modal)
     - Hủy đơn (khi đơn còn ở trạng thái chờ/đã xác nhận)
     - Đánh giá dịch vụ khi đơn đã hoàn thành (theo flow yêu cầu)
     - Xem phản hồi của Petopia cho đánh giá đã gửi
   ========================================================= */

var BOOKINGS_KEY = 'petProfileBookings';
var REVIEWS_KEY = 'petopiaServiceReviews';
var ADMIN_NOTIF_KEY = 'petopiaAdminNotifications';
var RATINGS_KEY = 'petopiaServiceRatings';

var currentBookingFilter = 'all';
var bhCurrentBookingId = null;   // đơn đang mở trong modal chi tiết / đánh giá
var bhCurrentRating = 0;
var bhReviewImages = [];         // base64 preview cho ảnh đánh giá

/* ---------------------------------------------------------
   HÀM TIỆN ÍCH CHUNG
--------------------------------------------------------- */

function getPetProfileBookings() {
  try {
    var raw = localStorage.getItem(BOOKINGS_KEY);
    var list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function saveBookingHistoryList(list) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
}

function getServiceReviews() {
  try {
    var raw = localStorage.getItem(REVIEWS_KEY);
    var list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function saveServiceReviews(list) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(list));
}

function findReviewByBookingId(bookingId) {
  return getServiceReviews().find(function (r) { return r.bookingId === bookingId; });
}

function pushAdminNotification(notif) {
  try {
    var raw = localStorage.getItem(ADMIN_NOTIF_KEY);
    var list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];
    list.unshift(notif);
    localStorage.setItem(ADMIN_NOTIF_KEY, JSON.stringify(list));
  } catch (e) { /* noop */ }
}

function updateServiceRatingAggregate(type, targetId, rating) {
  try {
    var raw = localStorage.getItem(RATINGS_KEY);
    var map = raw ? JSON.parse(raw) : {};
    var key = type + ':' + targetId;
    var entry = map[key] || { sum: 0, count: 0 };
    entry.sum += Number(rating) || 0;
    entry.count += 1;
    map[key] = entry;
    localStorage.setItem(RATINGS_KEY, JSON.stringify(map));
  } catch (e) { /* noop */ }
}

function bpFormatVND(value) {
  var num = Number(value) || 0;
  return num.toLocaleString('vi-VN') + ' VNĐ';
}

function bhEscapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function bhToast(msg, type) {
  if (typeof showToast === 'function') {
    showToast(msg, type);
    return;
  }
  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);' +
    'background:' + (type === 'error' ? '#d32f2f' : '#2e7d32') + ';color:#fff;padding:10px 20px;' +
    'border-radius:8px;font-weight:600;z-index:10050;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-size:14px;';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function () {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(function () { toast.remove(); }, 300);
  }, 2500);
}

var BOOKING_STATUS_STYLES = {
  'Pending':   { label: 'Chờ xác nhận',  bg: '#fff8e1', color: '#f57c00' },
  'Booked':    { label: 'Đã xác nhận',   bg: '#e8f5e9', color: '#2e7d32' },
  'Confirmed': { label: 'Đã xác nhận',   bg: '#e8f5e9', color: '#2e7d32' },
  'CheckedIn': { label: 'Đang lưu trú',  bg: '#e3f2fd', color: '#1565c0' },
  'Completed': { label: 'Hoàn thành',    bg: '#f3e5f5', color: '#6a1b9a' },
  'Cancelled': { label: 'Đã hủy',        bg: '#ffebee', color: '#c62828' }
};

function bpStatusBadge(status) {
  var style = BOOKING_STATUS_STYLES[status] || BOOKING_STATUS_STYLES['Booked'];
  return '<span style="background:' + style.bg + ';color:' + style.color + ';padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;">' + style.label + '</span>';
}

var CANCELABLE_STATUSES = ['Pending', 'Booked', 'Confirmed'];

function bhIsCancelable(booking) {
  return CANCELABLE_STATUSES.indexOf(booking.status) !== -1;
}

function bhIsReviewable(booking) {
  return booking.status === 'Completed' && !booking.reviewed;
}

function bhFindIndexById(bookings, id) {
  return bookings.findIndex(function (b) { return (b.id || b.bookingId) === id; });
}

/* ---------------------------------------------------------
   TỰ ĐỘNG CHUYỂN TRẠNG THÁI "HOÀN THÀNH"
   Khi ngày hẹn grooming / ngày trả phòng hotel đã qua và đơn
   chưa bị hủy, hệ thống tự động đánh dấu "Hoàn thành" để mở
   khoá tính năng đánh giá dịch vụ.
--------------------------------------------------------- */
function autoCompleteBookings() {
  var bookings = getPetProfileBookings();
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var changed = false;

  bookings.forEach(function (b) {
    if (['Pending', 'Booked', 'Confirmed', 'CheckedIn'].indexOf(b.status) === -1) return;
    var refDateStr = b.type === 'hotel' ? b.checkOut : b.appointmentDate;
    if (!refDateStr) return;
    var refDate = new Date(refDateStr);
    if (isNaN(refDate.getTime())) return;
    refDate.setHours(0, 0, 0, 0);
    if (refDate < today) {
      b.status = 'Completed';
      changed = true;
    }
  });

  if (changed) saveBookingHistoryList(bookings);
}

/* ---------------------------------------------------------
   RENDER THẺ ĐƠN (card)
--------------------------------------------------------- */

function bhRenderActions(booking) {
  var id = booking.id || booking.bookingId;
  var btns = '<button type="button" class="bh-btn bh-btn-detail" onclick="openBookingDetail(\'' + id + '\')"><i class="fa-solid fa-eye"></i> Xem chi tiết</button>';

  if (bhIsCancelable(booking)) {
    btns += '<button type="button" class="bh-btn bh-btn-cancel" onclick="cancelBooking(\'' + id + '\')"><i class="fa-solid fa-ban"></i> Hủy đơn</button>';
  }

  if (bhIsReviewable(booking)) {
    btns += '<button type="button" class="bh-btn bh-btn-review" onclick="openReviewModal(\'' + id + '\')"><i class="fa-solid fa-star"></i> Đánh giá</button>';
  } else if (booking.reviewed) {
    btns += '<button type="button" class="bh-btn bh-btn-view-review" onclick="openBookingDetail(\'' + id + '\')"><i class="fa-solid fa-comment-dots"></i> Xem đánh giá</button>';
  }

  return '<div class="bh-actions">' + btns + '</div>';
}

function renderGroomingBookingCard(booking) {
  var petName = booking.pet && booking.pet.name ? booking.pet.name : '-';
  return (
    '<div class="pet-card bh-card" data-id="' + (booking.id || booking.bookingId) + '">' +
      '<div>' +
        '<strong><i class="fa-solid fa-spa"></i> ' + bhEscapeHtml(booking.serviceName || 'Dịch vụ grooming') + '</strong>' +
        bpStatusBadge(booking.status) +
      '</div>' +
      '<div style="font-size:13px;color:#555;line-height:1.8;">' +
        '<p><b>Mã đơn:</b> ' + bhEscapeHtml(booking.bookingId || '-') + '</p>' +
        '<p><b>Thú cưng:</b> ' + bhEscapeHtml(petName) + '</p>' +
        '<p><b>Ngày giờ:</b> ' + bhEscapeHtml(booking.appointmentDate || '-') + ' ' + bhEscapeHtml(booking.appointmentTime || '') + '</p>' +
        '<p><b>Giá:</b> ' + bpFormatVND(booking.estimatedPrice) + '</p>' +
      '</div>' +
      bhRenderActions(booking) +
    '</div>'
  );
}

function renderHotelBookingCard(booking) {
  var petName = booking.pet && booking.pet.name ? booking.pet.name : '-';
  return (
    '<div class="pet-card bh-card" data-id="' + (booking.id || booking.bookingId) + '">' +
      '<div>' +
        '<strong><i class="fa-solid fa-hotel"></i> ' + bhEscapeHtml(booking.roomName || 'Phòng lưu trú') + '</strong>' +
        bpStatusBadge(booking.status) +
      '</div>' +
      '<div style="font-size:13px;color:#555;line-height:1.8;">' +
        '<p><b>Mã đơn:</b> ' + bhEscapeHtml(booking.bookingId || '-') + '</p>' +
        '<p><b>Thú cưng:</b> ' + bhEscapeHtml(petName) + '</p>' +
        '<p><b>Nhận phòng:</b> ' + bhEscapeHtml(booking.checkIn || '-') + ' &nbsp; <b>Trả phòng:</b> ' + bhEscapeHtml(booking.checkOut || '-') + '</p>' +
        '<p><b>Số đêm:</b> ' + bhEscapeHtml(booking.nights || '-') + '</p>' +
        '<p><b>Tổng tiền:</b> ' + bpFormatVND(booking.totalPrice) + '</p>' +
      '</div>' +
      bhRenderActions(booking) +
    '</div>'
  );
}

/* ---------------------------------------------------------
   FILTER TABS
--------------------------------------------------------- */

function setBookingFilter(filter) {
  currentBookingFilter = filter;
  updateBookingFilterUI();
  renderBookingHistory(filter);
}

function updateBookingFilterUI() {
  var buttons = document.querySelectorAll('#modalBookingFilterTabs .booking-filter-btn, #bookingFilterTabs .booking-filter-btn');
  buttons.forEach(function (btn) {
    var onclickAttr = btn.getAttribute('onclick') || '';
    var isActive = onclickAttr.indexOf("'" + currentBookingFilter + "'") !== -1;
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

/* ---------------------------------------------------------
   RENDER DANH SÁCH (dùng chung cho cả 2 nơi hiển thị)
--------------------------------------------------------- */

function renderBookingHistory(filter) {
  autoCompleteBookings();

  var bookings = getPetProfileBookings().slice().sort(function (a, b) {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  if (filter && filter !== 'all') {
    bookings = bookings.filter(function (b) { return b.type === filter; });
  }

  var html;
  if (!bookings.length) {
    html = '<div style="text-align:center;padding:30px;color:#aaa;">Chưa có đơn đặt lịch nào.</div>';
  } else {
    html = bookings.map(function (booking) {
      return booking.type === 'hotel' ? renderHotelBookingCard(booking) : renderGroomingBookingCard(booking);
    }).join('');
  }

  ['bookingHistoryList', 'modalBookingHistoryList'].forEach(function (containerId) {
    var container = document.getElementById(containerId);
    if (container) container.innerHTML = html;
  });
}

/* ---------------------------------------------------------
   HỦY ĐƠN
--------------------------------------------------------- */

function cancelBooking(id) {
  var bookings = getPetProfileBookings();
  var idx = bhFindIndexById(bookings, id);
  if (idx === -1) return;
  var booking = bookings[idx];

  if (!bhIsCancelable(booking)) {
    bhToast('Đơn này không thể hủy ở trạng thái hiện tại.', 'error');
    return;
  }

  var label = booking.type === 'hotel' ? (booking.roomName || 'đơn đặt phòng') : (booking.serviceName || 'đơn grooming');
  if (!confirm('Bạn có chắc muốn hủy ' + label + ' (mã đơn: ' + (booking.bookingId || '-') + ')?')) return;

  booking.status = 'Cancelled';
  booking.cancelledAt = new Date().toISOString();
  saveBookingHistoryList(bookings);

  // Đồng bộ trạng thái sang hồ sơ thú cưng (petopia_pets) nếu có bản ghi tương ứng
  try {
    var pets = JSON.parse(localStorage.getItem('petopia_pets') || '[]');
    pets.forEach(function (p) {
      (p.bookings || []).forEach(function (rec) {
        if (rec.id === id) rec.status = 'Cancelled';
      });
    });
    localStorage.setItem('petopia_pets', JSON.stringify(pets));
  } catch (e) { /* noop */ }

  renderBookingHistory(currentBookingFilter);
  closeBookingDetailModal();
  bhToast('Đã hủy đơn thành công.');
}

/* ---------------------------------------------------------
   MODAL XEM CHI TIẾT ĐƠN
--------------------------------------------------------- */

function openBookingDetail(id) {
  var bookings = getPetProfileBookings();
  var booking = bookings.find(function (b) { return (b.id || b.bookingId) === id; });
  if (!booking) return;

  bhCurrentBookingId = id;
  var modal = document.getElementById('bookingDetailModal');
  var body = document.getElementById('bookingDetailBody');
  if (!modal || !body) return;

  var rows = '';
  if (booking.type === 'hotel') {
    rows += bhDetailRow('Loại dịch vụ', 'Đặt phòng khách sạn thú cưng');
    rows += bhDetailRow('Mã đơn', booking.bookingId);
    rows += bhDetailRow('Phòng', booking.roomName);
    rows += bhDetailRow('Thú cưng', booking.pet && booking.pet.name);
    rows += bhDetailRow('Giống / Cân nặng', (booking.pet && booking.pet.breed || '-') + ' • ' + (booking.pet && booking.pet.weight ? booking.pet.weight + ' kg' : '-'));
    rows += bhDetailRow('Nhận phòng', booking.checkIn);
    rows += bhDetailRow('Trả phòng', booking.checkOut);
    rows += bhDetailRow('Số đêm', booking.nights);
    rows += bhDetailRow('Đưa đón', booking.isPickup ? 'Có (+' + bpFormatVND(50000) + ')' : 'Không');
    rows += bhDetailRow('Số điện thoại', booking.customer && booking.customer.phone);
    rows += bhDetailRow('Tổng tiền', bpFormatVND(booking.totalPrice));
  } else {
    rows += bhDetailRow('Loại dịch vụ', 'Grooming');
    rows += bhDetailRow('Mã đơn', booking.bookingId);
    rows += bhDetailRow('Dịch vụ', booking.serviceName);
    rows += bhDetailRow('Thú cưng', booking.pet && booking.pet.name);
    rows += bhDetailRow('Giống / Cân nặng', (booking.pet && booking.pet.breed || '-') + ' • ' + (booking.pet && booking.pet.weight ? booking.pet.weight + ' kg' : '-'));
    rows += bhDetailRow('Ngày hẹn', booking.appointmentDate);
    rows += bhDetailRow('Giờ hẹn', booking.appointmentTime);
    rows += bhDetailRow('Khách hàng', booking.customer && booking.customer.name);
    rows += bhDetailRow('Số điện thoại', booking.customer && booking.customer.phone);
    if (booking.customer && booking.customer.notes) rows += bhDetailRow('Ghi chú', booking.customer.notes);
    rows += bhDetailRow('Giá ước tính', bpFormatVND(booking.estimatedPrice));
  }
  rows += bhDetailRow('Trạng thái', bpStatusBadge(booking.status));

  var actionsHtml = '<div class="bh-actions" style="margin-top:18px;">';
  if (bhIsCancelable(booking)) {
    actionsHtml += '<button type="button" class="bh-btn bh-btn-cancel" onclick="cancelBooking(\'' + id + '\')"><i class="fa-solid fa-ban"></i> Hủy đơn</button>';
  }
  if (bhIsReviewable(booking)) {
    actionsHtml += '<button type="button" class="bh-btn bh-btn-review" onclick="openReviewModal(\'' + id + '\')"><i class="fa-solid fa-star"></i> Đánh giá dịch vụ</button>';
  }
  actionsHtml += '</div>';

  var reviewHtml = booking.reviewed ? bhRenderReviewBlock(id) : '';

  body.innerHTML =
    '<div class="bh-detail-grid">' + rows + '</div>' +
    actionsHtml +
    reviewHtml;

  modal.style.display = 'flex';
}

function bhDetailRow(label, value) {
  return '<div class="bh-detail-row"><span class="bh-detail-label">' + bhEscapeHtml(label) + '</span><span class="bh-detail-value">' + (value || '-') + '</span></div>';
}

function closeBookingDetailModal() {
  var modal = document.getElementById('bookingDetailModal');
  if (modal) modal.style.display = 'none';
  bhCurrentBookingId = null;
}

/* ---------------------------------------------------------
   HIỂN THỊ ĐÁNH GIÁ ĐÃ GỬI + PHẢN HỒI CỦA PETOPIA
--------------------------------------------------------- */

function bhRenderReviewBlock(bookingId) {
  var review = findReviewByBookingId(bookingId);
  if (!review) return '';

  var stars = '';
  for (var i = 1; i <= 5; i++) {
    stars += '<i class="fa-solid fa-star" style="color:' + (i <= review.rating ? '#ffb300' : '#e0e0e0') + ';"></i>';
  }

  var imagesHtml = '';
  if (review.images && review.images.length) {
    imagesHtml = '<div class="bh-review-images">' + review.images.map(function (src) {
      return '<img src="' + src + '" alt="review-img">';
    }).join('') + '</div>';
  }

  var replyHtml = '';
  if (review.reply && review.reply.content) {
    replyHtml =
      '<div class="bh-reply-block">' +
        '<div class="bh-reply-title"><i class="fa-solid fa-paw"></i> Petopia đã phản hồi</div>' +
        '<div class="bh-reply-text">' + bhEscapeHtml(review.reply.content) + '</div>' +
      '</div>';
  } else {
    replyHtml = '<div class="bh-reply-pending"><i class="fa-regular fa-clock"></i> Đang chờ Petopia phản hồi...</div>';
  }

  return (
    '<div class="bh-review-block">' +
      '<div class="bh-review-title">Đánh giá của bạn</div>' +
      '<div class="bh-review-stars">' + stars + '</div>' +
      '<div class="bh-review-content">' + bhEscapeHtml(review.content) + '</div>' +
      imagesHtml +
      replyHtml +
    '</div>'
  );
}

/* ---------------------------------------------------------
   MODAL ĐÁNH GIÁ DỊCH VỤ
   Flow: mở modal -> chọn sao, nhập nội dung, ảnh (tùy chọn)
   -> hệ thống kiểm tra điều kiện -> lưu đánh giá -> cập nhật
   điểm trung bình dịch vụ -> báo cho admin -> hiển thị tại
   trang chi tiết đơn.
--------------------------------------------------------- */

function openReviewModal(id) {
  var bookings = getPetProfileBookings();
  var booking = bookings.find(function (b) { return (b.id || b.bookingId) === id; });

  // Kiểm tra điều kiện đánh giá: đơn phải tồn tại, đã hoàn thành và chưa được đánh giá
  if (!booking || !bhIsReviewable(booking)) {
    alert('Không thể đánh giá: chỉ có thể đánh giá đơn hàng/dịch vụ đã hoàn thành và chưa được đánh giá trước đó.');
    return;
  }

  bhCurrentBookingId = id;
  bhCurrentRating = 0;
  bhReviewImages = [];

  var nameEl = document.getElementById('reviewModalTargetName');
  if (nameEl) {
    nameEl.textContent = booking.type === 'hotel' ? (booking.roomName || 'Đặt phòng') : (booking.serviceName || 'Dịch vụ grooming');
  }

  var contentEl = document.getElementById('reviewContentInput');
  if (contentEl) contentEl.value = '';

  var imgPreview = document.getElementById('reviewImagePreview');
  if (imgPreview) imgPreview.innerHTML = '';

  var fileInput = document.getElementById('reviewImageInput');
  if (fileInput) fileInput.value = '';

  bhSetReviewStars(0);

  var modal = document.getElementById('reviewModal');
  if (modal) modal.style.display = 'flex';
}

function closeReviewModal() {
  var modal = document.getElementById('reviewModal');
  if (modal) modal.style.display = 'none';
}

function bhSetReviewStars(n) {
  bhCurrentRating = n;
  var stars = document.querySelectorAll('#reviewStarInput i');
  stars.forEach(function (star, idx) {
    star.style.color = (idx < n) ? '#ffb300' : '#e0e0e0';
  });
}

function handleReviewImageUpload(input) {
  var files = Array.prototype.slice.call(input.files || []);
  files.forEach(function (file) {
    if (!file.type || file.type.indexOf('image/') !== 0) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      bhReviewImages.push(e.target.result);
      bhRenderReviewImagePreview();
    };
    reader.readAsDataURL(file);
  });
}

function bhRenderReviewImagePreview() {
  var container = document.getElementById('reviewImagePreview');
  if (!container) return;
  container.innerHTML = bhReviewImages.map(function (src, idx) {
    return '<div class="bh-img-thumb"><img src="' + src + '"><button type="button" onclick="bhRemoveReviewImage(' + idx + ')">&times;</button></div>';
  }).join('');
}

function bhRemoveReviewImage(idx) {
  bhReviewImages.splice(idx, 1);
  bhRenderReviewImagePreview();
}

function submitReview() {
  var bookingId = bhCurrentBookingId;
  var bookings = getPetProfileBookings();
  var idx = bhFindIndexById(bookings, bookingId);
  var booking = idx !== -1 ? bookings[idx] : null;

  // Kiểm tra lại điều kiện hợp lệ ngay trước khi lưu (phòng trường hợp
  // trạng thái đơn đã thay đổi trong lúc người dùng đang nhập đánh giá)
  if (!booking || !bhIsReviewable(booking)) {
    alert('Không thể đánh giá: đơn hàng/dịch vụ không hợp lệ để đánh giá (chưa hoàn thành hoặc đã được đánh giá).');
    closeReviewModal();
    return;
  }

  if (!bhCurrentRating || bhCurrentRating < 1) {
    bhToast('Vui lòng chọn số sao đánh giá.', 'error');
    return;
  }

  var contentEl = document.getElementById('reviewContentInput');
  var content = contentEl ? contentEl.value.trim() : '';
  if (!content) {
    bhToast('Vui lòng nhập nội dung đánh giá.', 'error');
    return;
  }

  var targetId = booking.type === 'hotel' ? (booking.roomName || 'room') : (booking.serviceId || 'service');
  var targetName = booking.type === 'hotel' ? (booking.roomName || 'Đặt phòng') : (booking.serviceName || 'Dịch vụ grooming');
  var customerName = (booking.customer && (booking.customer.name || booking.pet && booking.pet.name)) || 'Khách hàng';

  var review = {
    id: 'RV' + Date.now(),
    bookingId: bookingId,
    type: booking.type,
    targetId: targetId,
    targetName: targetName,
    customer: customerName,
    rating: bhCurrentRating,
    content: content,
    images: bhReviewImages.slice(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    reply: null
  };

  var reviews = getServiceReviews();
  reviews.push(review);
  saveServiceReviews(reviews);

  // Cập nhật điểm đánh giá của dịch vụ/phòng
  updateServiceRatingAggregate(booking.type, targetId, bhCurrentRating);

  // Đánh dấu đơn đã được đánh giá để không thể đánh giá lại
  booking.reviewed = true;
  booking.reviewId = review.id;
  saveBookingHistoryList(bookings);

  // Thông báo cho nhân viên/admin có đánh giá mới
  pushAdminNotification({
    id: 'NOTI' + Date.now(),
    type: 'new_review',
    reviewId: review.id,
    message: 'Đánh giá mới ' + bhCurrentRating + '★ cho "' + targetName + '" từ ' + customerName,
    read: false,
    createdAt: new Date().toISOString()
  });

  closeReviewModal();
  renderBookingHistory(currentBookingFilter);
  bhToast('Đã gửi đánh giá thành công! Cảm ơn bạn đã phản hồi.');

  // Nếu modal chi tiết đơn đang mở đúng đơn này thì cập nhật lại nội dung
  var detailModal = document.getElementById('bookingDetailModal');
  if (detailModal && detailModal.style.display !== 'none' && bhCurrentBookingId === bookingId) {
    openBookingDetail(bookingId);
  }
}

/* ---------------------------------------------------------
   ĐẢM BẢO MODAL "CHI TIẾT ĐƠN" & "ĐÁNH GIÁ" TỒN TẠI
   Modal chi tiết + đánh giá được khai báo sẵn trong HTML của
   trang "Lịch sử đặt lịch". Với các trang khác cũng có modal
   "Hồ sơ thú cưng" (index.html, hotel.html, grooming.html...),
   hàm này sẽ tự chèn 2 modal trên vào <body> nếu chưa có, để
   nút "Xem chi tiết" / "Đánh giá" hoạt động ở mọi nơi.
--------------------------------------------------------- */
function bhEnsureModals() {
  if (!document.getElementById('bookingDetailModal')) {
    var detailWrap = document.createElement('div');
    detailWrap.innerHTML =
      '<div id="bookingDetailModal" class="bh-modal-overlay" style="display:none;">' +
        '<div class="bh-modal-box">' +
          '<div class="bh-modal-header">' +
            '<h3><i class="fa-solid fa-file-lines"></i> Chi tiết đơn</h3>' +
            '<button type="button" class="bh-modal-close" onclick="closeBookingDetailModal()">&times;</button>' +
          '</div>' +
          '<div class="bh-modal-body" id="bookingDetailBody"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(detailWrap.firstElementChild);
  }

  if (!document.getElementById('reviewModal')) {
    var reviewWrap = document.createElement('div');
    reviewWrap.innerHTML =
      '<div id="reviewModal" class="bh-modal-overlay" style="display:none;">' +
        '<div class="bh-modal-box">' +
          '<div class="bh-modal-header">' +
            '<h3><i class="fa-solid fa-star"></i> Đánh giá dịch vụ</h3>' +
            '<button type="button" class="bh-modal-close" onclick="closeReviewModal()">&times;</button>' +
          '</div>' +
          '<div class="bh-modal-body">' +
            '<p style="margin:0 0 14px;color:#555;">Bạn đang đánh giá: <strong id="reviewModalTargetName" style="color:#ff6600;">-</strong></p>' +
            '<label class="bh-form-label">Số sao</label>' +
            '<div id="reviewStarInput" class="bh-star-input">' +
              '<i class="fa-solid fa-star" onclick="bhSetReviewStars(1)"></i>' +
              '<i class="fa-solid fa-star" onclick="bhSetReviewStars(2)"></i>' +
              '<i class="fa-solid fa-star" onclick="bhSetReviewStars(3)"></i>' +
              '<i class="fa-solid fa-star" onclick="bhSetReviewStars(4)"></i>' +
              '<i class="fa-solid fa-star" onclick="bhSetReviewStars(5)"></i>' +
            '</div>' +
            '<label class="bh-form-label">Nội dung đánh giá</label>' +
            '<textarea id="reviewContentInput" rows="4" placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ..."></textarea>' +
            '<label class="bh-form-label">Hình ảnh (tùy chọn)</label>' +
            '<input type="file" id="reviewImageInput" accept="image/*" multiple onchange="handleReviewImageUpload(this)">' +
            '<div id="reviewImagePreview" class="bh-img-preview"></div>' +
            '<div class="bh-actions" style="margin-top:18px;">' +
              '<button type="button" class="bh-btn bh-btn-review" onclick="submitReview()"><i class="fa-solid fa-paper-plane"></i> Gửi đánh giá</button>' +
              '<button type="button" class="bh-btn bh-btn-detail" onclick="closeReviewModal()">Hủy</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(reviewWrap.firstElementChild);
  }
}

/* ---------------------------------------------------------
   KHỞI TẠO
--------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', function () {
  bhEnsureModals();
  currentBookingFilter = 'all';
  updateBookingFilterUI();
  renderBookingHistory('all');

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeBookingDetailModal();
      closeReviewModal();
    }
  });
});
