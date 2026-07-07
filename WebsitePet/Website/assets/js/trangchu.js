/* ============================================
   Petopia – Script
   ============================================ */

// --- Grooming price estimator ---
const priceTable = {
  dog: { 1: 120000, 2: 180000, 3: 260000, 4: 350000 },
  cat: { 1: 100000, 2: 150000, 3: 220000, 4: 300000 },
};
const furMult    = { '1': 1, '1.5': 1.4, '2': 1.8 };
const svcPrices  = { '150000': 150000, '200000': 200000, '350000': 350000 };

function updatePrice() {
  const pet     = document.querySelector('input[name="pet"]:checked')?.value || 'dog';
  const weight  = document.getElementById('weight')?.value || '1';
  const fur     = document.getElementById('fur')?.value || '1';
  const service = document.getElementById('service')?.value || '150000';
  const display = document.getElementById('price-display');
  if (!display) return;

  const base  = (priceTable[pet]?.[weight] || 150000);
  const mult  = furMult[fur] || 1;
  const extra = svcPrices[service] || 150000;
  const total = Math.round((base * mult + extra) / 1000) * 1000;

  display.textContent = total.toLocaleString('vi-VN') + 'đ';
  display.style.transform = 'scale(1.1)';
  setTimeout(() => { display.style.transform = 'scale(1)'; }, 200);
}

document.addEventListener('DOMContentLoaded', () => {
  // Estimator listeners
  ['weight', 'fur', 'service'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', updatePrice);
  });
  document.querySelectorAll('input[name="pet"]').forEach(r =>
    r.addEventListener('change', updatePrice)
  );
  updatePrice();

  // Add to cart toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  document.body.appendChild(toast);

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  document.querySelectorAll('.product__cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.closest('.product-card')?.querySelector('.product__name')?.textContent || 'Sản phẩm';
      showToast('✅ Đã thêm "' + name.slice(0, 30) + '..." vào giỏ');
    });
  });

  // Newsletter
  const nbtn = document.getElementById('newsletter-btn');
  if (nbtn) {
    nbtn.addEventListener('click', () => {
      const email = nbtn.previousElementSibling?.value?.trim();
      if (email && email.includes('@')) {
        showToast('📬 Đăng ký thành công: ' + email);
        nbtn.previousElementSibling.value = '';
      } else {
        showToast('⚠️ Vui lòng nhập email hợp lệ!');
      }
    });
  }
});
// Booking form confirmation
var bookingForm = document.getElementById('bookingFormElement');
var confirmationModal = document.getElementById('confirmationModal');
var successModal = document.getElementById('successModal');
var btnCancel = document.getElementById('btnCancel');
var btnConfirmSubmit = document.getElementById('btnConfirmSubmit');
var btnCloseSuccess = document.getElementById('btnCloseSuccess');

if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
        e.preventDefault();
        // Show confirmation modal
        if (confirmationModal) {
            confirmationModal.classList.add('show');
        }
    });
}

if (btnCancel) {
    btnCancel.addEventListener('click', function () {
        if (confirmationModal) {
            confirmationModal.classList.remove('show');
        }
    });
}

if (btnConfirmSubmit) {
    btnConfirmSubmit.addEventListener('click', function () {
        if (confirmationModal) {
            confirmationModal.classList.remove('show');
        }
        if (successModal) {
            successModal.classList.add('show');
        }
    });
}

if (btnCloseSuccess)
 {
    btnCloseSuccess.addEventListener('click', function () {

        if (successModal) {
            successModal.classList.remove('show');
        }

        if (bookingForm) {
            bookingForm.reset();
        }

        // Cập nhật lại bảng tóm tắt
        updatePrice();
    });
}

// FAQ accordion

document.querySelectorAll('.style-card').forEach(function (card) {
    function selectStyle() {
        var styleName = card.getAttribute('data-style');
        var styleSelect = document.getElementById('style');

        if (!styleSelect) return;

        for (var i = 0; i < styleSelect.options.length; i++) {
            if (styleSelect.options[i].text === styleName) {
                styleSelect.selectedIndex = i;
                break;
            }
        }
        updatePrice();
    }

    card.addEventListener('click', selectStyle);
    card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectStyle();
        }
    });
});

var serviceSelect = document.getElementById('service');
var styleSelect = document.getElementById('style');
var weightSelect = document.getElementById('weight');
var petNameInput = document.getElementById('petName');
var breedSelect = document.getElementById('breed');
var bookingDateInput = document.getElementById('bookingDate');
var timeSelect = document.getElementById('time');
var petTypeSelect = document.getElementById('petType');

const dogBreeds = [
    'Poodle',
    'Golden Retriever',
    'Labrador',
    'Corgi',
    'Husky',
    'Pomeranian',
    'Shiba Inu'
];

const catBreeds = [
    'British Shorthair',
    'Persian',
    'Maine Coon',
    'Ragdoll',
    'Scottish Fold',
    'Siamese'
];

function formatVND(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(value);
}

function getSelectedAddOns() {
    var addOns = [];
    var total = 0;
    document.querySelectorAll('[data-addon]:checked').forEach(function(checkbox) {
        addOns.push(checkbox.closest('.addon-item').querySelector('.addon-name').textContent);
        total += Number(checkbox.dataset.price);
    });
    return { items: addOns, total: total };
}
function updateBreeds() {

    breedSelect.innerHTML =
        '<option value="">Chọn giống</option>';

    let breeds = [];

    if (petTypeSelect.value === 'dog') {
        breeds = dogBreeds;
    }
    else if (petTypeSelect.value === 'cat') {
        breeds = catBreeds;
    }

    breeds.forEach(function (breed) {

        const option = document.createElement('option');

        option.value = breed;

        option.textContent = breed;

        breedSelect.appendChild(option);
    });
}
function updatePrice() {

    if(!serviceSelect || !styleSelect || !weightSelect){
        return;
    }

    var baseService = Number(serviceSelect.value || 0);
    var styleExtra = Number(styleSelect.value || 0);
    var weightExtra = Number(weightSelect.value || 0);
    var addOnsData = getSelectedAddOns();
    var total = baseService + styleExtra + weightExtra + addOnsData.total;

    // Update summary panel
document.getElementById('summaryService').textContent     = serviceSelect.options[serviceSelect.selectedIndex]?.text || '-';
    document.getElementById('summaryStyle').textContent = styleSelect.options[styleSelect.selectedIndex]?.text || '-';
    document.getElementById('summaryPet').textContent = petNameInput.value && breedSelect.value ? (petNameInput.value + ' (' + breedSelect.value + ')') : '-';
    
    if (bookingDateInput.value && timeSelect.value) {
        var date = new Date(bookingDateInput.value);
        var dateStr = date.toLocaleDateString('vi-VN');
        document.getElementById('summaryDateTime').textContent = dateStr + ', ' + timeSelect.value;
    } else {
        document.getElementById('summaryDateTime').textContent = '-';
    }
    
    if (addOnsData.items.length > 0) {
        document.getElementById('summaryAddons').style.display = 'flex';
        document.getElementById('summaryAddonsText').textContent = addOnsData.items.join(', ');
    } else {
        document.getElementById('summaryAddons').style.display = 'none';
    }
    
    document.getElementById('summaryTotal').textContent = total > 0 ? formatVND(total) : '0 VND';
}

[serviceSelect, styleSelect, weightSelect, petNameInput, breedSelect, bookingDateInput, timeSelect].forEach(function (element) {
    if (element) {
        element.addEventListener('change', updatePrice);
        if (element.type === 'text') element.addEventListener('input', updatePrice);
    }
});

document.querySelectorAll('[data-addon]').forEach(function(checkbox) {
    checkbox.addEventListener('change', updatePrice);
});
if (petTypeSelect) {
    petTypeSelect.addEventListener('change', updateBreeds);
}

updatePrice();
function scrollGallery(value){
    document.getElementById("gallery")
    .scrollBy({
        left:value,
        behavior:"smooth"
    });
}


function showPage(page){

    document.getElementById("home-page").style.display = "none";
    document.getElementById("hotel-page").style.display = "none";
    document.getElementById("grooming-page").style.display = "none";
    document.getElementById("policy-page").style.display = "none";
    document.getElementById("blog-page").style.display = "none";
    document.getElementById("shop-page").style.display = "none";
    document.getElementById("contact-page").style.display = "none";
    document.getElementById('about-page').style.display='none';
    document.getElementById('room-detail-page').style.display='none';
    document.getElementById('viewroom-page').style.display='none';
    document.getElementById('booking-page').style.display='none';
  
    const targetPage = document.getElementById(page + "-page");
    if (targetPage) {
        targetPage.style.display = (page === 'viewroom') ? 'flex' : 'block';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.showPage = showPage;

function showAbout(type){

    document.getElementById("intro-content").style.display = "none";
    document.getElementById("member-content").style.display = "none";
    document.getElementById("recruit-content").style.display = "none";

    if(type === "intro"){
        document.getElementById("intro-content").style.display = "block";
    }

    if(type === "member"){
        document.getElementById("member-content").style.display = "block";
    }

    if(type === "recruit"){
        document.getElementById("recruit-content").style.display = "block";
    }
}
function toggleFAQ(element){

    let item = element.parentElement;

    item.classList.toggle("active");
}'use strict';

/* ============================================================
   Blog.js  –  Petopia Blog Engine  v2.0
   3 view: Home · Category · Detail
   ============================================================ */

const BlogFromTrangChu = {

  data: null,
  _history: [],

  /* ── INIT ─────────────────────────────────────────────── */
  async init() {
    this._showLoading(true);
    try {
      const res = await fetch('../dataset/blog.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      this.data = await res.json();
      this._renderHome();
    } catch (e) {
      this._showError('Không thể tải dữ liệu bài viết. Vui lòng thử lại sau.');
    }
  },

  /* ── NAV ──────────────────────────────────────────────── */
  renderHome() { this._history = []; this._renderHome(); },

  renderCategory(catId) {
    this._history.push({ view: 'home' });
    this._renderCategory(catId);
  },

  renderDetail(id) {
    const cur = this._curView();
    this._history.push({ view: cur.view, id: cur.id });
    this._renderDetail(id);
  },

  goBack() {
    if (!this._history.length) { this._renderHome(); return; }
    const p = this._history.pop();
    if      (p.view === 'home') this._renderHome();
    else if (p.view === 'cat')  this._renderCategory(p.id);
    else                        this._renderHome();
  },

  _curView() {
    const d = document.getElementById('blog-detail-view');
    const c = document.getElementById('blog-category-view');
    if (d && d.style.display !== 'none') return { view: 'detail', id: d.dataset.id };
    if (c && c.style.display !== 'none') return { view: 'cat',    id: c.dataset.id };
    return { view: 'home' };
  },

  /* ── RENDER HOME ──────────────────────────────────────── */
  _renderHome() {
    this._showLoading(false);
    const { featured, categories } = this.data;

    const secs = Object.entries(categories)
      .map(([id, cat]) => `
        <div class="blog-section">
          <div class="blog-section-header">
            <h2>${cat.icon}&nbsp;${cat.label}</h2>
            <a href="#" class="blog-see-all"
               onclick="Blog.renderCategory('${id}');return false;">
              Xem tất cả <i class="fa-solid fa-chevron-right"></i>
            </a>
          </div>
          <div class="articles-grid">
            ${cat.articles.slice(0, 2).map(a => this._card(a)).join('')}
          </div>
        </div>`)
      .join('');

    document.getElementById('blog-home-view').innerHTML = `
      <!-- HERO -->
      <div class="blog-hero" onclick="Blog.renderDetail('${featured.id}')"
           role="button" tabindex="0"
           aria-label="Đọc bài: ${featured.title}">
        <img class="blog-hero__img" src="${featured.image}"
             alt="${featured.title}" loading="lazy"/>
        <div class="blog-hero__overlay"></div>
        <div class="blog-hero__content">
          <span class="hero-badge">
            <i class="fa-solid fa-fire"></i> ${featured.categoryLabel}
          </span>
          <h1 class="blog-hero__title">${featured.title}</h1>
          <p class="blog-hero__desc">${featured.excerpt}</p>
          <div class="blog-hero__meta-bar">
            <span><i class="fa-regular fa-calendar"></i> ${featured.date}</span>
            <span><i class="fa-regular fa-clock"></i> ${featured.readTime} phút đọc</span>
            <span class="blog-hero__cta">
              Đọc ngay <i class="fa-solid fa-arrow-right"></i>
            </span>
          </div>
        </div>
      </div>

      <!-- 2-COLUMN -->
      <div class="blog-layout">
        <div class="blog-main-col">${secs}</div>
        ${this._sidebar()}
      </div>`;

    this._showView('blog-home-view');
    this._hideBreadcrumb();
  },

  /* ── RENDER CATEGORY ──────────────────────────────────── */
  _renderCategory(catId) {
    this._showLoading(false);
    const cat = this.data.categories[catId];

    document.getElementById('blog-category-view').innerHTML = `
      <div class="blog-category-header">
        <h2>${cat.icon}&nbsp;${cat.label}</h2>
        <span class="blog-cat-count">
          <i class="fa-solid fa-layer-group"></i>
          ${cat.articles.length} bài viết
        </span>
      </div>
      <div class="articles-grid articles-grid--full">
        ${cat.articles.map(a => this._card(a)).join('')}
      </div>`;

    document.getElementById('blog-category-view').dataset.id = catId;
    this._showView('blog-category-view');
    this._breadcrumb(cat.label);
  },

  /* ── RENDER DETAIL ────────────────────────────────────── */
  _renderDetail(id) {
    this._showLoading(false);
    const a = this._find(id);
    if (!a) {
      document.getElementById('blog-detail-view').innerHTML =
        '<div class="blog-error-box"><span>⚠️</span><p>Không tìm thấy bài viết.</p></div>';
      this._showView('blog-detail-view');
      return;
    }

    document.getElementById('blog-detail-view').innerHTML = `
      <div class="blog-detail">

        <!-- HERO ẢNH -->
        <div class="blog-detail__hero">
          <img src="${a.image}" alt="${a.title}" loading="lazy"/>
          <div class="blog-detail__hero-overlay"></div>
        </div>

        <!-- 2 CỘT -->
        <div class="blog-detail__wrapper">

          <!-- MAIN -->
          <article class="blog-detail__main">

            <div class="blog-detail__meta-top">
              <span class="article-badge ${a.badgeClass}">${a.categoryLabel}</span>
              <span><i class="fa-regular fa-calendar"></i> ${a.date}</span>
              <span><i class="fa-regular fa-clock"></i> ${a.readTime} phút đọc</span>
            </div>

            <h1 class="blog-detail__title">${a.title}</h1>

            <div class="blog-detail__byline">
              <span class="blog-detail__author">
                <i class="fa-solid fa-user-pen"></i>
                ${a.author || 'Đội ngũ Petopia'}
              </span>
            </div>

            <div class="blog-detail__body">
              ${this._renderBody(a.content)}
            </div>

            <div class="blog-detail__tags">
              <i class="fa-solid fa-tags"></i>
              <span class="blog-tag">${a.categoryLabel}</span>
              <span class="blog-tag">Thú cưng</span>
              <span class="blog-tag">Petopia</span>
            </div>

            <div class="blog-detail__share">
              <span>Chia sẻ bài viết:</span>
              <a href="#" class="share-btn share-fb" onclick="return false;">
                <i class="fa-brands fa-facebook"></i> Facebook
              </a>
              <a href="#" class="share-btn share-zl" onclick="return false;">
                <i class="fa-solid fa-comment-dots"></i> Zalo
              </a>
            </div>

            ${this._related(id)}

          </article>

          <!-- SIDEBAR -->
          <aside class="blog-sidebar blog-detail__sidebar">
            <div class="blog-sidebar-title">
              <span>🔥</span> Bài viết phổ biến
            </div>
            ${this.data.popular.map(p => this._popularItem(p)).join('')}
          </aside>
        </div>
      </div>`;

    document.getElementById('blog-detail-view').dataset.id = id;
    this._showView('blog-detail-view');
    this._breadcrumb(a.title.length > 45 ? a.title.slice(0, 45) + '…' : a.title);
  },

  /* ── BUILD HELPERS ────────────────────────────────────── */
  _card(a) {
    return `
      <article class="article-card"
        onclick="Blog.renderDetail('${a.id}')"
        role="button" tabindex="0">
        <div class="article-card__img-wrap">
          <img class="article-card__img" src="${a.image}"
               alt="${a.title}" loading="lazy"/>
          <span class="article-card__read-badge">
            <i class="fa-regular fa-clock"></i> ${a.readTime} phút
          </span>
        </div>
        <div class="article-card__body">
          <span class="article-badge ${a.badgeClass}">${a.categoryLabel}</span>
          <h3 class="article-card__title">${a.title}</h3>
          <p  class="article-card__desc">${a.excerpt}</p>
          <div class="article-card__meta">
            <span><i class="fa-regular fa-calendar"></i> ${a.date}</span>
            <span><i class="fa-solid fa-user"></i> ${a.author || 'Petopia'}</span>
          </div>
          <div class="article-card__cta">
            Đọc bài viết <i class="fa-solid fa-arrow-right"></i>
          </div>
        </div>
      </article>`;
  },

  _sidebar() {
    return `
      <aside class="blog-sidebar">
        <div class="blog-sidebar-title"><span>🔥</span> Bài viết phổ biến</div>
        ${this.data.popular.map(p => this._popularItem(p)).join('')}
      </aside>`;
  },

  _popularItem(p) {
    return `
      <div class="popular-post"
           onclick="Blog.renderDetail('${p.id}')"
           role="button" tabindex="0">
        <img class="popular-post__img" src="${p.image}"
             alt="${p.title}" loading="lazy"/>
        <div>
          <p class="popular-post__title">${p.title}</p>
          <p class="popular-post__date">
            <i class="fa-regular fa-calendar"></i> ${p.date}
          </p>
        </div>
      </div>`;
  },

  _related(curId) {
    const pool = [];
    Object.values(this.data.categories).forEach(cat =>
      cat.articles.forEach(a => { if (a.id !== curId) pool.push(a); })
    );
    if (!pool.length) return '';
    const picks = pool.sort(() => .5 - Math.random()).slice(0, 2);
    return `
      <div class="blog-related">
        <h3 class="blog-related__title">
          <i class="fa-solid fa-bookmark"></i> Bài viết liên quan
        </h3>
        <div class="blog-related__grid">
          ${picks.map(a => `
            <div class="blog-related__card"
                 onclick="Blog.renderDetail('${a.id}')"
                 role="button" tabindex="0">
              <img src="${a.image}" alt="${a.title}" loading="lazy"/>
              <div class="blog-related__info">
                <span class="article-badge ${a.badgeClass} badge--sm">
                  ${a.categoryLabel}
                </span>
                <p>${a.title}</p>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  /* ── CONTENT RENDERER ─────────────────────────────────── */
  _renderBody(blocks) {
    if (!blocks?.length) return '<p>Nội dung đang được cập nhật…</p>';
    return blocks.map(b => {
      switch (b.type) {
        case 'paragraph':
          return `<p>${b.text}</p>`;
        case 'heading':
          return `<h2 class="blog-content-h2">${b.text}</h2>`;
        case 'subheading':
          return `<h3 class="blog-content-h3">${b.text}</h3>`;
        case 'list':
          return (b.title ? `<h3 class="blog-content-h3">${b.title}</h3>` : '') +
            `<ul class="blog-content-list">
              ${b.items.map(i => `<li>${i}</li>`).join('')}
             </ul>`;
        case 'ordered-list':
          return (b.title ? `<h3 class="blog-content-h3">${b.title}</h3>` : '') +
            `<ol class="blog-content-list blog-content-list--ol">
              ${b.items.map(i => `<li>${i}</li>`).join('')}
             </ol>`;
        case 'tip':
          return `
            <div class="blog-callout blog-callout--tip">
              <div class="blog-callout__icon">💡</div>
              <div class="blog-callout__body">
                ${b.title ? `<strong>${b.title}</strong>` : ''}
                <p>${b.text}</p>
              </div>
            </div>`;
        case 'warning':
          return `
            <div class="blog-callout blog-callout--warning">
              <div class="blog-callout__icon">⚠️</div>
              <div class="blog-callout__body">
                ${b.title ? `<strong>${b.title}</strong>` : ''}
                <p>${b.text}</p>
              </div>
            </div>`;
        case 'image':
          return `
            <figure class="blog-figure">
              <img src="${b.src}" alt="${b.alt || ''}" loading="lazy"/>
              ${b.caption ? `<figcaption>${b.caption}</figcaption>` : ''}
            </figure>`;
        case 'divider':
          return '<hr class="blog-divider"/>';
        default: return '';
      }
    }).join('\n');
  },

  /* ── UTILS ────────────────────────────────────────────── */
  _find(id) {
    if (this.data.featured.id === id) return this.data.featured;
    for (const cat of Object.values(this.data.categories)) {
      const f = cat.articles.find(a => a.id === id);
      if (f) return f;
    }
    return this.data.popular.find(p => p.id === id) || null;
  },

  _showView(id) {
    ['blog-home-view', 'blog-category-view', 'blog-detail-view'].forEach(v => {
      const el = document.getElementById(v);
      if (el) el.style.display = (v === id) ? 'block' : 'none';
    });
    const bp = document.getElementById('blog-page');
    if (bp) setTimeout(() => bp.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  },

  _showLoading(show) {
    const el = document.getElementById('blog-loading');
    if (el) el.style.display = show ? 'flex' : 'none';
  },

  _breadcrumb(title) {
    const nav = document.getElementById('blog-breadcrumb');
    const t   = document.getElementById('blog-breadcrumb-title');
    if (nav) nav.style.display = 'flex';
    if (t)   t.textContent = title;
  },

  _hideBreadcrumb() {
    const nav = document.getElementById('blog-breadcrumb');
    if (nav) nav.style.display = 'none';
  },

  _showError(msg) {
    this._showLoading(false);
    const el = document.getElementById('blog-loading');
    if (el) {
      el.style.display = 'flex';
      el.innerHTML = `<div class="blog-error-box"><span>⚠️</span><p>${msg}</p></div>`;
    }
  }
};

/* ── AUTO-INIT ─────────────────────────────────────────── */
(function () {
  let inited = false;
  document.addEventListener('DOMContentLoaded', () => {
    const orig = window.showPage;
    if (typeof orig !== 'function') return;
    window.showPage = function (page) {
      orig(page);
      if (false && page === 'blog' && !inited) { inited = true; BlogFromTrangChu.init(); }
    };
  });
})();
let jobsData = [];

fetch("/api/jobs")
.then(res => {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
})
.then(data => {
    jobsData = data.jobs || [];
})
.catch(err => {
    console.warn('Không thể tải dữ liệu jobs:', err);
});
function showJob(id){

    const job = jobsData.find(item => item.id == id);

    if(!job) return;

    let html = `
        <button class="back-btn" onclick="showAllJobs()">
            ← Trở về danh sách
        </button>

        <h2>${job.title}</h2>

        <p><strong>Lương:</strong> ${job.salary}</p>

        <p><strong>Địa điểm:</strong> ${job.location}</p>

        <h3>Mô tả công việc</h3>

        <ul>
            ${job.description.map(item =>
                `<li>${item}</li>`
            ).join("")}
        </ul>

        <h3>Yêu cầu</h3>

        <ul>
            ${job.requirements.map(item =>
                `<li>${item}</li>`
            ).join("")}
        </ul>
    `;

    document.getElementById("jobContent").innerHTML = html;
    document.getElementById("jobModal").style.display = "block";
}

function showAllJobs(){

    currentView = "list";

    let html = `
        <h2>Tất cả vị trí tuyển dụng</h2>
        <div class="all-jobs-list">
    `;

    jobsData.forEach(job => {

        html += `
            <div class="job-box">

                <h3>${job.title}</h3>

                <p><strong>Lương:</strong> ${job.salary}</p>

                <p><strong>Địa điểm:</strong> ${job.location}</p>

                <button onclick="showJob(${job.id})">
                    Xem chi tiết
                </button>

            </div>
        `;
    });

    html += `</div>`;

    document.getElementById("jobContent").innerHTML = html;
    document.getElementById("jobModal").style.display = "block";
}
function closeJobModal(){
    document.getElementById("jobModal").style.display = "none";
}
function openStoreModal(){

    document.getElementById("storeModal").style.display = "block";

    loadStores();
}
function closeStoreModal(){

    document.getElementById("storeModal").style.display = "none";
}

function loadStores(){

    fetch("assets/dataset/store.json")
    .then(res => res.json())
    .then(data => {

        let html = "";

        if (!data.stores) return;

        data.stores.forEach(store => {

            let services = "";

            store.services.forEach(service => {

                services += `
                <span class="service-tag">
                    ${service}
                </span>
                `;
            });

            html += `
            <div class="store-card">

                <h3>${store.name}</h3>

                <p>
                    📍 ${store.address}
                </p>

                <p>
                    📞 ${store.phone}
                </p>

                <p>
                    🕒 ${store.openTime}
                </p>

                <div>
                    ${services}
                </div>

            </div>
            `;
        });

        document.getElementById("storeContainer").innerHTML = html;
  })
    .catch(err => {
        console.error("Lỗi khi tải dữ liệu cửa hàng:", err);
    });
}
function openShop() {
    showPage('shop');

    setTimeout(() => {
        switchTab('home');
    }, 50);
}
// Khởi tạo mảng lưu danh sách đặt phòng toàn cục
let hotelBookings = [];
let currentSelectedRoom = null; 
const PICKUP_FEE = 50000; // Phí dịch vụ đón tận nơi cố định

// 1. Hàm bắt sự kiện khi click nút Đặt phòng ngay ngoài giao diện chính
document.addEventListener("DOMContentLoaded", function () {
    // Đường dẫn tới file review.xml của bạn
    fetch('assets/dataset/review.xml') 
        .then(response => response.text())
        .then(data => {
            // Phân tích cú pháp chuỗi XML thành Object để thao tác
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "text/xml");
            
            // Lấy tất cả các thẻ <review>
            const reviews = xmlDoc.getElementsByTagName("review");
            const container = document.getElementById("reviews-container");
            
            let htmlContent = "";
            
            // Duyệt qua từng review trong file XML
            for (let i = 0; i < reviews.length; i++) {
                const name = reviews[i].getElementsByTagName("name")[0]?.textContent.trim();
                const role = reviews[i].getElementsByTagName("role")[0]?.textContent.trim();
                const stars = reviews[i].getElementsByTagName("stars")[0]?.textContent.trim();
                const image = reviews[i].getElementsByTagName("image")[0]?.textContent.trim();
                const content = reviews[i].getElementsByTagName("content")[0]?.textContent.trim();
                
                // Tạo cấu trúc HTML cho từng thẻ đánh giá (Review Card)
                htmlContent += `
                    <div class="review-card">
                        <div class="review-header">
                            <img src="${image || 'https://via.placeholder.com/60'}" alt="${name}" class="review-avatar">
                            <div class="review-info">
                                <h4 class="review-name">${name}</h4>
                                <span class="review-role">${role}</span>
                            </div>
                        </div>
                        <div class="review-stars">${stars}</div>
                        <p class="review-text">"${content}"</p>
                    </div>
                `;
            }
            
            // Đổ toàn bộ HTML vừa tạo vào container
            if (container) {
                container.innerHTML = htmlContent;
            }
        })
        .catch(error => {
            console.error('Lỗi khi tải dữ liệu XML:', error);
            const reviewsContainer = document.getElementById("reviews-container");
            if (reviewsContainer) {
                reviewsContainer.innerHTML = "<p>Không thể tải đánh giá vào lúc này.</p>";
            }
        });
});