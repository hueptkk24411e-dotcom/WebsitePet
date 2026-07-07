// ==========================================
// 1. STATE MANAGEMENT & INITIALIZATION
// ==========================================
const sessionUserEmail = localStorage.getItem('track_session_user');

// ĐỒNG BỘ: Tải dữ liệu giỏ hàng, wishlist, đơn hàng của RIÊNG user đang đăng nhập
let registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
let currentUserData = registeredUsers.find(u => u.email === sessionUserEmail) || {};

const PENDING_SHOP_PRODUCT_KEY = 'pendingShopProduct';

const state = {
    products: [],
    // Lấy data từ tài khoản, nếu chưa có thì để mảng rỗng []
    cart: currentUserData.cart || [],
    wishlist: currentUserData.wishlist || [],
    orders: currentUserData.orders || [],
    
    userProfile: JSON.parse(localStorage.getItem('petopia_user_profile')) || {},
    user: sessionUserEmail ? { name: sessionUserEmail.split('@')[0], email: sessionUserEmail } : null,
    filters: { search: '', category: 'all', type: 'all', brand: 'all', price: 'all' },
    pagination: { currentPage: 1, itemsPerPage: 30 }, // Chia chính xác mỗi trang 30 sản phẩm
    isDarkMode: localStorage.getItem('petopia_darkmode') === 'true'
};

document.addEventListener('DOMContentLoaded', async () => {
    applyDarkMode();
    updateAuthUI();
    await fetchProductsJSON();
    updateBadges();
    loadCheckoutProvinces();
    handleMomoReturn();
});


// Tải danh sách tỉnh/thành phố cho select #checkoutProvince (giống bên Hotel)
function loadCheckoutProvinces() {
    const select = document.getElementById('checkoutProvince');
    if (!select) return;
    fetch('assets/dataset/vietnam-provinces.json')
        .then(res => res.json())
        .then(data => {
            const list = Array.isArray(data) ? data : (data.provinces || []);
            list.forEach(p => {
                const name = typeof p === 'string' ? p : (p.name || p.Name || p.tinh || '');
                if (!name) return;
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                select.appendChild(opt);
            });
            // Khôi phục tỉnh đã lưu trong hồ sơ (nếu có)
            if (state.userProfile && state.userProfile.province) {
                select.value = state.userProfile.province;
            }
        })
        .catch(err => console.error('Lỗi tải vietnam-provinces.json:', err));
}


// ==========================================
// 2. AUTHENTICATION & PROFILE
// ==========================================
function openAuthModal() {
    window.location.href = 'login.html';
}

function checkLoginStatus() {
    const currentUser = localStorage.getItem("currentUser");
    return currentUser ? JSON.parse(currentUser) : null;
}

function handleLogout() {
    state.user = null;
    localStorage.removeItem('track_session_user');
    localStorage.removeItem('petopia_user_profile'); 
    localStorage.removeItem('currentUser'); // Xóa thêm session Google
    
    state.cart = [];
    state.wishlist = [];
    state.orders = [];
    
    updateAuthUI();
    updateBadges(); 
    processAndRenderProducts(); 
    
    showToast("Đã đăng xuất");
    switchTab('shop');
}

function updateAuthUI() {
    const authSection = document.getElementById('userAuthSection');
    if (!authSection) return;
    
    const googleUser = checkLoginStatus();
    if (googleUser || state.user) {
        const displayName = googleUser ? googleUser.name : state.user.name;
        authSection.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <button class="nav-btn" onclick="switchTab('account')" style="font-weight: 600; font-size: 14px; color: var(--primary-orange);">
                    <i class="fas fa-user-cog"></i> ${displayName}
                </button>
                <button class="nav-btn" onclick="handleLogout()" style="padding: 5px; color: var(--text-grey);" title="Đăng xuất">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;
    } else {
        authSection.innerHTML = `
            <button class="nav-btn" onclick="openAuthModal()">
                <i class="fas fa-user-circle"></i> Đăng nhập
            </button>
        `;
    }
}

function renderAccountTab() {
    if (!checkLoginStatus() && !state.user) {
        showToast("Vui lòng đăng nhập để xem thông tin tài khoản!", "error");
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    const email = localStorage.getItem('track_session_user');
    const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const matchedUser = registeredUsers.find(u => u.email === email);

    if (matchedUser) {
        document.getElementById('profileName').value = state.userProfile.name || matchedUser.name || '';
        document.getElementById('profilePhone').value = state.userProfile.phone || matchedUser.phone || '';
        document.getElementById('profileAddress').value = state.userProfile.address || matchedUser.address || '';
    } else {
        const googleUser = checkLoginStatus();
        document.getElementById('profileName').value = state.userProfile.name || (googleUser ? googleUser.name : '');
        document.getElementById('profilePhone').value = state.userProfile.phone || '';
        document.getElementById('profileAddress').value = state.userProfile.address || '';
    }
}

function saveProfile() {
    const name = document.getElementById('profileName').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    const address = document.getElementById('profileAddress').value.trim();

    if (!name || !phone || !address) {
        showToast("Vui lòng điền đầy đủ thông tin!", "error");
        return;
    }

    state.userProfile = { name, phone, address };
    localStorage.setItem('petopia_user_profile', JSON.stringify(state.userProfile));

    const email = localStorage.getItem('track_session_user');
    if (email) {
        let registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const index = registeredUsers.findIndex(u => u.email === email);
        if (index !== -1) {
            registeredUsers[index].name = name;
            registeredUsers[index].phone = phone;
            registeredUsers[index].address = address;
            localStorage.setItem('registered_users', JSON.stringify(registeredUsers));
        }
    }

    showToast("Đã lưu thông tin giao hàng mặc định!", "success");
}


// ==========================================
// 3. FETCH JSON & DATA PARSING
// ==========================================
async function fetchProductsJSON() {
    const PRODUCTS_URL = 'http://localhost:3500/products';

    try {
        const response = await fetch(PRODUCTS_URL);
        const data = await response.json();

        // API trả về: mảng JSON
        const productsArray = Array.isArray(data) ? data : (data.products || []);
        const mapped = mapProductsFromAPI(productsArray);

        state.products = mapped.products;
        renderBrandFilter(mapped.brandCounts);
        processAndRenderProducts();
        if (typeof window.renderFeaturedProducts === 'function') {
            window.renderFeaturedProducts();
        }
        renderShopHomeExtras();
        applyPendingShopProduct();
    } catch (err) {
        console.warn('Lỗi tải products JSON, dùng dữ liệu mẫu...', err);
        const sample = [
            {
                id: 1,
                name: 'Thức Ăn Hạt Mềm Chó ANF Soft',
                brand: 'ANF',
                image: 'https://fexafkqzpbzjcupvbfhe.supabase.co/storage/v1/object/public/product-images/products/479e2abd-ce9a-4dae-8eeb-b10ddf07e41c/256e054b-6f55-478a-b550-58701e9f884d/th-c-n-h-t-m-m-ch-anf-soft-1-2kg-paddy-pet-shop.jpg',
                price: 55000,
                oldPrice: 58000,
                discount: '-5%',
                category: 'Chó',
                sku: 'ANF-1',
                stock: 20,
                status: 'in_stock',
                description: 'Thức ăn hạt mềm hữu cơ ANF Soft vị thịt vịt thơm ngon, dễ tiêu hóa cho thú cưng của bạn.'
            }
        ];
        const mapped = mapProductsFromAPI(sample);
        state.products = mapped.products;
        renderBrandFilter(mapped.brandCounts);
        processAndRenderProducts();
        renderShopHomeExtras();
        applyPendingShopProduct();
    }
}

function mapProductsFromAPI(productsArray) {
    const parsedProducts = [];
    const brandCounts = {};

    productsArray.forEach((raw, idx) => {
        const id = raw.id ?? raw._id ?? String(idx + 1);
        const name = raw.name ?? raw.title ?? '';

        // brand có thể không có trong API, fallback từ category/sku
        const brand = raw.brand ?? raw.manufacturer ?? raw.brandName ?? raw.sku ?? (raw.category || 'Khác');
        const image = raw.image ?? raw.img ?? raw.thumbnail ?? '';

        const priceNum = typeof raw.price === 'number' ? raw.price : parsePrice(String(raw.price ?? ''));
        const oldPriceNum = typeof raw.oldPrice === 'number' ? raw.oldPrice : parsePrice(String(raw.oldPrice ?? ''));

        // Discount: ưu tiên raw.discount, nếu thiếu thì tự tính từ oldPrice/price
        let discount = raw.discount ?? '';
        let origPriceStr = '';
        let priceStr = priceNum ? formatVND(priceNum) : '0đ';

        if (oldPriceNum && oldPriceNum > priceNum) {
            origPriceStr = formatVND(oldPriceNum) + 'đ';
            if (!discount) {
                const pct = Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100);
                discount = `-${pct}%`;
            }
        } else {
            // nếu API có oldPriceStr dạng text thì dùng luôn
            if (raw.oldPriceStr && typeof raw.oldPriceStr === 'string') origPriceStr = raw.oldPriceStr;
        }

        // category/type từ API nếu có, nếu không suy đoán theo name
        let category = raw.category ?? 'Chó';
        const nameLower = String(name).toLowerCase();
        if (!raw.category) {
            if (nameLower.includes('mèo') && !nameLower.includes('chó')) category = 'Mèo';
            else if (nameLower.includes('mèo') && nameLower.includes('chó')) category = 'Chó/Mèo';
            else category = 'Chó';
        }

        let type = raw.type ?? '';
        if (!type) {
            if (nameLower.includes('hạt') || nameLower.includes('thức ăn') || nameLower.includes('food')) type = 'Thức ăn';
            else if (nameLower.includes('snack') || nameLower.includes('bánh') || nameLower.includes('xương')) type = 'Snack';
            else type = 'Đồ dùng';
        }

        // stock: API dùng stock/status theo admin panel, fallback
        let stock = 0;
        if (typeof raw.stock === 'number') stock = raw.stock;
        else if (raw.stock != null && !Number.isNaN(Number(raw.stock))) stock = Number(raw.stock);
        else if (raw.quantity != null) stock = Number(raw.quantity);
        else if (raw.status === 'out_of_stock') stock = 0;
        else stock = 10 + (idx % 40);

        if (brand) brandCounts[brand] = (brandCounts[brand] || 0) + 1;

        // rating/reviewsCount cho UI (demo) nếu API không có
        const rating = (raw.rating != null ? Number(raw.rating) : (4 + (idx % 10) * 0.05)).toFixed(1);
        const reviewsCount = raw.reviewsCount != null ? Number(raw.reviewsCount) : (100 + (idx % 200));

        parsedProducts.push({
            id: String(id),
            name: String(name),
            brand: String(brand || ''),
            image: String(image),
            priceStr: priceStr,
            origPriceStr: origPriceStr || '',
            discount: discount || '',
            category: category,
            type: type,
            rating: Number(rating),
            reviewsCount: Number(reviewsCount),
            stock: Number(stock),
            description: raw.description ?? raw.desc ?? '',
            priceNum: priceNum || 0
        });
    });

    return { products: parsedProducts, brandCounts };
}

function formatVND(num) {
    if (num == null) return '0đ';
    const n = Number(num);
    if (!Number.isFinite(n)) return '0đ';
    return n.toLocaleString('vi-VN') + 'đ';
}


window.openShopProduct = function (productId) {
    try {
        localStorage.setItem(PENDING_SHOP_PRODUCT_KEY, String(productId));
    } catch (e) {
        console.error('Không thể lưu sản phẩm đã chọn:', e);
    }
    window.location.href = 'shop.html';
};

function applyPendingShopProduct() {
    if (document.body.getAttribute('data-page') !== 'shop') return;

    let productId = null;
    try {
        productId = localStorage.getItem(PENDING_SHOP_PRODUCT_KEY);
    } catch (e) {
        productId = null;
    }
    if (!productId) return;

    try {
        localStorage.removeItem(PENDING_SHOP_PRODUCT_KEY);
    } catch (e) {
        /* ignore */
    }

    const product = state.products.find(p => String(p.id) === String(productId));
    if (!product) return;

    if (typeof switchTab === 'function') {
        switchTab('home');
    }
    openProductDetail(productId);
}

function getCData(node, tagName) {
    const el = node.getElementsByTagName(tagName)[0];
    return el && el.textContent ? el.textContent.trim() : "";
}

function parsePrice(str) {
    if (!str) return 0;
    return parseInt(str.replace(/\D/g, '')) || 0;
}


// ==========================================
// 4. RENDERING & FILTERS
// ==========================================
function renderBrandFilter(brandCounts) {
    const ul = document.getElementById('filter-brand');
    if(!ul) return;
    
    let html = `<li class="active" onclick="applyFilter('brand', 'all')" style="display: flex; justify-content: space-between; align-items: center;">
        <span><i class="fas fa-tags"></i> Tất cả</span>
        <span style="font-size: 12px; color: var(--text-grey); background: var(--border-color); padding: 2px 6px; border-radius: 10px;">${state.products.length}</span>
    </li>`;
    
    const sortedBrands = Object.keys(brandCounts).sort((a, b) => brandCounts[b] - brandCounts[a]);
    const topBrands = sortedBrands.slice(0, 10);

    topBrands.forEach(brand => {
        html += `<li onclick="applyFilter('brand', '${brand.replace(/'/g, "\\'")}')" style="display: flex; justify-content: space-between; align-items: center;">
            <span><i class="fas fa-tag"></i> ${brand}</span>
            <span style="font-size: 12px; color: var(--text-grey); background: var(--border-color); padding: 2px 6px; border-radius: 10px;">${brandCounts[brand]}</span>
        </li>`;
    });
    ul.innerHTML = html;
}

function applyFilter(type, value) {
    state.filters[type] = value;
    state.pagination.currentPage = 1;

    if (type !== 'search') {
        const filterContainer = document.getElementById(`filter-${type}`);
        if (filterContainer) {
            const lis = filterContainer.querySelectorAll('li');
            lis.forEach(li => li.classList.remove('active'));
            // Đồng bộ trạng thái active trong sidebar kể cả khi filter được gọi từ nơi khác
            // (VD: tag "Tìm kiếm hôm nay" ở trên) chứ không chỉ từ chính list trong sidebar.
            const matchedLi = Array.from(lis).find(li => {
                const onclickAttr = li.getAttribute('onclick') || '';
                return onclickAttr.replace(/"/g, "'") === `applyFilter('${type}', '${value}')`;
            });
            if (matchedLi) matchedLi.classList.add('active');
        }
        if (typeof event !== 'undefined' && event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        }
        
        if (type === 'brand' && value !== 'all') {
            state.filters.category = 'all';
            const catFilter = document.getElementById('filter-category');
            if (catFilter) {
                const catLis = catFilter.querySelectorAll('li');
                catLis.forEach(li => li.classList.remove('active'));
                if(catLis.length > 0) catLis[0].classList.add('active');
            }
        }
    }
    processAndRenderProducts();
}
let searchTimeout;
let searchActiveIndex = -1;

function productMatchesQuery(product, query) {
    if (!query) return true;
    const q = query.toLowerCase();
    return [product.name, product.brand, product.category, product.type]
        .some(field => field && field.toLowerCase().includes(q));
}

function getSearchQuery() {
    const input = document.getElementById('searchInput');
    return input ? input.value.toLowerCase().trim() : '';
}

function hideSearchSuggestions() {
    const dropdown = document.getElementById('searchSuggestions');
    if (!dropdown) return;
    dropdown.classList.remove('show');
    dropdown.innerHTML = '';
    searchActiveIndex = -1;
}

function renderSearchSuggestions(query) {
    const dropdown = document.getElementById('searchSuggestions');
    if (!dropdown) return;

    if (!query) {
        hideSearchSuggestions();
        return;
    }

    if (!state.products.length) {
        dropdown.innerHTML = '<div class="search-suggestion-empty">Đang tải sản phẩm...</div>';
        dropdown.classList.add('show');
        return;
    }

    const matches = state.products.filter(p => productMatchesQuery(p, query)).slice(0, 8);
    searchActiveIndex = -1;

    if (matches.length === 0) {
        dropdown.innerHTML = '<div class="search-suggestion-empty">Không tìm thấy sản phẩm phù hợp</div>';
        dropdown.classList.add('show');
        return;
    }

    dropdown.innerHTML = matches.map((p, index) => `
        <div class="search-suggestion-item" role="option" data-id="${p.id}" data-index="${index}"
            onmousedown="selectSearchResult('${p.id}', event)">
            <img src="${p.image}" alt="">
            <div class="search-suggestion-info">
                <div class="search-suggestion-name">${p.name}</div>
                <div class="search-suggestion-meta">${p.brand} · ${p.category}</div>
            </div>
            <div class="search-suggestion-price">${p.priceStr}</div>
        </div>
    `).join('');
    dropdown.classList.add('show');
}

function updateSearchSuggestionHighlight() {
    const dropdown = document.getElementById('searchSuggestions');
    if (!dropdown) return;
    dropdown.querySelectorAll('.search-suggestion-item').forEach((item, index) => {
        item.classList.toggle('active', index === searchActiveIndex);
    });
}

function selectSearchResult(id, event) {
    if (event) event.preventDefault();

    const product = state.products.find(p => p.id === id);
    const input = document.getElementById('searchInput');
    if (product && input) input.value = product.name;

    hideSearchSuggestions();
    state.filters.search = product ? product.name.toLowerCase().trim() : getSearchQuery();
    state.pagination.currentPage = 1;

    openShop();
    setTimeout(() => {
        switchTab('home');
        processAndRenderProducts();
        openProductDetail(id);
    }, 50);
}

function applySearchToShop(showShopPage) {
    state.filters.search = getSearchQuery();
    state.pagination.currentPage = 1;

    if (showShopPage) {
        openShop();
        setTimeout(() => {
            switchTab('home');
            processAndRenderProducts();
        }, 50);
    } else {
        const shopPage = document.getElementById('shop-page');
        if (shopPage && shopPage.style.display !== 'none') {
            switchTab('home');
            processAndRenderProducts();
        }
    }
}

function handleSearchFocus() {
    const query = getSearchQuery();
    if (query) renderSearchSuggestions(query);
}

function handleSearchKeydown(event) {
    const dropdown = document.getElementById('searchSuggestions');
    const items = dropdown ? dropdown.querySelectorAll('.search-suggestion-item') : [];

    if (event.key === 'ArrowDown') {
        if (!items.length) return;
        event.preventDefault();
        searchActiveIndex = Math.min(searchActiveIndex + 1, items.length - 1);
        updateSearchSuggestionHighlight();
        items[searchActiveIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'ArrowUp') {
        if (!items.length) return;
        event.preventDefault();
        searchActiveIndex = Math.max(searchActiveIndex - 1, 0);
        updateSearchSuggestionHighlight();
        items[searchActiveIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter') {
        event.preventDefault();
        clearTimeout(searchTimeout);
        if (searchActiveIndex >= 0 && items[searchActiveIndex]) {
            selectSearchResult(items[searchActiveIndex].dataset.id);
        } else {
            hideSearchSuggestions();
            applySearchToShop(true);
        }
    } else if (event.key === 'Escape') {
        hideSearchSuggestions();
    }
}

function initSearchDropdown() {
    document.addEventListener('click', (event) => {
        const searchBox = document.querySelector('.header-search');
        if (searchBox && !searchBox.contains(event.target)) {
            hideSearchSuggestions();
        }
    });
}

function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = getSearchQuery();
        renderSearchSuggestions(query);
        applySearchToShop(false);
    }, 300);
}

function processAndRenderProducts() {
    let filtered = state.products.filter(p => {
        if (state.filters.search && !p.name.toLowerCase().includes(state.filters.search) && !p.brand.toLowerCase().includes(state.filters.search)) return false;
        if (state.filters.category !== 'all' && p.category !== state.filters.category && p.category !== 'Chó/Mèo') return false;
        if (state.filters.type !== 'all' && p.type !== state.filters.type) return false;
        if (state.filters.brand !== 'all' && p.brand !== state.filters.brand) return false;
        if (state.filters.price && state.filters.price !== 'all') {
            const [min, max] = state.filters.price.split('-').map(Number);
            if (p.priceNum < min || p.priceNum > max) return false;
        }
        return true;
    });

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / state.pagination.itemsPerPage);
    if (state.pagination.currentPage > totalPages) state.pagination.currentPage = totalPages || 1;

    const startIdx = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
    const endIdx = startIdx + state.pagination.itemsPerPage;
    const paginatedItems = filtered.slice(startIdx, endIdx);

    renderGrid(paginatedItems, 'productGrid');
    renderPaginationControls(totalPages);
}

function renderGrid(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (items.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><p>Không tìm thấy sản phẩm nào.</p></div>`;
        return;
    }

    container.innerHTML = items.map(p => {
        const inWishlist = state.wishlist.includes(p.id);
        const outOfStock = p.stock === 0;
        const stars = generateStars(p.rating);

        return `
        <div class="product-card" onclick="openProductDetail('${p.id}')">
            ${p.discount ? `<div class="sale-badge">${p.discount}</div>` : ''}
            <button class="wishlist-btn ${inWishlist ? 'active' : ''}" onclick="toggleWishlist(event, '${p.id}')">
                <i class="${inWishlist ? 'fas' : 'far'} fa-heart"></i>
            </button>
            <div class="product-img-wrapper">
                <img src="${p.image}" alt="${p.name}" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-brand">${p.brand}</div>
                <div class="product-title">${p.name}</div>
                
                ${p.description ? `
                <div class="product-desc" style="font-size: 13px; color: #777; margin: 6px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; height: 36px;">
                    ${p.description}
                </div>` : '<div style="height:36px;"></div>'}
                
                <div class="product-rating">${stars} <span>(${p.reviewsCount})</span></div>
                <div class="price-wrapper">
                    <span class="product-price">${p.priceStr}</span>
                    ${p.origPriceStr ? `<span class="product-original-price">${p.origPriceStr}</span>` : ''}
                </div>
                <button class="btn-add-cart" onclick="addToCart(event, '${p.id}')" ${outOfStock ? 'disabled' : ''}>
                    ${outOfStock ? 'Hết hàng' : '<i class="fas fa-shopping-cart"></i> Thêm vào giỏ'}
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function renderPaginationControls(totalPages) {
    const container = document.getElementById('pagination');
    if (!container) return;
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    let html = '';
    
    // Nút chuyển về trang trước (Prev)
    if (state.pagination.currentPage > 1) {
        html += `<button class="page-btn" onclick="goToPage(${state.pagination.currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === state.pagination.currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    // Nút chuyển sang trang sau (Next)
    if (state.pagination.currentPage < totalPages) {
        html += `<button class="page-btn" onclick="goToPage(${state.pagination.currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
    }
    
    container.innerHTML = html;
}

function goToPage(page) {
    state.pagination.currentPage = page;
    processAndRenderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// 4.5 SHOP HOME EXTRA SECTIONS
// (Tìm kiếm hôm nay / Gợi ý hàng đầu / Sản phẩm nổi bật / Bán chạy nhất / Ưu đãi hôm nay)
// Các mục này KHÔNG thay đổi lưới sản phẩm gốc (#productGrid), chỉ hiển thị thêm ở phía trên.
// ==========================================
function scrollToShopGrid() {
    const grid = document.getElementById('productGrid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filterAndScroll(type, value) {
    applyFilter(type, value);
    scrollToShopGrid();
}

function renderShopHomeExtras() {
    renderShopTrendingTags();
    renderShopTopPicks();
    renderShopFeaturedProducts();
    renderShopBestSellers();
    renderShopDeals();
}

function renderShopTrendingTags() {
    const container = document.getElementById('trendingTags');
    if (!container) return;
    if (!state.products.length) return;

    const typeLabels = { 'Thức ăn': 'Thức ăn', 'Snack': 'Snack / Bánh thưởng', 'Đồ dùng': 'Đồ dùng / Đồ chơi' };
    const categoryLabels = { 'Chó': 'Đồ cho Chó', 'Mèo': 'Đồ cho Mèo' };

    const brandCounts = {};
    state.products.forEach(p => { if (p.brand) brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1; });
    const topBrands = Object.keys(brandCounts).sort((a, b) => brandCounts[b] - brandCounts[a]).slice(0, 3);

    const tags = [];
    Object.keys(typeLabels).forEach(t => tags.push({ label: typeLabels[t], filterType: 'type', value: t }));
    Object.keys(categoryLabels).forEach(c => tags.push({ label: categoryLabels[c], filterType: 'category', value: c }));
    topBrands.forEach(b => tags.push({ label: b, filterType: 'brand', value: b }));

    container.innerHTML = tags.map(tag => `
        <span class="tag-pill" onclick="filterAndScroll('${tag.filterType}', '${String(tag.value).replace(/'/g, "\\'")}')">${tag.label}</span>
    `).join('');
}

function renderShopMiniCard(p, badgeLabel) {
    const stars = generateStars(p.rating);
    return `
        <div class="shop-mini-card" onclick="openProductDetail('${p.id}')">
            ${badgeLabel ? `<span class="mini-card-badge">${badgeLabel}</span>` : ''}
            <div class="mini-card-img"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>
            <div class="mini-card-info">
                <div class="mini-card-name">${p.name}</div>
                <div class="mini-card-rating">${stars} <span>(${p.reviewsCount})</span></div>
                <div class="mini-card-price">${p.priceStr}</div>
            </div>
        </div>
    `;
}

function renderShopTopPicks() {
    const grid = document.getElementById('topPicksGrid');
    if (!grid) return;
    if (!state.products.length) {
        grid.innerHTML = '<div class="shop-mini-loading"><i class="fas fa-spinner fa-spin"></i> Đang tải sản phẩm...</div>';
        return;
    }

    const items = [...state.products]
        .sort((a, b) => (parseFloat(b.rating) - parseFloat(a.rating)) || ((b.reviewsCount || 0) - (a.reviewsCount || 0)))
        .slice(0, 5);

    grid.innerHTML = items.map(p => renderShopMiniCard(p, 'Gợi ý')).join('');
}

function renderShopFeaturedProducts() {
    const grid = document.getElementById('featuredProductsGrid');
    if (!grid) return;
    if (!state.products.length) {
        grid.innerHTML = '<div class="shop-mini-loading"><i class="fas fa-spinner fa-spin"></i> Đang tải sản phẩm...</div>';
        return;
    }

    const withDiscount = state.products.filter(p => p.discount);
    const pool = withDiscount.length >= 5 ? withDiscount : state.products;
    const items = [...pool].sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0)).slice(0, 5);

    grid.innerHTML = items.map((p, idx) => renderShopMiniCard(p, idx === 0 ? 'Nổi bật' : (p.discount ? 'Giảm giá' : 'Mới'))).join('');
}

function renderShopBestSellers() {
    const list = document.getElementById('bestSellerList');
    if (!list) return;
    if (!state.products.length) {
        list.innerHTML = '<li class="shop-mini-loading">Đang tải...</li>';
        return;
    }

    const items = [...state.products].sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0)).slice(0, 5);

    list.innerHTML = items.map((p, idx) => `
        <li class="shop-ranking-item" onclick="openProductDetail('${p.id}')">
            <span class="shop-ranking-rank">${idx + 1}</span>
            <img src="${p.image}" alt="${p.name}" loading="lazy">
            <div class="shop-ranking-info">
                <div class="shop-ranking-name">${p.name}</div>
                <div class="shop-ranking-meta">
                    <span class="shop-ranking-price">${p.priceStr}</span>
                    <span class="shop-ranking-star"><i class="fas fa-star"></i> ${p.rating}</span>
                </div>
            </div>
        </li>
    `).join('');
}

function renderShopDeals() {
    const list = document.getElementById('dealsList');
    if (!list) return;
    if (!state.products.length) {
        list.innerHTML = '<li class="shop-mini-loading">Đang tải...</li>';
        return;
    }

    let items = state.products.filter(p => p.discount || p.origPriceStr);
    if (items.length < 5) items = state.products;
    items = items.slice(0, 5);

    list.innerHTML = items.map(p => `
        <li class="shop-ranking-item" onclick="openProductDetail('${p.id}')">
            <span class="shop-ranking-rank deal">${p.discount || 'HOT'}</span>
            <img src="${p.image}" alt="${p.name}" loading="lazy">
            <div class="shop-ranking-info">
                <div class="shop-ranking-name">${p.name}</div>
                <div class="shop-ranking-meta">
                    <span class="shop-ranking-price">${p.priceStr}</span>
                    ${p.origPriceStr ? `<span class="shop-ranking-original">${p.origPriceStr}</span>` : ''}
                </div>
            </div>
        </li>
    `).join('');
}

// ==========================================
// 5. WISHLIST MANAGEMENT
// ==========================================
function toggleWishlist(e, id) {
    if (e) e.stopPropagation();

    if (!checkLoginStatus() && !state.user) {
        showToast("Vui lòng đăng nhập để lưu yêu thích!", "error");
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    const index = state.wishlist.indexOf(id);
    if (index > -1) {
        state.wishlist.splice(index, 1);
        showToast("Đã bỏ khỏi danh sách yêu thích");
    } else {
        state.wishlist.push(id);
        showToast("Đã thêm vào yêu thích");
    }
    saveState('petopia_wishlist', state.wishlist);
    updateBadges();
    processAndRenderProducts();
    if (document.getElementById('tab-wishlist') && document.getElementById('tab-wishlist').classList.contains('active')) renderWishlistTab();
}

function renderWishlistTab() {
    const grid = document.getElementById('wishlistGrid');
    if (!grid) return;
    if (state.wishlist.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px;">
                <i class="fas fa-heart-broken" style="font-size: 50px; color: #ccc; margin-bottom: 15px;"></i>
                <h3 style="color: var(--text-grey);">Bạn chưa có sản phẩm yêu thích nào!</h3>
            </div>`;
        return;
    }

    let html = '';
    state.wishlist.forEach(id => {
        const product = state.products.find(p => p.id === id);
        if (product) {
            html += `
                <div class="product-card" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div class="product-img-wrap" style="position: relative;">
                            <img src="${product.image}" class="product-img" loading="lazy" style="width: 100%; height: 200px; object-fit: cover;">
                            <button class="wishlist-btn active" onclick="toggleWishlist(event, '${product.id}')" style="position: absolute; top: 10px; right: 10px; background: white; border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; color: var(--danger-color); box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                <i class="fas fa-heart"></i>
                            </button>
                        </div>
                        <div class="product-info" style="padding: 15px;">
                            <h3 class="product-title" style="font-size: 14px; margin-bottom: 5px; height: 40px; overflow: hidden;">${product.name}</h3>
                            
                            ${product.description ? `
                            <div class="product-desc" style="font-size: 12px; color: #777; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                ${product.description}
                            </div>` : ''}
                            
                            <div class="product-price" style="color: var(--primary-orange); font-weight: bold; font-size: 16px;">${product.priceStr}</div>
                        </div>
                    </div>
                    <div style="padding: 0 15px 15px 15px;">
                        <button class="btn-add-cart" onclick="addToCart(event, '${product.id}')" style="width: 100%; padding: 10px; border-radius: 5px;">
                            <i class="fas fa-cart-plus"></i> Thêm vào giỏ
                        </button>
                    </div>
                </div>
            `;
        }
    });
    grid.innerHTML = html;
}


// ==========================================
// 6. CART & CHECKOUT
// ==========================================
function addToCart(e, id) {
    if (e) e.stopPropagation();

    const sessionUser = localStorage.getItem('track_session_user');

    if (!sessionUser) {
        showToast('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1000);
        return;
    }

    const product = state.products.find(p => p.id === id);
    if (!product || product.stock === 0) {
        showToast("Sản phẩm đã hết hàng hoặc không tồn tại!", "error");
        return;
    }

    const cartItem = state.cart.find(c => c.id === id);
    if (cartItem) {
        if (cartItem.qty >= product.stock) {
            showToast("Đã đạt giới hạn tồn kho!", "error");
            return;
        }
        cartItem.qty += 1;
    } else {
        state.cart.push({ id, qty: 1, priceNum: product.priceNum });
    }
    saveState('petopia_cart', state.cart);
    updateBadges();
    showToast("Đã thêm vào giỏ hàng");
    if (document.getElementById('tab-cart') && document.getElementById('tab-cart').classList.contains('active')) renderCartTab();
}

function updateCartQty(id, delta) {
    const item = state.cart.find(c => String(c.id) === String(id));
    const product = state.products.find(p => String(p.id) === String(id));
    if (item && product) {
        const newQty = item.qty + delta;
        if (newQty > product.stock) {
            showToast("Không đủ số lượng tồn kho!", "error");
            return;
        }
        item.qty = newQty;
        if (item.qty <= 0) {
            state.cart = state.cart.filter(c => c.id !== id);
        }
        saveState('petopia_cart', state.cart);
        updateBadges();
        renderCartTab();
    }
}

function removeFromCart(index) {
    state.cart.splice(index, 1);
    saveState('petopia_cart', state.cart);
    updateBadges();
    renderCartTab();
    showToast("Đã xóa sản phẩm khỏi giỏ hàng");
}

function renderCartTab() {
    const container = document.getElementById('cartContainer');
    if (!container) return;

    if (state.cart.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px 20px;">
                <i class="fas fa-shopping-cart" style="font-size: 50px; color: #ccc; margin-bottom: 15px;"></i>
                <h3 style="color: var(--text-grey);">Giỏ hàng của bạn đang trống!</h3>
                <button class="btn-checkout" style="width: auto; padding: 10px 20px; margin-top: 15px;" onclick="switchTab('home')">Về cửa hàng</button>
            </div>`;
        return;
    }

    let html = '';
    let total = 0;


    state.cart.forEach((item, index) => {
        const product = state.products.find(p => p.id === item.id);
        if (product) {
            const itemTotal = product.priceNum * item.qty;
            total += itemTotal;

            html += `
                <div style="display: flex; gap: 15px; border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; margin-bottom: 15px; background: white; align-items: center;">
                    <img src="${product.image}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px; border: 1px solid #eee;">
                    <div style="flex: 1;">
                        <h4 style="margin-bottom: 5px; font-size: 16px; color: var(--text-main);">${product.name}</h4>
                        <p style="color: var(--primary-orange); font-weight: bold; margin-bottom: 5px;">${product.priceStr}</p>
                      <div style="display:flex; align-items:center; gap:8px;">
    <button onclick="updateCartQty(${item.id}, -1)" style="width:30px; height:30px; border-radius:50%; border:1.5px solid var(--primary-orange); background:white; color:var(--primary-orange); font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:bold;">−</button>
    <span style="font-size:15px; font-weight:bold; min-width:24px; text-align:center;">${item.qty}</span>
    <button onclick="updateCartQty(${item.id}, 1)" style="width:30px; height:30px; border-radius:50%; border:none; background:var(--primary-orange); color:white; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:bold;">+</button>
</div>
                    </div>
                    <button onclick="removeFromCart(${index})" style="background: none; border: none; color: var(--danger-color); cursor: pointer; font-size: 20px; padding: 10px;" title="Xóa sản phẩm">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
        }
    });

    html += `
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid var(--border-color); text-align: right; margin-top: 20px;">
            <div style="font-size: 18px; margin-bottom: 15px;">
                <span>Tổng tiền tạm tính: </span>
                <span style="color: var(--primary-orange); font-weight: bold; font-size: 24px;">${total.toLocaleString('vi-VN')}đ</span>
            </div>
            <button class="btn-checkout" style="padding: 15px 30px; font-size: 18px; border-radius: 8px; cursor: pointer;" onclick="checkout()">
                <i class="fas fa-money-check-alt"></i> Tiến hành thanh toán
            </button>
        </div>
    `;
    container.innerHTML = html;
}

function checkout() {
    const googleUser = checkLoginStatus();
    if (!googleUser && !state.user) {
        showToast("Vui lòng đăng nhập để tiến hành thanh toán!", "error");
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    if (state.cart.length === 0) {
        showToast("Giỏ hàng của bạn đang trống!", "error");
        return;
    }

    const total = state.cart.reduce((sum, item) => {
        let unit = Number(item.priceNum);
        if (!Number.isFinite(unit) || unit <= 0) {
            const product = state.products.find(p => p.id === item.id);
            if (!product) return sum;
            unit = Number(product.priceNum);
            if (!Number.isFinite(unit) || unit <= 0) {
                const raw = String(product.priceStr || '');
                const parsed = parseInt(raw.replace(/\D/g, ''), 10);
                if (Number.isFinite(parsed) && parsed > 0) unit = parsed;
            }
        }
        if (!Number.isFinite(unit) || unit <= 0) return sum;
        return sum + unit * (item.qty || 0);
    }, 0);

    if (document.getElementById('checkoutName')) {
        const email = googleUser ? googleUser.email : state.user.email;
        const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const matchedUser = registeredUsers.find(u => u.email === email);

        if (state.userProfile && state.userProfile.name) {
            document.getElementById('checkoutName').value = state.userProfile.name;
            document.getElementById('checkoutPhone').value = state.userProfile.phone || '';
            document.getElementById('checkoutAddress').value = state.userProfile.address || '';
            if (document.getElementById('checkoutProvince')) document.getElementById('checkoutProvince').value = state.userProfile.province || '';
        } else if (matchedUser) {
            document.getElementById('checkoutName').value = matchedUser.name || '';
            document.getElementById('checkoutPhone').value = matchedUser.phone || '';
            document.getElementById('checkoutAddress').value = matchedUser.address || '';
            if (document.getElementById('checkoutProvince')) document.getElementById('checkoutProvince').value = matchedUser.province || '';
        } else if (googleUser) {
            document.getElementById('checkoutName').value = googleUser.name;
        } else if (state.user) {
            document.getElementById('checkoutName').value = state.user.name;
        }

        // Hiển thị tóm tắt sản phẩm trong modal
        const summaryEl = document.getElementById('checkoutCartSummary');
        if (summaryEl) {
            summaryEl.innerHTML = state.cart.map(item => {
                const p = state.products.find(pr => pr.id === item.id);
                if (!p) return '';
                return `<div class="checkout-summary-item">
                    <img src="${p.image}" alt="${p.name}" class="checkout-summary-img">
                    <div class="checkout-summary-info">
                        <div class="checkout-summary-name">${p.name}</div>
                        <div class="checkout-summary-qty">x${item.qty}</div>
                    </div>
                    <div class="checkout-summary-price">${(p.priceNum * item.qty).toLocaleString('vi-VN')}đ</div>
                </div>`;
            }).join('');
        }
        const subtotalEl = document.getElementById('checkoutSubtotal');
        if (subtotalEl) subtotalEl.innerText = total.toLocaleString('vi-VN') + 'đ';
        document.getElementById('checkoutTotal').innerText = total.toLocaleString('vi-VN') + 'đ';
        // Reset QR inline mỗi lần mở checkout mới
        _currentOrderCode = '';
        const qrBox = document.getElementById('inlineQRBox');
        if (qrBox) qrBox.style.display = 'none';
        const codRadio = document.querySelector('input[name="payMethod"][value="COD"]');
        if (codRadio) codRadio.checked = true;
        document.getElementById('checkoutModal').classList.add('show');
    } else {
        showToast("Lỗi: Chưa tìm thấy HTML của bảng thanh toán!", "error");
    }
}

// Biến lưu mã đơn hàng hiện tại (dùng chung giữa toggleInlineQR và confirmCheckout)
let _currentOrderCode = '';

// Hiện/ẩn QR inline khi chọn phương thức thanh toán
function toggleInlineQR() {
    const method = document.querySelector('input[name="payMethod"]:checked')?.value?.toUpperCase();
    const box = document.getElementById('inlineQRBox');
    if (!box) return;

    if (method !== 'BANK') {
        box.style.display = 'none';
        return;
    }

    // Tính tổng tiền
    const total = state.cart.reduce((sum, item) => {
        const product = state.products.find(p => p.id === item.id);
        return product ? sum + (product.priceNum * item.qty) : sum;
    }, 0);

    // Tạo mã đơn hàng mới (hoặc giữ cũ nếu chỉ đổi method)
    if (!_currentOrderCode) {
        _currentOrderCode = 'PETOPIA' + Math.floor(100000 + Math.random() * 900000);
    }

    const isMomo = method === 'MOMO';
    const baseDir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const qrSrc   = baseDir + (isMomo ? 'assets/img/momoqr.jpg' : 'assets/img/bankqr.jpg');
    const label   = isMomo ? '💜 Ví MoMo' : '🏦 MB Bank';

    // Fill dữ liệu
    const img = document.getElementById('inlineQRImg');
    const err = document.getElementById('inlineQRErr');
    if (img) {
        img.style.display = 'block';
        if (err) err.style.display = 'none';
        img.src = qrSrc;
    }
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    set('inlineQRMethod',  label);
    set('inlineQRAmount',  total.toLocaleString('vi-VN') + 'đ');
    set('inlineQRContent', 'PETOPIA THANH TOAN ' + _currentOrderCode);

    // Hiện box
    box.style.display = 'block';
}

function confirmCheckout() {
    const name     = document.getElementById('checkoutName').value.trim();
    const phone    = document.getElementById('checkoutPhone').value.trim();
    const provinceEl = document.getElementById('checkoutProvince');
    const province = provinceEl ? provinceEl.value.trim() : '';
    const addressDetail = document.getElementById('checkoutAddress').value.trim();

    if (!name || !phone || !province || !addressDetail) {
        showToast("Vui lòng nhập đầy đủ thông tin giao hàng (kèm tỉnh/thành phố)!", "error");
        return;
    }

    const address = `${addressDetail}, ${province}`;

    const payMethod = document.querySelector('input[name="payMethod"]:checked').value.toUpperCase();

    if (payMethod === 'MOMO') {
        const total = state.cart.reduce((sum, item) => {
            const product = state.products.find(p => p.id === item.id);
            return product ? sum + (product.priceNum * item.qty) : sum;
        }, 0);
        const customerInfo = { name, phone, address, province };

        const checkoutModal = document.getElementById('checkoutModal');
        if (checkoutModal) {
            checkoutModal.classList.remove('show');
            checkoutModal.style.display = 'none';
        }

        const orderCode = 'PETOPIA' + Math.floor(100000 + Math.random() * 900000);
        sessionStorage.setItem('momo_pending_order', JSON.stringify({
            customerInfo: customerInfo,
            payMethod: payMethod,
            orderCode: orderCode,
            total: total,
            items: [...state.cart],
            timestamp: Date.now()
        }));

        if (typeof MomoPayment !== 'undefined') {
            MomoPayment.createPayment(total, 'Thanh toán đơn hàng Petopia ' + orderCode, orderCode)
                .then(res => {
                    if (res.payUrl) {
                        window.location.href = res.payUrl;
                    } else if (res.simulatedUrl) {
                        window.location.href = res.simulatedUrl;
                    }
                })
                .catch(err => {
                    showToast(err.message || 'Lỗi kết nối MoMo, vui lòng thử lại!', 'error');
                    const modal = document.getElementById('checkoutModal');
                    if (modal) {
                        modal.classList.add('show');
                        modal.style.display = 'flex';
                    }
                    document.body.style.overflow = 'hidden';
                });
        } else {
            showToast('Hệ thống thanh toán chưa sẵn sàng', 'error');
            const modal = document.getElementById('checkoutModal');
            if (modal) {
                modal.classList.add('show');
                modal.style.display = 'flex';
            }
            document.body.style.overflow = 'hidden';
        }

    } else if (payMethod === 'BANK') {
        // Tính tổng tiền trước khi đóng modal
        const total = state.cart.reduce((sum, item) => {
            const product = state.products.find(p => p.id === item.id);
            return product ? sum + (product.priceNum * item.qty) : sum;
        }, 0);
        const customerInfo = { name, phone, address, province };

        // Đóng checkout modal
        const checkoutModal = document.getElementById('checkoutModal');
        if (checkoutModal) {
            checkoutModal.classList.remove('show');
            checkoutModal.style.display = 'none';
        }

        // Dùng setTimeout để tránh event bubble, đảm bảo DOM đã cập nhật
        setTimeout(function() {
            openQRModal(total, payMethod, customerInfo);
        }, 50);

    } else {
        // COD: đặt hàng ngay
        _currentOrderCode = '';
        // Đóng checkout modal
        const checkoutModal = document.getElementById('checkoutModal');
        if (checkoutModal) {
            checkoutModal.classList.remove('show');
            checkoutModal.style.display = 'none';
        }
        executeOrderCreation({ name, phone, address, province }, payMethod);
    }
}

function handleMomoReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    const resultCode = urlParams.get('resultCode');
    const orderId = urlParams.get('orderId');

    if (resultCode !== null && orderId) {
        const pendingDataStr = sessionStorage.getItem('momo_pending_order');
        if (pendingDataStr) {
            try {
                const pendingData = JSON.parse(pendingDataStr);
                if (pendingData.orderCode === orderId) {
                    if (resultCode === '0') {
                        executeOrderCreation(pendingData.customerInfo, pendingData.payMethod);
                        showToast('Thanh toán MoMo thành công! Đang xử lý đơn hàng...', 'success');
                    } else {
                        showToast('Thanh toán MoMo thất bại: ' + (urlParams.get('message') || 'Vui lòng thử lại'), 'error');
                    }
                }
            } catch (e) {
                console.error('Lỗi xử lý kết quả MoMo:', e);
            }
            sessionStorage.removeItem('momo_pending_order');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

// HÀM MỞ QR MODAL: Fill dữ liệu vào element tĩnh trong HTML rồi hiển thị
function openQRModal(amount, method, customerInfo) {
    const qrModal = document.getElementById('qrCheckoutModal');
    if (!qrModal) {
        console.error('[openQRModal] Không tìm thấy #qrCheckoutModal trong HTML!');
        showToast('Lỗi hệ thống: không tìm thấy cửa sổ QR!', 'error');
        return;
    }

    // --- Tạo mã đơn hàng ---
    const orderCode = 'PETOPIA' + Math.floor(100000 + Math.random() * 900000);

    // --- Xác định phương thức ---
    const isMomo = method === 'MOMO';
    const baseDir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const qrUrl = baseDir + (isMomo ? 'assets/img/momoqr.jpg' : 'assets/img/bankqr.jpg');
    console.log('[QR DEBUG] Đường dẫn ảnh QR:', window.location.origin + qrUrl);
    const methodText = isMomo ? 'Ví MoMo'     : 'MB Bank';
    const badgeIcon  = isMomo ? 'fas fa-wallet' : 'fas fa-university';
    const badgeColor = isMomo ? '#ae2070'      : '#1a56db';
    const rightHdr   = isMomo ? 'Quét bằng app MoMo' : 'Quét bằng app Ngân hàng';

    // --- Fill dữ liệu vào HTML ---
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    set('qrModalTitle',      'Thanh toán qua ' + methodText);
    set('qrTransferContent', 'PETOPIA THANH TOAN ' + orderCode);
    set('qrTransferAmount',  amount.toLocaleString('vi-VN') + 'đ');

    // Badge icon + màu
    const badge = document.getElementById('qrMethodBadge');
    if (badge) {
        badge.style.background = badgeColor + '18';
        badge.style.color = badgeColor;
        badge.style.borderColor = badgeColor + '40';
        const iconEl = badge.querySelector('i');
        if (iconEl) iconEl.className = badgeIcon;
    }

    // Right header
    const rh = document.getElementById('qrRightHeader');
    if (rh) rh.innerText = rightHdr;

    // --- Gán ảnh QR ---
    const imgEl = document.getElementById('qrModalImg');
    const errEl = document.getElementById('qrImgError');
    if (imgEl) {
        imgEl.style.display = 'block';
        if (errEl) errEl.style.display = 'none';
        imgEl.src = qrUrl;
        imgEl.alt = 'Mã QR ' + methodText;
    }

    // --- Hiện modal --- (move to body để tránh stacking context, delay nhỏ để DOM settle)
    document.body.appendChild(qrModal); // đảm bảo luôn ở top-level
    requestAnimationFrame(function() {
        qrModal.style.cssText = 'display:flex !important; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.65); z-index:999999; justify-content:center; align-items:center;';
        document.body.style.overflow = 'hidden';
    });

    // --- Xử lý nút XÁC NHẬN ĐÃ THANH TOÁN ---
    window.handleQRPaymentSuccess = function() {
        qrModal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.65); z-index:999999; justify-content:center; align-items:center;';
        document.body.style.overflow = 'auto';
        executeOrderCreation(customerInfo, method);
    };

    // --- Xử lý nút HỦY ---
    window.handleQRPaymentCancel = function() {
        qrModal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.65); z-index:999999; justify-content:center; align-items:center;';
        document.body.style.overflow = 'auto';
        showToast('Đã hủy thanh toán. Sản phẩm vẫn còn trong giỏ hàng.', 'error');
        if (typeof switchTab === 'function') switchTab('cart');
    };
}

// HÀM XỬ LÝ ĐẶT HÀNG: Đồng bộ trực tiếp vào tài khoản người dùng và LocalStorage hệ thống
function executeOrderCreation(customerInfo, payMethod) {

    // console.log('[executeOrderCreation] state.products sample =', state.products?.slice(0, 3));

    // TÍNH TỔNG TIỀN
    // Debug: kiểm tra xem state.cart / state.products match id có ra price hợp lệ không.
    // Lưu ý: console.log sẽ giúp thấy ngay trên browser console khi checkout.
    console.log('[executeOrderCreation] cart=', JSON.stringify(state.cart));
    console.log('[executeOrderCreation] products sample=', JSON.stringify(state.products && state.products.slice ? state.products.slice(0, 5) : state.products));

    const totalAmount = state.cart.reduce((sum, item) => {

        // Debug item
        console.log('[executeOrderCreation] item', item);


            const pid = item && item.id != null ? String(item.id) : null;
            const qty = Number(item && item.qty);
            if (!pid || !Number.isFinite(qty) || qty <= 0) return sum;

            let unit = Number(item.priceNum);
            if (!Number.isFinite(unit) || unit <= 0) {
                const product = state.products.find(p => String(p.id) === pid);
                if (product) {
                    unit = Number(product.priceNum);
                    if (!Number.isFinite(unit) || unit <= 0) {
                        const raw = String(product.priceStr || '');
                        const parsed = parseInt(raw.replace(/\D/g, ''), 10);
                        if (Number.isFinite(parsed) && parsed > 0) unit = parsed;
                    }
                }
            }

            if (!Number.isFinite(unit) || unit <= 0) return sum;
            return sum + unit * qty;
        }, 0);



    // ======= 1) Tạo mã/giá trị order chung =======
    const generatedOrderCode = 'PETOPIA' + Math.floor(100000 + Math.random() * 900000);
    const dateText = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN');

    // Status để admin map ra badge (ưu tiên processing theo yêu cầu)
    const orderStatusForAdmin = 'processing';

    const newOrder = {
        // frontend order structure
        id: generatedOrderCode,
        orderId: generatedOrderCode,
        date: dateText,
        total: totalAmount,
        totalAmount: totalAmount,
        // admin không dùng field này trực tiếp, nhưng giữ để tương thích
        amount: totalAmount,
        status: orderStatusForAdmin,
        items: [...state.cart],
        customer: { name: customerInfo.name, phone: customerInfo.phone, address: customerInfo.address, province: customerInfo.province },
        customerName: customerInfo.name,
        paymentMethod: payMethod
    };

    // Lưu vào trạng thái ứng dụng hiện hành
    state.orders.unshift(newOrder);

    // ======= 2) Đồng bộ vào backend để admin nhìn thấy =======
    // Admin page đang gọi: GET http://localhost:3500/orders và PUT/DELETE /orders/:id
    // Với json-server, POST /orders sẽ tạo record.
    var ORDERS_API = 'http://localhost:3500/orders';

    fetch(ORDERS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            orderId: generatedOrderCode,
            customer: { name: customerInfo.name, phone: customerInfo.phone, address: customerInfo.address, province: customerInfo.province },
            customerName: customerInfo.name,
            totalAmount: totalAmount,
            total: totalAmount,
            amount: totalAmount,
            // admin dùng fallback (totalAmount ?? total ?? amount)
            date: dateText,
            createdAt: dateText,
            status: orderStatusForAdmin,
            paymentMethod: payMethod,
            items: [...state.cart]
        }),
        // Debug fields để kiểm tra totalAmount/amount có được tính đúng từ cart hay không
        // (không ảnh hưởng UI nếu admin chỉ render total/amount)
        itemsComputedTotal: totalAmount
    })
        .then(function (r) { 
            // nếu json-server trả về body, in để kiểm tra field totalAmount thực sự đã POST lên
            try { r && r.json && r.json().then(d => console.log('[executeOrderCreation] POST response', d)).catch(()=>{}); } catch (e) {}
        })
        .then(function () {
            // không chặn luồng UI
        })
        .catch(function (err) {
            console.error('Không POST được order lên backend:', err);
        });

    // ======= 3) Đồng bộ LocalStorage như cũ =======
    const sessionUserEmail = localStorage.getItem('track_session_user');
    let registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    let currentUserData = registeredUsers.find(u => u.email === sessionUserEmail);

    if (currentUserData) {
        currentUserData.orders = state.orders;

        // Đặt hàng thành công -> Xóa sản phẩm khỏi giỏ hàng
        state.cart = [];
        currentUserData.cart = [];

        localStorage.setItem('registered_users', JSON.stringify(registeredUsers));
    } else {
        if (sessionUserEmail) {
            registeredUsers.push({
                email: sessionUserEmail,
                cart: [],
                wishlist: [],
                orders: state.orders
            });
            localStorage.setItem('registered_users', JSON.stringify(registeredUsers));
        }
    }

    // Lưu trạng thái phụ của giỏ hàng
    saveState('petopia_cart', state.cart);
    saveState('petopia_orders', state.orders);

    // Cập nhật toàn bộ giao diện Badge số lượng và Tab Giỏ hàng trống
    updateBadges();
    renderCartTab();

    // Đóng QR modal và checkout modal nếu còn mở
    const qrModal = document.getElementById('qrCheckoutModal');
    if (qrModal) { qrModal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.65); z-index:999999; justify-content:center; align-items:center;'; }
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) { checkoutModal.classList.remove('show'); checkoutModal.style.display = 'none'; }
    document.body.style.overflow = 'auto';

    // ShowToast thông báo thành công theo yêu cầu
    showToast("🎉 Bạn đã đặt hàng thành công!", "success");

    // Điều hướng khách hàng về Tab quản lý đơn hàng
    if (typeof switchTab === 'function') {
        switchTab('orders');
    }
}



// ==========================================
// 7. ORDERS TRACKING
// ==========================================
function renderOrdersTab() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    if (state.orders.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-box"></i><p>Bạn chưa có đơn hàng nào.</p></div>`;
        return;
    }

    let html = '';
    state.orders.forEach((o, index) => {
        const s1 = o.status >= 1 ? 'active' : '';
        const s2 = o.status >= 2 ? 'active' : '';
        const s3 = o.status >= 3 ? 'active' : '';

        let itemsText = o.items.map(i => {
            const p = state.products.find(x => x.id === i.id);
            return p ? `${p.name} (x${i.qty})` : 'Sản phẩm không xác định';
        }).join(', ');

        let payMethodText = "Không xác định";
        if (o.paymentMethod === 'BANK') payMethodText = 'Chuyển khoản';
        else if (o.paymentMethod === 'MOMO') payMethodText = 'Ví MoMo';
        else if (o.paymentMethod === 'COD') payMethodText = 'Tiền mặt (COD)';

        html += `
        <div class="order-card">
            <div class="order-header">
                <span>Mã đơn: ${o.orderId} - <span style="font-size: 13px; color: var(--text-grey); font-weight: normal">${o.date}</span></span>
                <span class="order-status">${o.status === 1 ? 'Chờ xác nhận' : (o.status === 2 ? 'Đang giao hàng' : 'Đã hoàn tất')}</span>
            </div>
            
            <p style="font-size: 13px; color: var(--primary-orange); margin-bottom: 5px;"><i class="fas fa-wallet"></i> Thanh toán: ${payMethodText}</p>
            <p style="font-size: 14px; margin-bottom: 10px; color: var(--text-grey);">${itemsText}</p>
            
            <div class="tracking-timeline">
                <div class="track-step ${s1}"><div class="track-dot">1</div>Xác nhận</div>
                <div class="track-step ${s2}"><div class="track-dot">2</div>Giao hàng</div>
                <div class="track-step ${s3}"><div class="track-dot">3</div>Hoàn tất</div>
            </div>
            ${o.status < 3 ? `<div style="text-align:right; margin-top:15px;"><button onclick="demoUpdateOrderStatus(${index})" style="padding: 6px 12px; background:var(--dark-green); color:white; border:none; border-radius:4px; cursor:pointer;">Demo: Cập nhật Tracking</button></div>` : ''}
        </div>`;
    });
    container.innerHTML = html;
}

function demoUpdateOrderStatus(index) {
    if (state.orders[index].status < 3) {
        state.orders[index].status += 1;
        saveState('petopia_orders', state.orders);
        renderOrdersTab();
        showToast("Đã cập nhật trạng thái đơn hàng (Demo)");
    }
}


// ==========================================
// 8. PRODUCT DETAIL PAGE (kiểu Shopee) & MODALS/UTILITIES
// ==========================================
function openProductDetail(id) {
    const p = state.products.find(x => String(x.id) === String(id));
    if (!p) return;

    // Ghi nhớ tab hiện tại để nút "Quay lại" trả về đúng chỗ
    const currentActiveTab = document.querySelector('.tab-content.active');
    if (currentActiveTab && currentActiveTab.id !== 'tab-product-detail') {
        state.productDetailReturnTab = currentActiveTab.id.replace('tab-', '');
    }

    state.currentDetailProductId = p.id;
    renderProductDetailPage(p);
    switchTab('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backFromProductDetail() {
    switchTab(state.productDetailReturnTab || 'home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderProductDetailPage(p) {
    const inWishlist = state.wishlist.includes(p.id);

    document.getElementById('pdBreadcrumbName').innerText = p.name;
    document.getElementById('pdImage').src = p.image;
    document.getElementById('pdImage').alt = p.name;
    document.getElementById('pdBrand').innerText = `Thương hiệu: ${p.brand}`;
    document.getElementById('pdCategory').innerText = p.category === 'Chó/Mèo' ? 'Chó & Mèo' : p.category;
    document.getElementById('pdTitle').innerText = p.name;
    document.getElementById('pdRatingStars').innerHTML = generateStars(p.rating);
    document.getElementById('pdRatingNumber').innerText = p.rating;
    document.getElementById('pdReviewsCount').innerText = `${p.reviewsCount} đánh giá`;
    document.getElementById('pdSoldCount').innerText = `Đã bán ${p.reviewsCount * 3}`;
    document.getElementById('pdPrice').innerText = p.priceStr;
    document.getElementById('pdOriginalPrice').innerText = p.origPriceStr || '';

    const discountBadge = document.getElementById('pdDiscountBadge');
    discountBadge.innerText = p.discount || '';
    discountBadge.style.display = p.discount ? 'inline-block' : 'none';

    document.getElementById('pdDescription').innerHTML = p.description || 'Chưa có thông tin mô tả chi tiết cho sản phẩm này.';

    const qtyInput = document.getElementById('pdQty');
    qtyInput.value = 1;
    qtyInput.max = p.stock || 1;

    const stockBadge = document.getElementById('pdStockBadge');
    const addBtn = document.getElementById('pdAddToCartBtn');
    const buyBtn = document.getElementById('pdBuyNowBtn');

    if (p.stock > 0) {
        stockBadge.className = 'pd-stock stock-in';
        stockBadge.innerText = `Còn hàng (Tồn kho: ${p.stock})`;
        addBtn.disabled = false;
        buyBtn.disabled = false;
        addBtn.innerHTML = '<i class="fas fa-cart-plus"></i> Thêm vào giỏ';
        buyBtn.innerHTML = 'Mua ngay';
    } else {
        stockBadge.className = 'pd-stock stock-out';
        stockBadge.innerText = 'Hết hàng';
        addBtn.disabled = true;
        buyBtn.disabled = true;
        addBtn.innerHTML = 'Đã hết hàng';
        buyBtn.innerHTML = 'Đã hết hàng';
    }

    const wlBtn = document.getElementById('pdWishlistBtn');
    wlBtn.innerHTML = `<i class="${inWishlist ? 'fas' : 'far'} fa-heart"></i> ${inWishlist ? 'Đã thích' : 'Yêu thích'}`;
    wlBtn.classList.toggle('active', inWishlist);
    wlBtn.onclick = (e) => { toggleWishlist(e, p.id); renderProductDetailPage(p); };

    addBtn.onclick = (e) => {
        const qty = Math.max(1, parseInt(qtyInput.value) || 1);
        for (let i = 0; i < qty; i++) addToCart(e, p.id);
    };
    buyBtn.onclick = (e) => {
        const qty = Math.max(1, parseInt(qtyInput.value) || 1);
        for (let i = 0; i < qty; i++) addToCart(e, p.id);
        switchTab('cart');
    };

    renderProductGallery(p);
    renderProductReviews(p);
    renderSimilarProducts(p);
}

function changePdQty(delta) {
    const input = document.getElementById('pdQty');
    if (!input) return;
    const p = state.products.find(x => String(x.id) === String(state.currentDetailProductId));
    let val = (parseInt(input.value) || 1) + delta;
    if (val < 1) val = 1;
    if (p && p.stock > 0 && val > p.stock) val = p.stock;
    input.value = val;
}

// ------------------------------------------
// Gallery ảnh sản phẩm (nhiều ảnh xem/thu nhỏ)
// Dữ liệu gốc chỉ có 1 ảnh/sản phẩm, nên tạo thêm các biến thể hiển thị
// (góc nhìn/tông màu khác nhau) từ chính ảnh đó để có một gallery đầy đủ.
// ------------------------------------------
const PD_GALLERY_VARIANTS = [
    { filter: 'none', transform: 'none' },
    { filter: 'contrast(1.12) saturate(1.15)', transform: 'none' },
    { filter: 'brightness(1.08) sepia(0.12)', transform: 'none' },
    { filter: 'grayscale(0.3)', transform: 'none' },
    { filter: 'none', transform: 'scaleX(-1)' },
    { filter: 'contrast(0.95) brightness(1.06)', transform: 'scale(1.04)' }
];

function renderProductGallery(p) {
    const mainImg = document.getElementById('pdImage');
    const thumbsContainer = document.getElementById('pdGalleryThumbs');
    if (!mainImg || !thumbsContainer) return;

    mainImg.style.filter = 'none';
    mainImg.style.transform = 'none';
    mainImg.src = p.image;
    mainImg.alt = p.name;

    window.__pdGalleryVariants = PD_GALLERY_VARIANTS;

    thumbsContainer.innerHTML = PD_GALLERY_VARIANTS.map((v, idx) => `
        <div class="pd-thumb ${idx === 0 ? 'active' : ''}" onclick="selectPdThumb(${idx}, this)">
            <img src="${p.image}" alt="${p.name} - ảnh ${idx + 1}" style="filter:${v.filter}; transform:${v.transform};" loading="lazy">
        </div>
    `).join('');
}

function selectPdThumb(index, el) {
    const mainImg = document.getElementById('pdImage');
    const variant = (window.__pdGalleryVariants || [])[index];
    if (!mainImg || !variant) return;

    mainImg.style.filter = variant.filter;
    mainImg.style.transform = variant.transform;

    document.querySelectorAll('#pdGalleryThumbs .pd-thumb').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
}

// ------------------------------------------
// Đánh giá sản phẩm (dữ liệu minh hoạ / bịa để demo giao diện)
// Dùng random có "seed" theo id sản phẩm để mỗi sản phẩm luôn có cùng
// một bộ đánh giá trong suốt phiên xem, không bị đổi lung tung mỗi lần render.
// ------------------------------------------
function pdHashSeed(str) {
    let hash = 0;
    for (let i = 0; i < String(str).length; i++) {
        hash = (hash * 31 + String(str).charCodeAt(i)) % 2147483647;
    }
    return hash <= 0 ? hash + 2147483646 : hash;
}

function pdSeededRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

const PD_REVIEWER_NAMES = [
    'Nguyễn Thị Hồng', 'Trần Văn Nam', 'Lê Thị Mai', 'Phạm Minh Khoa', 'Hoàng Thu Trang',
    'Đặng Quốc Huy', 'Vũ Thị Ngọc', 'Bùi Anh Tuấn', 'Đỗ Thị Thảo', 'Ngô Văn Sơn',
    'Phan Thị Lan', 'Trịnh Đức Anh', 'Lý Thị Kim', 'Dương Văn Phúc', 'Mai Thị Hà',
    'Đinh Công Danh', 'Tô Thị Yến', 'Huỳnh Văn Long', 'Cao Thị Diễm', 'Lâm Quốc Bảo',
    'Chu Thị Nga', 'Vương Minh Đức', 'Tăng Thị Thu', 'Từ Văn Hải', 'Kiều Thị Oanh'
];

const PD_REVIEW_TEMPLATES = {
    5: [
        'Sản phẩm rất chất lượng, đóng gói cẩn thận, giao hàng nhanh. Bé nhà mình rất thích!',
        'Đúng như mô tả, giá cả hợp lý. Mình sẽ ủng hộ shop dài dài.',
        'Shop tư vấn nhiệt tình, hàng chuẩn chính hãng, sẽ quay lại mua tiếp.',
        'Chất lượng vượt mong đợi, thú cưng nhà mình dùng rất hợp, không bị dị ứng gì cả.',
        'Giao hàng siêu nhanh, đóng gói kỹ càng, sản phẩm còn mới nguyên tem mác.',
        'Mua lần 2 rồi, vẫn chất lượng như lần đầu. Petopia làm ăn uy tín.',
        'Giá tốt hơn nhiều so với ngoài tiệm mà chất lượng không thua kém.',
        'Bé cún nhà mình ăn ngon miệng hẳn từ khi đổi qua sản phẩm này.',
        'Đóng gói cẩn thận, có lớp bảo vệ chống va đập, rất yên tâm khi vận chuyển xa.',
        'Nhân viên hỗ trợ đổi trả nhanh gọn khi mình đặt nhầm loại, rất hài lòng.'
    ],
    4: [
        'Sản phẩm ổn, giao hơi chậm một chút nhưng chất lượng tốt.',
        'Chất lượng tốt, chỉ tiếc là bao bì hơi móp khi nhận hàng.',
        'Giá hợp lý, thú cưng nhà mình dùng quen dần, sẽ mua lại.',
        'Hàng đúng mô tả, đóng gói khá ổn, sẽ ủng hộ shop tiếp.',
        'Tạm ổn so với giá tiền, mong shop cải thiện thêm về tốc độ giao hàng.',
        'Sản phẩm tốt nhưng mùi hơi nồng lúc mới mở hộp, dùng vài ngày thì ổn.'
    ],
    3: [
        'Sản phẩm bình thường, không quá xuất sắc nhưng cũng không tệ.',
        'Chất lượng tạm ổn, giao hàng đúng hẹn.',
        'Dùng cũng được, thú cưng nhà mình không quá thích nhưng vẫn ăn/dùng bình thường.',
        'Giá hơi cao so với chất lượng nhận được, mong shop xem xét lại.'
    ],
    2: [
        'Sản phẩm nhận được có hơi khác so với hình ảnh trên web.',
        'Đóng gói chưa được kỹ, hộp bị móp khi giao tới.'
    ],
    1: [
        'Giao hàng khá chậm so với dự kiến, mong shop cải thiện.',
        'Sản phẩm không như mong đợi, sẽ cân nhắc lại lần sau.'
    ]
};

const PD_REVIEW_DATE_LABELS = [
    'Hôm qua', '2 ngày trước', '3 ngày trước', '5 ngày trước',
    '1 tuần trước', '2 tuần trước', '3 tuần trước',
    '1 tháng trước', '2 tháng trước', '3 tháng trước'
];

// Sinh ra một danh sách đánh giá (bịa) cho 1 sản phẩm, số sao được rải theo đúng
// tỉ lệ % của biểu đồ đánh giá phía trên để đồng bộ số liệu.
function generatePdReviews(p, breakdown, count) {
    const rand = pdSeededRandom(pdHashSeed(p.id) + 7);
    const usedNames = new Set();
    const reviews = [];

    // Xây "bể" số sao theo đúng tỉ lệ % breakdown để chọn ngẫu nhiên có trọng số
    const weightedStars = [];
    breakdown.forEach(b => {
        const times = Math.max(1, Math.round(b.pct));
        for (let i = 0; i < times; i++) weightedStars.push(b.star);
    });

    for (let i = 0; i < count; i++) {
        const star = weightedStars[Math.floor(rand() * weightedStars.length)] || 5;
        const templates = PD_REVIEW_TEMPLATES[star] || PD_REVIEW_TEMPLATES[5];
        const text = templates[Math.floor(rand() * templates.length)];

        let name = PD_REVIEWER_NAMES[Math.floor(rand() * PD_REVIEWER_NAMES.length)];
        let guard = 0;
        while (usedNames.has(name) && guard < 5) {
            name = PD_REVIEWER_NAMES[Math.floor(rand() * PD_REVIEWER_NAMES.length)];
            guard++;
        }
        usedNames.add(name);

        const dateLabel = PD_REVIEW_DATE_LABELS[Math.floor(rand() * PD_REVIEW_DATE_LABELS.length)];
        const verified = rand() > 0.15;
        const helpfulCount = Math.floor(rand() * 45);

        reviews.push({ name, star, text, dateLabel, verified, helpfulCount });
    }

    // Sắp theo thời gian gần nhất cho tự nhiên hơn (thứ tự trong mảng nhãn ngày ở trên)
    reviews.sort((a, b) => PD_REVIEW_DATE_LABELS.indexOf(a.dateLabel) - PD_REVIEW_DATE_LABELS.indexOf(b.dateLabel));
    return reviews;
}

function renderProductReviews(p) {
    const container = document.getElementById('pdReviewsList');
    if (!container) return;

    const ratingRounded = Math.round(parseFloat(p.rating));
    const breakdown = [5, 4, 3, 2, 1].map(star => {
        let pct;
        if (star === ratingRounded) pct = 55;
        else if (star === ratingRounded - 1) pct = 25;
        else if (star === ratingRounded + 1) pct = 12;
        else pct = 3;
        return { star, pct };
    });

    const INITIAL_VISIBLE = 6;
    const TOTAL_REVIEWS = 24; // càng nhiều đánh giá minh hoạ càng thể hiện được sản phẩm "hot"
    const reviews = generatePdReviews(p, breakdown, TOTAL_REVIEWS);

    const commentsHtml = reviews.map((r, idx) => `
        <div class="pd-review-comment ${idx >= INITIAL_VISIBLE ? 'pd-review-hidden' : ''}" data-review-index="${idx}">
            <div class="pd-review-comment-head">
                <div class="pd-review-who">
                    <div class="pd-review-avatar"><i class="fas fa-user-circle"></i></div>
                    <div>
                        <div class="pd-review-name-row">
                            <span class="pd-review-name">${r.name}</span>
                            ${r.verified ? '<span class="pd-review-verified"><i class="fas fa-check-circle"></i> Đã mua hàng</span>' : ''}
                        </div>
                        <div class="pd-review-comment-stars">${generateStars(r.star)}</div>
                    </div>
                </div>
                <span class="pd-review-date">${r.dateLabel}</span>
            </div>
            <div class="pd-review-comment-text">${r.text}</div>
            <div class="pd-review-helpful"><i class="fas fa-thumbs-up"></i> Hữu ích (${r.helpfulCount})</div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="pd-review-summary">
            <div class="pd-review-score">
                <div class="pd-review-score-num">${p.rating}<span>/5</span></div>
                <div class="pd-review-score-stars">${generateStars(p.rating)}</div>
                <div class="pd-review-score-count">${p.reviewsCount} đánh giá</div>
            </div>
            <div class="pd-review-bars">
                ${breakdown.map(b => `
                    <div class="pd-review-bar-row">
                        <span class="pd-review-bar-label">${b.star} <i class="fas fa-star"></i></span>
                        <div class="pd-review-bar-track"><div class="pd-review-bar-fill" style="width:${b.pct}%"></div></div>
                        <span class="pd-review-bar-pct">${b.pct}%</span>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="pd-review-comments" id="pdReviewComments">
            ${commentsHtml}
        </div>
        ${reviews.length > INITIAL_VISIBLE ? `<button class="pd-review-more-btn" id="pdReviewMoreBtn" onclick="showMorePdReviews()">Xem thêm đánh giá (${reviews.length - INITIAL_VISIBLE})</button>` : ''}
    `;
}

function showMorePdReviews() {
    document.querySelectorAll('#pdReviewComments .pd-review-hidden').forEach(el => el.classList.remove('pd-review-hidden'));
    const btn = document.getElementById('pdReviewMoreBtn');
    if (btn) btn.remove();
}

function renderSimilarProducts(p) {
    const grid = document.getElementById('pdSimilarGrid');
    if (!grid) return;

    let items = state.products.filter(x => x.id !== p.id && (x.category === p.category || x.brand === p.brand || x.type === p.type));
    if (items.length < 4) {
        items = state.products.filter(x => x.id !== p.id);
    }
    items = items.slice(0, 6);

    if (items.length === 0) {
        grid.innerHTML = '<div class="shop-mini-loading">Chưa có sản phẩm tương tự.</div>';
        return;
    }

    grid.innerHTML = items.map(sp => renderShopMiniCard(sp, null)).join('');
}

function closeModal(modalId, e) {
    if (e && e.target !== document.getElementById(modalId) && !e.target.classList.contains('modal-close')) return;
    document.getElementById(modalId).classList.remove('show');
    document.body.style.overflow = 'auto';
}

function switchTab(tabId) {
    var shopPage = document.getElementById('shop-page');
    if (shopPage) shopPage.style.display = 'block';
    
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    var targetTab = document.getElementById(`tab-${tabId}`);
    if(targetTab) targetTab.classList.add('active');
    
    var btn = document.getElementById(`tab-btn-${tabId}`);
    if (btn) btn.classList.add('active');

    if (tabId === 'cart') renderCartTab();
    if (tabId === 'wishlist') renderWishlistTab();
    if (tabId === 'orders') renderOrdersTab();
    if (tabId === 'account') renderAccountTab();
}

function updateBadges() {
    const cartBadge = document.getElementById('cartCount');
    const wlBadge = document.getElementById('wishlistCount');
    if(cartBadge) cartBadge.innerText = state.cart.reduce((a, b) => a + b.qty, 0);
    if(wlBadge) wlBadge.innerText = state.wishlist.length;
}

// Lưu trạng thái dữ liệu giỏ hàng/yêu thích/đơn hàng riêng cho từng tài khoản đăng nhập
function saveState(key, data) {
    const googleUser = checkLoginStatus();
    const email = googleUser ? googleUser.email : (state.user ? state.user.email : null);
    
    if (email) {
        let users = JSON.parse(localStorage.getItem('registered_users') || '[]');
        let index = users.findIndex(u => u.email === email);
        
        if (index === -1) {
            users.push({ email: email, cart: [], wishlist: [], orders: [] });
            index = users.length - 1;
        }
        
        if (key === 'petopia_cart') users[index].cart = data;
        if (key === 'petopia_wishlist') users[index].wishlist = data;
        if (key === 'petopia_orders') users[index].orders = data;
        
        localStorage.setItem('registered_users', JSON.stringify(users));
    }
}

function generateStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) html += '<i class="fas fa-star"></i>';
        else if (i - 0.5 <= rating) html += '<i class="fas fa-star-half-alt"></i>';
        else html += '<i class="far fa-star"></i>';
    }
    return html;
}

function showToast(msg, type = "success") {
    const container = document.getElementById('toastContainer');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="${type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function toggleDarkMode() {
    state.isDarkMode = !state.isDarkMode;
    localStorage.setItem('petopia_darkmode', state.isDarkMode);
    applyDarkMode();
}

function applyDarkMode() {
    const icon = document.getElementById('darkModeIcon');
    if(!icon) return;
    if (state.isDarkMode) {
        document.body.classList.add('dark');
        icon.className = 'fas fa-sun';
    } else {
        document.body.classList.remove('dark');
        icon.className = 'fas fa-moon';
    }
}

function loadPage(page) {
    fetch(page)
        .then(response => response.text())
        .then(data => {
            const contentArea = document.getElementById('content');
            if(contentArea) contentArea.innerHTML = data;
        });
}