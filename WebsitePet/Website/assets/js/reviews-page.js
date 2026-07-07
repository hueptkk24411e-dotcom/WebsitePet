/* =========================================================
   PETOPIA ADMIN PANEL — reviews-page.js
   Trang quản lý đánh giá:
     - Đánh giá sản phẩm: dữ liệu tĩnh từ dataset/reviews.json
     - Đánh giá dịch vụ (Grooming / Hotel): khách hàng gửi từ
       trang "Lịch sử đặt lịch", lưu tại localStorage
       (khoá "petopiaServiceReviews") do chưa có API viết vào
       reviews.json.
     - Nhân viên/Admin có thể xem đánh giá mới và phản hồi;
       phản hồi được lưu lại và khách hàng sẽ thấy ngay khi
       xem lại đơn của họ.
   ========================================================= */

var ALL_REVIEWS = [];
var REVIEWS_PATH = '../dataset/reviews.json';
var SERVICE_REVIEWS_KEY = 'petopiaServiceReviews';
var ADMIN_NOTIF_KEY = 'petopiaAdminNotifications';
var currentReplyReviewId = null;

document.addEventListener('DOMContentLoaded', function () {
  requireAdmin(function () {
    loadReviews();
    bindEvents();
    markNotificationsAsRead();
  });
});

function getServiceReviews() {
  try {
    var raw = localStorage.getItem(SERVICE_REVIEWS_KEY);
    var list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function saveServiceReviews(list) {
  localStorage.setItem(SERVICE_REVIEWS_KEY, JSON.stringify(list));
}

function markNotificationsAsRead() {
  try {
    var raw = localStorage.getItem(ADMIN_NOTIF_KEY);
    var list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list) || !list.length) return;
    list.forEach(function (n) { n.read = true; });
    localStorage.setItem(ADMIN_NOTIF_KEY, JSON.stringify(list));
  } catch (e) { /* noop */ }
}

function loadReviews() {
  fetch(REVIEWS_PATH)
    .then(function (res) { return res.json(); })
    .then(function (productReviews) {
      var normalizedProductReviews = (productReviews || []).map(function (r) {
        return {
          id: 'product-' + r.id,
          origin: 'product',
          type: 'product',
          customer: r.customer,
          rating: r.rating,
          content: r.content,
          date: r.date,
          status: r.status,
          reply: null
        };
      });

      var serviceReviews = getServiceReviews().map(function (r) {
        return {
          id: r.id,
          origin: 'service',
          type: r.type, // 'grooming' | 'hotel'
          customer: r.customer,
          rating: r.rating,
          content: r.content,
          images: r.images || [],
          targetName: r.targetName,
          date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '-',
          status: r.status === 'pending' ? 'visible' : (r.status || 'visible'),
          reply: r.reply || null
        };
      });

      // Đánh giá dịch vụ mới nhất hiển thị lên đầu
      ALL_REVIEWS = serviceReviews.concat(normalizedProductReviews);
      renderReviewsTable();
    })
    .catch(function (err) {
      console.error(err);
      // Vẫn hiển thị đánh giá dịch vụ (localStorage) ngay cả khi không tải được reviews.json
      ALL_REVIEWS = getServiceReviews().map(function (r) {
        return {
          id: r.id, origin: 'service', type: r.type, customer: r.customer, rating: r.rating,
          content: r.content, images: r.images || [], targetName: r.targetName,
          date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '-',
          status: 'visible', reply: r.reply || null
        };
      });
      renderReviewsTable();
      showToast('Không tải được đánh giá sản phẩm (vẫn hiển thị đánh giá dịch vụ)', 'error');
    });
}

function bindEvents() {
  var searchInput = document.getElementById('reviewSearch');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(function (e) {
      renderReviewsTable(e.target.value.trim().toLowerCase());
    }, 200));
  }
}

var TYPE_LABELS = {
  product: 'Sản phẩm',
  grooming: 'Grooming',
  hotel: 'Hotel'
};

function renderReviewsTable(search) {
  var tbody = document.querySelector('#reviewsTable tbody');
  var filtered = ALL_REVIEWS.filter(function (r) {
    return !search || (r.customer || '').toLowerCase().indexOf(search) !== -1 || (r.content || '').toLowerCase().indexOf(search) !== -1;
  });

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#aaa;padding:24px;">Chưa có đánh giá nào.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function (r) {
    var stars = '★★★★★'.slice(0, r.rating) + '<span style="opacity:0.3">' + '★★★★★'.slice(r.rating) + '</span>';
    var statusBadge = r.status === 'visible' ? 'completed' : 'pending';
    var statusText = r.status === 'visible' ? 'Hiển thị' : 'Ẩn';
    var typeLabel = TYPE_LABELS[r.type] || 'Khác';
    var replyCell = r.reply && r.reply.content
      ? '<span title="' + escapeHTML(r.reply.content) + '" style="color:#2e7d32;font-weight:600;">Đã phản hồi</span>'
      : (r.origin === 'service' ? '<span style="color:#f57c00;font-weight:600;">Chưa phản hồi</span>' : '-');

    var replyBtn = r.origin === 'service'
      ? '<button class="icon-btn reply-review" title="Phản hồi" data-id="' + r.id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></button>'
      : '<button class="icon-btn toggle-status" title="' + (r.status === 'visible' ? 'Ẩn' : 'Hiển thị') + '" data-id="' + r.id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 16h.01"/></svg></button>';

    return '' +
      '<tr data-id="' + r.id + '">' +
      '<td class="cell-product"><img src="../assets/img/admin/avatar-dog.png" alt="' + escapeHTML(r.customer || '') + '">' + escapeHTML(r.customer || '-') + (r.targetName ? '<div style="font-size:11px;color:#999;">' + escapeHTML(r.targetName) + '</div>' : '') + '</td>' +
      '<td><span class="badge">' + typeLabel + '</span></td>' +
      '<td><span class="badge">' + stars + '</span></td>' +
      '<td>' + escapeHTML(r.content || '') + '</td>' +
      '<td>' + escapeHTML(r.date || '-') + '</td>' +
      '<td><span class="badge ' + statusBadge + '">' + statusText + '</span></td>' +
      '<td>' + replyCell + '</td>' +
      '<td class="row-actions">' + replyBtn + '</td>' +
      '</tr>';
  }).join('');

  tbody.querySelectorAll('.toggle-status').forEach(function (btn) {
    btn.addEventListener('click', function () {
      toggleReviewStatus(btn.getAttribute('data-id'));
    });
  });

  tbody.querySelectorAll('.reply-review').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openReplyModal(btn.getAttribute('data-id'));
    });
  });
}

function toggleReviewStatus(id) {
  var review = ALL_REVIEWS.find(function (r) { return String(r.id) === String(id); });
  if (!review) return;
  review.status = review.status === 'visible' ? 'hidden' : 'visible';
  showToast(review.status === 'visible' ? 'Đã hiển thị đánh giá' : 'Đã ẩn đánh giá');
  renderReviewsTable();
}

/* ---------------------------------------------------------
   PHẢN HỒI ĐÁNH GIÁ DỊCH VỤ
   Sau khi admin gửi phản hồi, nội dung được lưu trực tiếp vào
   bản ghi đánh giá trong localStorage — khách hàng sẽ thấy
   phản hồi này ngay khi mở lại "Xem chi tiết" / "Xem đánh giá"
   cho đơn tương ứng ở trang Lịch sử đặt lịch.
--------------------------------------------------------- */

function openReplyModal(id) {
  var review = ALL_REVIEWS.find(function (r) { return String(r.id) === String(id); });
  if (!review) return;
  currentReplyReviewId = id;

  var summary = document.getElementById('replyReviewSummary');
  if (summary) {
    summary.innerHTML = '<strong>' + escapeHTML(review.customer || '-') + '</strong> — ' +
      '★'.repeat(review.rating) + '<br>' + escapeHTML(review.content || '');
  }
  var textarea = document.getElementById('replyContentInput');
  if (textarea) textarea.value = review.reply && review.reply.content ? review.reply.content : '';

  var modal = document.getElementById('replyModal');
  if (modal) modal.style.display = 'flex';
}

function closeReplyModal() {
  var modal = document.getElementById('replyModal');
  if (modal) modal.style.display = 'none';
  currentReplyReviewId = null;
}

function submitReply() {
  if (!currentReplyReviewId) return;
  var textarea = document.getElementById('replyContentInput');
  var content = textarea ? textarea.value.trim() : '';
  if (!content) {
    showToast('Vui lòng nhập nội dung phản hồi', 'error');
    return;
  }

  var reviews = getServiceReviews();
  var review = reviews.find(function (r) { return String(r.id) === String(currentReplyReviewId); });
  if (!review) {
    showToast('Không tìm thấy đánh giá', 'error');
    return;
  }

  review.reply = {
    content: content,
    staffName: 'Petopia',
    repliedAt: new Date().toISOString()
  };
  saveServiceReviews(reviews);

  var localReview = ALL_REVIEWS.find(function (r) { return String(r.id) === String(currentReplyReviewId); });
  if (localReview) localReview.reply = review.reply;

  closeReplyModal();
  renderReviewsTable();
  showToast('Đã gửi phản hồi tới khách hàng.');
}
