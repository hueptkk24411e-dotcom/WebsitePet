// router.js - dieu huong giua cac trang da duoc tach ra tu SPA goc
(function () {
  var PAGE_FILES = {
    home: 'index.html',
    shop: 'shop.html',
    'room-detail': 'room-detail.html',
    viewroom: 'viewroom.html',
    grooming: 'grooming.html',
    'grooming-booking': 'grooming-booking.html',
    hotel: 'hotel.html',
    policy: 'policy.html',
    blog: 'blog.html',
    contact: 'contact.html',
    about: 'about.html',
    booking: 'booking.html',
    'lich-su-dat-lich': 'lich-su-dat-lich.html'
  };

  var CURRENT_PAGE = document.body.getAttribute('data-page');

  window.showPage = function (page) {
    var file = PAGE_FILES[page];
    if (!file) {
      console.warn('showPage: khong tim thay trang "' + page + '"');
      return;
    }
    if (page === CURRENT_PAGE) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.location.href = file;
  };
})();
