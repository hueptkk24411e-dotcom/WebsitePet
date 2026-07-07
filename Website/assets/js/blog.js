'use strict';

/* ============================================================
   Blog.js  –  Petopia Blog Engine  v2.0
   3 view: Home · Category · Detail
   ============================================================ */

const Blog = {

  data: null,
  _history: [],

  /* ── INIT ─────────────────────────────────────────────── */
  async init(articleId) {
    this._showLoading(true);
    try {
      this.data = await this._fetchBlogData();
      this._prepareData();

      if (articleId && this._find(articleId)) {
        this._history = [];
        this._renderDetail(articleId);
      } else {
        const deepLinkId = this._detailIdFromHash();
        if (deepLinkId && this._find(deepLinkId)) {
          this._renderDetail(deepLinkId);
        } else {
          this._renderHome();
        }
      }
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

    const authorName = a.author || 'Đội ngũ Petopia';
    const authorInitials = authorName.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();

    document.getElementById('blog-detail-view').innerHTML = `
      <div class="blog-detail">

        <div class="blog-detail__hero">
          <img class="blog-detail__hero-img" src="${a.image}" alt="${a.title}" loading="lazy"/>
          <div class="blog-detail__hero-overlay"></div>
          <div class="blog-detail__hero-content">
            <span class="article-badge ${a.badgeClass}">${a.categoryLabel}</span>
            <h1 class="blog-detail__title">${a.title}</h1>
            <div class="blog-detail__hero-meta">
              <span><i class="fa-regular fa-calendar"></i> ${a.date}</span>
              <span><i class="fa-regular fa-clock"></i> ${a.readTime} phút đọc</span>
              <span><i class="fa-solid fa-user-pen"></i> ${authorName}</span>
            </div>
          </div>
        </div>

        <div class="blog-detail__wrapper">

          <article class="blog-detail__main">

            <div class="blog-detail__intro">
              <p class="blog-detail__excerpt">${a.excerpt}</p>
              <div class="blog-detail__author-card">
                <div class="blog-detail__author-avatar">${authorInitials}</div>
                <div class="blog-detail__author-info">
                  <strong>${authorName}</strong>
                  <span>Chuyên gia chăm sóc thú cưng tại Petopia</span>
                </div>
              </div>
            </div>

            <div class="blog-detail__body">
              ${this._renderBody(a.content)}
            </div>

            <div class="blog-detail__footer">
              <div class="blog-detail__tags">
                <span class="blog-detail__tags-label"><i class="fa-solid fa-tags"></i> Chủ đề</span>
                <div class="blog-detail__tags-list">
                  <span class="blog-tag">${a.categoryLabel}</span>
                  <span class="blog-tag">Thú cưng</span>
                  <span class="blog-tag">Petopia</span>
                </div>
              </div>

              <div class="blog-detail__share">
                <span class="blog-detail__share-label">Chia sẻ bài viết</span>
                <div class="blog-detail__share-btns">
                  <a href="${this._facebookShareUrl(a.id)}" class="share-btn share-fb" onclick="Blog.openShare(event, 'facebook', '${a.id}')" target="_blank" rel="noopener" aria-label="Chia se Facebook">
                    <i class="fa-brands fa-facebook-f"></i>
                    <span class="share-btn__text">Facebook</span>
                  </a>
                  <a href="${this._zaloShareUrl(a.id)}" class="share-btn share-zl" onclick="Blog.openShare(event, 'zalo', '${a.id}')" target="_blank" rel="noopener" aria-label="Chia se Zalo">
                    <img class="share-btn__zalo-icon" src="assets/img/zalo.png" alt="" loading="lazy"/>
                    <span class="share-btn__text">Zalo</span>
                  </a>
                  <button type="button" class="share-btn share-copy" onclick="Blog.copyLink('${a.id}')" aria-label="Sao chep lien ket">
                    <i class="fa-solid fa-link"></i>
                  </button>
                </div>
              </div>
            </div>

            ${this._related(id)}

          </article>

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
    const categoryId = this._categoryIdForArticle(p.id) || this._categoryIdForPopular(p);
    const category = this.data.categories?.[categoryId];
    const categoryLabel = category?.label || p.categoryLabel || 'Bài viết';
    return `
      <div class="popular-post"
           onclick="Blog.renderDetail('${p.id}')"
           role="button" tabindex="0">
        <img class="popular-post__img" src="${p.image}"
             alt="${p.title}" loading="lazy"/>
        <div>
          <p class="popular-post__title">${p.title}</p>
          <p class="popular-post__category">${categoryLabel}</p>
          <p class="popular-post__date">
            <i class="fa-regular fa-calendar"></i> ${p.date}
          </p>
        </div>
      </div>`;
  },

  _related(curId) {
    const pool = [];
    const currentCatId = this._categoryIdForArticle(curId);
    Object.values(this.data.categories).forEach(cat =>
      cat.articles.forEach(a => {
        if (a.id !== curId && !pool.some(item => item.id === a.id)) pool.push(a);
      })
    );
    if (!pool.length) return '';
    const picks = pool
      .sort((a, b) => {
        const aSame = this._categoryIdForArticle(a.id) === currentCatId ? 0 : 1;
        const bSame = this._categoryIdForArticle(b.id) === currentCatId ? 0 : 1;
        return aSame - bSame;
      })
      .slice(0, 2);
    return `
      <div class="blog-related">
        <div class="blog-related__header">
          <h3 class="blog-related__title">
            <i class="fa-solid fa-bookmark"></i> Bài viết liên quan
          </h3>
          <span class="blog-related__hint">Gợi ý thêm cho bạn</span>
        </div>
        <div class="blog-related__grid">
          ${picks.map(a => `
            <article class="blog-related__card"
                 onclick="Blog.renderDetail('${a.id}')"
                 role="button" tabindex="0">
              <div class="blog-related__img-wrap">
                <img src="${a.image}" alt="${a.title}" loading="lazy"/>
                <span class="article-badge ${a.badgeClass} badge--sm">${a.categoryLabel}</span>
              </div>
              <div class="blog-related__info">
                <h4>${a.title}</h4>
                <p>${a.excerpt}</p>
                <span class="blog-related__meta">
                  <i class="fa-regular fa-clock"></i> ${a.readTime} phút đọc
                </span>
              </div>
            </article>`).join('')}
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

  async _fetchBlogData() {
    const paths = ['assets/dataset/blog.json', '../dataset/blog.json'];
    let lastError = null;
    for (const path of paths) {
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('Blog data not found');
  },

  _prepareData() {
    if (!this.data?.categories || !Array.isArray(this.data.popular)) return;

    const categoryIds = Object.keys(this.data.categories);
    if (!categoryIds.length) return;

    this.data.popular.forEach(article => {
      const targetId = this._categoryIdForPopular(article);
      const target = this.data.categories[targetId] || this.data.categories[categoryIds[0]];
      article.category = targetId;
      if (!target.articles.some(item => item.id === article.id)) {
        target.articles.push(article);
      }
    });
  },

  _categoryIdForPopular(article) {
    const label = (article.categoryLabel || '').toLowerCase();
    const text = `${article.title || ''} ${article.excerpt || ''}`.toLowerCase();
    const foodWords = ['dinh dưỡng', 'dinh duong', 'thức ăn', 'thuc an', 'thực phẩm', 'thuc pham', 'nước uống', 'nuoc uong', 'pate'];
    if (label.includes('dinh dưỡng') || label.includes('dinh duong') || foodWords.some(word => text.includes(word))) return 'tips-an-uong';
    return 'huong-dan';
  },

  _categoryIdForArticle(id) {
    for (const [catId, cat] of Object.entries(this.data.categories || {})) {
      if (cat.articles?.some(article => article.id === id)) return catId;
    }
    return null;
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
  },

  _detailIdFromHash() {
    const match = window.location.hash.match(/^#blog\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  },

  _articleUrl(id) {
    return `${window.location.origin}${window.location.pathname}#blog/${encodeURIComponent(id)}`;
  },

  _facebookShareUrl(id) {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this._articleUrl(id))}`;
  },

  _zaloShareUrl(id) {
    return `https://zalo.me/share?u=${encodeURIComponent(this._articleUrl(id))}`;
  },

  openShare(event, type, id) {
    event?.preventDefault();
    const articleUrl = this._articleUrl(id);
    const fallbackUrl = type === 'zalo'
      ? this._zaloShareUrl(id)
      : this._facebookShareUrl(id);
    const appUrl = type === 'zalo'
      ? `zalo://share?u=${encodeURIComponent(articleUrl)}`
      : `fb://facewebmodal/f?href=${encodeURIComponent(fallbackUrl)}`;

    if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.open(fallbackUrl, '_blank', 'noopener');
      return false;
    }

    const startedAt = Date.now();
    window.location.href = appUrl;
    setTimeout(() => {
      if (Date.now() - startedAt < 1800) window.location.href = fallbackUrl;
    }, 900);
    return false;
  },

  copyLink(id) {
    const text = id ? this._articleUrl(id) : window.location.href.split('#')[0] + '#blog';
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => alert('Đã sao chép liên kết bài viết!'));
    } else {
      alert('Liên kết: ' + text);
    }
  }
};

window.Blog = Blog;

/* ── AUTO-INIT ─────────────────────────────────────────── */
(function () {
  let inited = false;
  let pendingArticleId = null;

  window.openHomeBlogArticle = function (articleId) {
    if (Blog.data) {
      showPage('blog');
      Blog._history = [];
      Blog.renderDetail(articleId);
      return;
    }
    pendingArticleId = articleId;
    showPage('blog');
    pendingArticleId = null;
  };

  document.addEventListener('DOMContentLoaded', () => {
    const orig = window.showPage;
    if (typeof orig !== 'function') return;
    window.showPage = function (page) {
      orig(page);
      if (page === 'blog' && !inited) {
        inited = true;
        Blog.init(pendingArticleId || undefined);
      }
    };

    if (document.getElementById('blog-page') && !inited) {
      inited = true;
      Blog.init();
    }

    const openBlogHash = () => {
      if (!window.location.hash.startsWith('#blog')) return;
      window.showPage('blog');
      if (!inited) {
        inited = true;
        Blog.init();
        return;
      }
      const id = Blog._detailIdFromHash();
      if (id) Blog._renderDetail(id);
    };

    setTimeout(openBlogHash, 0);
    window.addEventListener('hashchange', openBlogHash);
  });
})();

