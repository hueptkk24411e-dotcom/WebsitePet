// ==========================================
// HOMEPAGE: Banner Carousel & Featured Products
// ==========================================

(function () {
    let currentSlide = 0;
    let totalSlides = 0;
    let cachedHotelData = null;

    const PENDING_HOTEL_BOOKING_KEY = 'pendingHotelBooking';
    const PENDING_GROOMING_SERVICE_KEY = 'pendingGroomingService';

    const HOME_FEATURED_ROOMS = [
        { petType: 'dog', roomType: 'normal', roomNumber: 'P101' },
        { petType: 'dog', roomType: 'premium', roomNumber: 'C201' },
        { petType: 'dog', roomType: 'vip', roomNumber: 'VIP301' },
        { petType: 'cat', roomType: 'normal', roomNumber: 'M101' }
    ];

    const HOME_FEATURED_SERVICE_IDS = ['service_1', 'service_2', 'service_3', 'service_5'];

    const ROOM_TYPE_LABELS = {
        normal: 'Tiêu chuẩn',
        premium: 'Cao cấp',
        vip: 'VIP'
    };

    document.addEventListener('DOMContentLoaded', initHomePage);

    function initHomePage() {
        initBannerCarousel();
        loadHomeHotelRooms();
        loadHomeGroomingServices();
        loadHomeBlogPosts();
        if (typeof window.renderFeaturedProducts === 'function') {
            window.renderFeaturedProducts();
        }
    }

    function initBannerCarousel() {
        const track = document.getElementById('homeCarouselTrack');
        const dotsContainer = document.getElementById('homeCarouselDots');
        if (!track || !dotsContainer) return;

        const slides = track.querySelectorAll('.carousel-slide');
        totalSlides = slides.length;
        if (totalSlides === 0) return;

        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Slide ' + (i + 1));
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }

        document.getElementById('homeCarouselPrev')?.addEventListener('click', () => {
            goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
        });

        document.getElementById('homeCarouselNext')?.addEventListener('click', () => {
            goToSlide((currentSlide + 1) % totalSlides);
        });
    }

    function goToSlide(index) {
        const track = document.getElementById('homeCarouselTrack');
        const dots = document.querySelectorAll('#homeCarouselDots .carousel-dot');
        if (!track || !dots.length) return;

        currentSlide = index;
        track.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }

    window.renderFeaturedProducts = function () {
        const grid = document.getElementById('homeFeaturedGrid');
        if (!grid) return;

        if (typeof state === 'undefined' || !state.products.length) {
            grid.innerHTML = '<div class="home-featured-loading"><i class="fas fa-spinner fa-spin"></i> Đang tải sản phẩm...</div>';
            return;
        }

        const topProducts = [...state.products]
            .sort((a, b) => {
                const ratingDiff = parseFloat(b.rating) - parseFloat(a.rating);
                if (ratingDiff !== 0) return ratingDiff;
                return (b.reviewsCount || 0) - (a.reviewsCount || 0);
            })
            .slice(0, 10);

        grid.innerHTML = topProducts.map(p => {
            const outOfStock = p.stock === 0;
            return `
                <div class="home-product-card" onclick="openShopProduct('${p.id}')">
                    <img class="home-product-img" src="${p.image}" alt="${p.name}" loading="lazy">
                    <div class="home-product-info">
                        <div class="home-product-name">${p.name}</div>
                        <div class="home-product-price">${p.priceStr}</div>
                    </div>
                    <button class="home-product-cart-btn"
                        onclick="addToCart(event, '${p.id}')"
                        ${outOfStock ? 'disabled title="Hết hàng"' : 'title="Thêm vào giỏ hàng"'}>
                        <i class="fas fa-shopping-cart"></i>
                    </button>
                </div>
            `;
        }).join('');
    };

    async function getHotelData() {
        if (cachedHotelData) return cachedHotelData;
        if (typeof rooms !== 'undefined' && rooms.dog) {
            cachedHotelData = rooms;
            return cachedHotelData;
        }
        try {
            const res = await fetch('assets/dataset/hotel.json');
            cachedHotelData = await res.json();
        } catch (e) {
            console.warn('Không tải được hotel.json cho trang chủ');
            cachedHotelData = null;
        }
        return cachedHotelData;
    }

    function findRoom(hotelData, petType, roomType, roomNumber) {
        return hotelData?.[petType]?.[roomType]?.find(r => r.roomNumber === roomNumber) || null;
    }

    window.bookHomeHotelRoom = async function (petType, roomType, roomNumber) {
        const hotelData = await getHotelData();
        const room = findRoom(hotelData, petType, roomType, roomNumber);
        if (!room) {
            showPage('hotel');
            return;
        }
        try {
            localStorage.setItem(PENDING_HOTEL_BOOKING_KEY, JSON.stringify({ room, petType, roomType }));
        } catch (e) {
            console.error('Không thể lưu thông tin phòng đã chọn:', e);
        }
        window.location.href = 'booking.html';
    };

    async function loadHomeHotelRooms() {
        const grid = document.getElementById('homeHotelGrid');
        if (!grid) return;

        const hotelData = await getHotelData();
        const cards = HOME_FEATURED_ROOMS.map(item => {
            const room = findRoom(hotelData, item.petType, item.roomType, item.roomNumber);
            if (!room) return '';

            const petLabel = item.petType === 'dog' ? 'Chó' : 'Mèo';
            const typeLabel = ROOM_TYPE_LABELS[item.roomType] || item.roomType;
            const imageHtml = room.image
                ? `<img src="${room.image}" alt="${room.roomName}" loading="lazy">`
                : '';

            return `
                <div class="home-hotel-card" role="button" tabindex="0"
                     onclick="bookHomeHotelRoom('${item.petType}', '${item.roomType}', '${item.roomNumber}')"
                     onkeydown="if(event.key==='Enter')bookHomeHotelRoom('${item.petType}', '${item.roomType}', '${item.roomNumber}')">
                    <div class="home-hotel-card-image">${imageHtml}</div>
                    <div class="home-hotel-card-body">
                        <span class="home-hotel-card-badge">${petLabel} · ${typeLabel}</span>
                        <span class="home-hotel-card-name">${room.roomName}</span>
                        <span class="home-hotel-card-meta">${room.roomNumber} · ${room.price}</span>
                    </div>
                </div>
            `;
        }).filter(Boolean);

        grid.innerHTML = cards.length
            ? cards.join('')
            : '<div class="home-featured-loading">Không thể tải danh sách phòng.</div>';
    }

    function formatVnd(value) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(value);
    }

    window.bookHomeGroomingService = function (serviceId) {
        try {
            localStorage.setItem(PENDING_GROOMING_SERVICE_KEY, serviceId);
        } catch (e) {
            console.error('Không thể lưu dịch vụ grooming đã chọn:', e);
        }
        window.location.href = 'grooming-booking.html';
    };

    async function loadHomeGroomingServices() {
        const grid = document.getElementById('homeGroomingGrid');
        if (!grid) return;

        let services = [];
        try {
            const res = await fetch('assets/dataset/grooming-services.json');
            if (res.ok) {
                services = await res.json();
            }
        } catch (e) {
            console.warn('Không tải được grooming-services.json cho trang chủ');
        }

        const featured = HOME_FEATURED_SERVICE_IDS
            .map(id => services.find(s => s.id === id))
            .filter(Boolean);

        grid.innerHTML = featured.map(service => {
            const petLabel = service.petType === 'dog' ? 'Chó'
                : service.petType === 'cat' ? 'Mèo' : 'Tất cả';

            return `
                <div class="home-grooming-card" role="button" tabindex="0"
                     onclick="bookHomeGroomingService('${service.id}')"
                     onkeydown="if(event.key==='Enter')bookHomeGroomingService('${service.id}')">
                    <div class="home-grooming-card-image">
                        <img src="${service.image}" alt="${service.name}" loading="lazy">
                    </div>
                    <div class="home-grooming-card-body">
                        <span class="home-grooming-card-badge">${petLabel}</span>
                        <span class="home-grooming-card-name">${service.name}</span>
                        <span class="home-grooming-card-meta">${formatVnd(service.basePrice)}</span>
                    </div>
                </div>
            `;
        }).join('') || '<div class="home-featured-loading">Không thể tải danh sách dịch vụ.</div>';
    }

    async function loadHomeBlogPosts() {
        const grid = document.getElementById('homeBlogGrid');
        if (!grid) return;

        const categoryIds = ['huong-dan', 'tips-an-uong'];

        try {
            const res = await fetch('assets/dataset/blog.json');
            const data = await res.json();

            grid.innerHTML = categoryIds.map(catId => {
                const cat = data.categories?.[catId];
                const article = cat?.articles?.[0];
                if (!cat || !article) return '';

                return `
                    <div class="home-blog-preview" onclick="openHomeBlogArticle('${article.id}')" role="button" tabindex="0"
                         onkeydown="if(event.key==='Enter')openHomeBlogArticle('${article.id}')">
                        <div class="home-blog-thumb">
                            <img src="${article.image}" alt="${article.title}" loading="lazy">
                        </div>
                        <div class="home-blog-content">
                            <div class="home-blog-category">${cat.label}</div>
                            <div class="home-blog-title">${article.title}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (e) {
            grid.innerHTML = '<div class="home-blog-preview home-blog-preview--loading">Không thể tải bài viết.</div>';
        }
    }
})();
