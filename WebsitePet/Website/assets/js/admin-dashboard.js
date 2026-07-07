/* =========================================================
   PETOPIA ADMIN PANEL — admin-dashboard.js
   Khởi tạo biểu đồ Dashboard + tương tác sidebar/topbar
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  requireAdmin(function () {
    initSidebarToggle();
    initRevenueChart();
    initServiceDonutChart();
  });
});

/* ---------------------------------------------------------
   Toggle sidebar (ẩn/hiện qua nút hamburger)
   --------------------------------------------------------- */
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

/* ---------------------------------------------------------
   Biểu đồ doanh thu 7 ngày qua (line chart)
   --------------------------------------------------------- */
function initRevenueChart() {
  var ctx = document.getElementById('revenueChart');
  if (!ctx || typeof Chart === 'undefined') return;

  var gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 260);
  gradient.addColorStop(0, 'rgba(27, 147, 75, 0.28)');
  gradient.addColorStop(1, 'rgba(27, 147, 75, 0)');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['12/05', '13/05', '14/05', '15/05', '16/05', '17/05', '18/05'],
      datasets: [{
        label: 'Doanh thu',
        data: [30000000, 45000000, 38000000, 52000000, 65000000, 44000000, 72000000],
        borderColor: '#1b934b',
        backgroundColor: gradient,
        borderWidth: 2.5,
        pointBackgroundColor: '#1b934b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#16201b',
          padding: 10,
          cornerRadius: 8,
          titleFont: { size: 12 },
          bodyFont: { size: 12 },
          callbacks: {
            label: function (item) {
              return ' ' + Number(item.raw).toLocaleString('vi-VN') + ' đ';
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100000000,
          ticks: {
            stepSize: 20000000,
            color: '#9aa3a0',
            font: { size: 11 },
            callback: function (val) {
              return (val / 1000000) + 'M';
            }
          },
          grid: { color: '#eaeef0', drawTicks: false },
          border: { display: false }
        },
        x: {
          ticks: { color: '#9aa3a0', font: { size: 11 } },
          grid: { display: false },
          border: { display: false }
        }
      },
      interaction: { intersect: false, mode: 'index' }
    }
  });
}

/* ---------------------------------------------------------
   Biểu đồ tỉ lệ doanh thu theo dịch vụ (donut chart)
   --------------------------------------------------------- */
function initServiceDonutChart() {
  var ctx = document.getElementById('serviceDonutChart');
  if (!ctx || typeof Chart === 'undefined') return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Sản phẩm', 'Grooming', 'Pet Hotel'],
      datasets: [{
        data: [51000000, 21250000, 12750000],
        backgroundColor: ['#1b934b', '#9845c9', '#f2994a'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#16201b',
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: function (item) {
              return ' ' + item.label + ': ' + Number(item.raw).toLocaleString('vi-VN') + ' đ';
            }
          }
        }
      }
    }
  });
}
