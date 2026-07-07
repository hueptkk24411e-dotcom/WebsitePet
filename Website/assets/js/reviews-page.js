/* =========================================================
   PETOPIA ADMIN PANEL — reviews-page.js
   Trang quản lý đánh giá: dùng dữ liệu tĩnh từ dataset
   ========================================================= */

var ALL_REVIEWS = [];
var REVIEWS_PATH = '../dataset/reviews.json';

document.addEventListener('DOMContentLoaded', function () {
  requireAdmin(function () {
    loadReviews();
    bindEvents();
  });
});

function loadReviews() {
  fetch(REVIEWS_PATH)
    .then(function (res) { return res.json(); })
    .then(function (reviews) {
      ALL_REVIEWS = reviews;
      renderReviewsTable();
    })
    .catch(function (err) {
      console.error(err);
      showToast('Không tải được dữ liệu đánh giá', 'error');
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

function renderReviewsTable(search) {
  var tbody = document.querySelector('#reviewsTable tbody');
  var filtered = ALL_REVIEWS.filter(function (r) {
    return !search || r.customer.toLowerCase().indexOf(search) !== -1 || r.content.toLowerCase().indexOf(search) !== -1;
  });

  tbody.innerHTML = filtered.map(function (r) {
    var stars = '★★★★★'.slice(0, r.rating) + '<span style="opacity:0.3">' + '★★★★★'.slice(r.rating) + '</span>';
    var statusBadge = r.status === 'visible' ? 'completed' : 'pending';
    var statusText = r.status === 'visible' ? 'Hiển thị' : 'Ẩn';
    return '' +
      '<tr data-id="' + r.id + '">' +
      '<td class="cell-product"><img src="../assets/img/admin/avatar-dog.png" alt="' + escapeHTML(r.customer) + '">' + escapeHTML(r.customer) + '</td>' +
      '<td><span class="badge">' + stars + '</span></td>' +
      '<td>' + escapeHTML(r.content) + '</td>' +
      '<td>' + escapeHTML(r.date || '-') + '</td>' +
      '<td><span class="badge ' + statusBadge + '">' + statusText + '</span></td>' +
      '<td class="row-actions">' +
      '<button class="icon-btn toggle-status" title="' + (r.status === 'visible' ? 'Ẩn' : 'Hiển thị') + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 16h.01"/></svg></button>' +
      '</td>' +
      '</tr>';
  }).join('');

  tbody.querySelectorAll('.toggle-status').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = parseInt(btn.closest('tr').getAttribute('data-id'), 10);
      toggleReviewStatus(id);
    });
  });
}

function toggleReviewStatus(id) {
  var review = ALL_REVIEWS.find(function (r) { return r.id === id; });
  if (!review) return;
  review.status = review.status === 'visible' ? 'hidden' : 'visible';
  showToast(review.status === 'visible' ? 'Đã hiển thị đánh giá' : 'Đã ẩn đánh giá');
  renderReviewsTable();
}