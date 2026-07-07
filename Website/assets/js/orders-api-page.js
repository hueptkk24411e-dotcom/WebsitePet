/* =========================================================
   PETOPIA ADMIN PANEL — orders-api-page.js
   Trang quản lý đơn hàng (Admin): fetch từ API localhost:3500
   ========================================================= */

var ORDERS_PATH = 'http://localhost:3500/orders';

var state = {
  orders: [],
  search: '',
  status: 'all',
  date: 'all',
  page: 1,
  pageSize: 10
};

document.addEventListener('DOMContentLoaded', function () {
  bindEvents();
  fetchOrders();
});

function formatVND(n) {
  if (n == null) return '0đ';
  var x = Number(n);
  if (!Number.isFinite(x)) return '0đ';
  return x.toLocaleString('vi-VN') + 'đ';
}

function renderMiniStats() {
  // admin/orders.html đang hardcode, nên cần gán lại từ state.orders

  
  // tìm theo text label (an toàn với HTML hiện tại)
  var cards = document.querySelectorAll('.mini-stats .mini-stat-card');
  if (!cards || !cards.length) return;

  var totalOrders = state.orders.length;
  var totalRevenue = state.orders.reduce(function (sum, o) {
    // db.json hiện có thể dùng field: amount (tên biến thể khác nhau)
    var t = (o.totalAmount ?? o.total ?? o.amount ?? o.totalAmountVND ?? o.money ?? 0);
    // fallback quan trọng: xử lý case t là chuỗi / undefined
    var num = Number(t);
    if (!Number.isFinite(num)) {
      // nếu amount bị lưu dạng chuỗi kiểu "560,000" thì parse lại
      var raw = (t == null) ? '' : String(t);
      var parsed = parseInt(raw.replace(/\D/g, ''), 10);
      num = Number.isFinite(parsed) ? parsed : 0;
    }
    return sum + num;
  }, 0);


  cards.forEach(function (card) {
    var labelEl = card.querySelector('.mini-stat-label');
    var valueEl = card.querySelector('.mini-stat-value');
    if (!labelEl || !valueEl) return;
    var label = String(labelEl.textContent || '').trim();

    if (label === 'TỔNG ĐƠN HÀNG') {
      valueEl.textContent = totalOrders.toLocaleString('vi-VN');
    }

    if (label === 'DOANH THU THÁNG') {
      valueEl.textContent = formatVND(totalRevenue);
    }
  });
} 


function bindEvents() {
  var searchInput = document.getElementById('orderSearch');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(function (e) {
      state.search = e.target.value.trim().toLowerCase();
      state.page = 1;
      renderOrdersTable();
    }, 200));
  }

  var statusFilter = document.getElementById('orderStatusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', function (e) {
      state.status = e.target.value;
      state.page = 1;
      renderOrdersTable();
    });
  }

  var dateFilter = document.getElementById('orderDateFilter');
  if (dateFilter) {
    dateFilter.addEventListener('change', function (e) {
      state.date = e.target.value;
      state.page = 1;
      renderOrdersTable();
    });
  }
}

async function fetchOrders() {
  try {
    var res = await fetch(ORDERS_PATH);
    var data = await res.json();

    // Một số API trả về {orders:[...]} hoặc mảng [...]
    state.orders = Array.isArray(data) ? data : (data.orders || []);

    // fallback: nếu order không có id thì tạo
    state.orders = state.orders.map(function (o, idx) {
      if (o.id == null && o._id == null) o.id = 'ORD-' + (idx + 1);
      if (o.orderId == null && o.id != null) o.orderId = o.id;
      return o;
    });

    renderOrdersTable();
    renderMiniStats();
  } catch (err) {

    console.error(err);
    showToast('Không tải được đơn hàng', 'error');
  }
}

function parseDateValue(val) {
  // val có thể là ISO string, timestamp, hoặc chuỗi format tự do
  var d = null;
  if (val == null) return null;
  if (typeof val === 'number') return new Date(val);
  // ISO / RFC
  d = new Date(val);
  if (!isNaN(d.getTime())) return d;
  // thử parse kiểu 'dd/mm/yyyy' hoặc 'dd-mm-yyyy'
  var m = String(val).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) {
    var dd = Number(m[1]);
    var mm = Number(m[2]) - 1;
    var yyyy = Number(m[3]);
    var ddObj = new Date(yyyy, mm, dd);
    if (!isNaN(ddObj.getTime())) return ddObj;
  }
  return null;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isWithinRange(dateObj, range) {
  if (!dateObj) return false;
  var now = new Date();

  if (range === 'today') {
    return isSameDay(dateObj, now);
  }

  if (range === 'week') {
    // 7 ngày gần nhất
    var diff = now.getTime() - dateObj.getTime();
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  }

  if (range === 'month') {
    return dateObj.getFullYear() === now.getFullYear() && dateObj.getMonth() === now.getMonth();
  }

  return true; // all
}

function getFilteredOrders() {
  var search = state.search;
  var status = state.status;
  var dateRange = state.date;

  return state.orders.filter(function (o) {
    var orderCode = String(o.orderId || o.id || '').toLowerCase();
    var customerName = String(o.customer?.name || o.customerName || o.customer_name || '').toLowerCase();

    if (search) {
      var okSearch = orderCode.includes(search) || customerName.includes(search);
      if (!okSearch) return false;
    }

    if (status && status !== 'all') {
      var st = String(o.status || '').toLowerCase();
      // map một vài status khác nhau
      var map = {
        pending: ['pending', 'chờ xác nhận', 'cho xac nhan', 'waiting'],
        processing: ['processing', 'đang xử lý', 'dang xu ly', 'processing'],
        shipping: ['shipping', 'đang giao hàng', 'dang giao hang'],
        completed: ['completed', 'đã hoàn tất', 'da hoan tat', 'done']
      };

      var allowed = map[status] || [status];
      var okStatus = allowed.some(function (x) {
        return st.includes(x);
      });

      if (!okStatus) return false;
    }

    var dateVal = o.date || o.createdAt || o.orderDate || o.created_at;
    var dateObj = parseDateValue(dateVal);
    if (dateRange && dateRange !== 'all') {
      if (!isWithinRange(dateObj, dateRange)) return false;
    }

    return true;
  });
}

function handleOrderStatusChange(selectEl) {
  if (!selectEl) return;

  var orderCode = selectEl.getAttribute('data-order-id');
  var newStatus = selectEl.value;

  if (!orderCode || !newStatus) return;

  // Trả về đúng endpoint: PUT /orders/:id
  fetch(ORDERS_PATH + '/' + encodeURIComponent(orderCode), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  })
    .then(function () {
      showToast('Đã cập nhật trạng thái đơn hàng');
      fetchOrders();
    })
    .catch(function (err) {
      console.error(err);
      showToast('Cập nhật thất bại', 'error');
    });
}

// TẮT XÓA ĐƠN HÀNG (theo yêu cầu). Chỉ giữ cập nhật status.
function deleteOrderById(orderCode) {
  return;
}

function renderOrdersTable() {

  var tableBody = document.querySelector('#ordersTable tbody');
  if (!tableBody) return;

  var filtered = getFilteredOrders();

  if (!filtered.length) {
    tableBody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;color:var(--ink-500);padding:28px 10px;">Không có đơn hàng nào</td></tr>';
    return;
  }

  var totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;

  var start = (state.page - 1) * state.pageSize;
  var pageItems = filtered.slice(start, start + state.pageSize);

  tableBody.innerHTML = pageItems.map(function (o) {
    var orderCode = String(o.orderId || o.id || '');
    var customerName = (o.customer && o.customer.name) ? o.customer.name : (o.customerName || o.customer_name || '-');
    var total = o.totalAmount ?? o.total ?? o.amount ?? 0;
    var totalText = (typeof total === 'number') ? total.toLocaleString('vi-VN') + 'đ' : String(total);

    var dateVal = o.date || o.createdAt || o.orderDate || o.created_at || '';
    var dateObj = parseDateValue(dateVal);
    var dateText = dateObj ? dateObj.toLocaleDateString('vi-VN') : String(dateVal);

    var statusText = String(o.status || '').toLowerCase();

    var badgeClass = 'pending';
    var badgeLabel = 'Pending';
    if (statusText.includes('ship') || statusText.includes('giao')) {
      badgeClass = 'shipping';
      badgeLabel = 'Shipping';
    } else if (statusText.includes('complete') || statusText.includes('hoàn') || statusText.includes('xong') || statusText.includes('done')) {
      badgeClass = 'completed';
      badgeLabel = 'Completed';
    } else if (statusText.includes('process') || statusText.includes('xử') || statusText.includes('xu ly')) {
      badgeClass = 'processing';
      badgeLabel = 'Processing';
    } else {
      badgeClass = 'pending';
      badgeLabel = 'Pending';
    }

    return '' +
      '<tr>' +
      '<td class="order-id">#' + escapeHTML(orderCode) + '</td>' +
      '<td>' + escapeHTML(customerName) + '</td>' +
      '<td><strong>' + escapeHTML(totalText) + '</strong></td>' +
      '<td>' + escapeHTML(dateText) + '</td>' +
      '<td><span class="badge ' + badgeClass + '">' + badgeLabel + '</span></td>' +
      '<td class="row-actions">' +
      '  <select class="order-status-select" data-order-id="' + escapeHTML(orderCode) + '" onchange="handleOrderStatusChange(this)" style="padding:6px 8px; border-radius:8px; border:1px solid var(--border-color); background:white;">' +
      '    <option value="pending" ' + (statusText.includes('pending') || statusText.includes('chờ') || statusText.includes('cho xac nhan') ? 'selected' : '') + '>Pending</option>' +
      '    <option value="processing" ' + (statusText.includes('process') || statusText.includes('xử') || statusText.includes('xu ly') ? 'selected' : '') + '>Processing</option>' +
      '    <option value="shipping" ' + (statusText.includes('ship') || statusText.includes('giao') || statusText.includes('dang giao') ? 'selected' : '') + '>Shipping</option>' +
      '    <option value="completed" ' + (statusText.includes('complete') || statusText.includes('hoàn') || statusText.includes('da hoan tat') || statusText.includes('done') ? 'selected' : '') + '>Completed</option>' +
      '  </select>' +

      '</td>' +
      '</tr>';
  }).join('');


  // update pagination info
  var infoEl = document.querySelector('.pagination-info');
  if (infoEl) {
    var startNum = start + 1;
    var endNum = Math.min(start + state.pageSize, filtered.length);
    infoEl.textContent = 'Hiển thị ' + startNum + '-' + endNum + ' / ' + filtered.length + ' đơn hàng';
  }
}

