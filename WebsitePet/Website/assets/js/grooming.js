/* ----------------------------------------------------------------
   1. PAGE NAVIGATION
   ---------------------------------------------------------------- */
function showPage(name) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  var el = document.getElementById(name + '-page');
  if (el) { el.classList.add('active'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  // highlight nav
  document.querySelectorAll('.menu li').forEach(function(li) {
    li.classList.remove('active');
    if (li.querySelector('a') && li.querySelector('a').textContent.toLowerCase().includes('grooming')) {
      li.classList.add('active');
    }
  });
}

function showGroomingBooking() {
  showPage('grooming-booking');
  setTimeout(function() {
    if (typeof window.refreshGroomingBookingSummary === 'function') {
      window.refreshGroomingBookingSummary();
    }
  }, 50);
}
window.showGroomingBooking = showGroomingBooking;

/* ----------------------------------------------------------------
   2. REVIEWS TOGGLE
   ---------------------------------------------------------------- */
function toggleMoreReviews() {
  var extras = document.querySelectorAll('.review-card.extra-review');
  var btn = document.getElementById('reviewsToggleBtn');
  if (!extras.length) return;
  var hidden = extras[0].classList.contains('hidden');
  extras.forEach(function(card) { card.classList.toggle('hidden', !hidden); });
  if (btn) btn.textContent = hidden ? 'Ẩn bớt đánh giá' : 'Xem thêm đánh giá';
}

/* ----------------------------------------------------------------
   3. FAQ ACCORDION
   ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.faq-item').forEach(function(item) {
    var q = item.querySelector('.faq-item__question');
    if (!q) return;
    q.addEventListener('click', function() {
      document.querySelectorAll('.faq-item').forEach(function(o) { if (o !== item) o.classList.remove('expanded'); });
      item.classList.toggle('expanded');
    });
  });
});

/* ================================================================
   4. GROOMING BOOKING MODULE  (grooming-booking.js inlined)
   ================================================================ */
(function () {

var DEFAULT_SERVICES = [
  {"id":"service_1","name":"Grooming Cơ bản","description":"Tắm, cắt tỉa cơ bản, cắt móng, vệ sinh tai","basePrice":200000,"category":"basic","serviceType":"basic","petType":"dog","image":"https://static.wixstatic.com/media/41bb54_a1498b39e5904f7eaddf9eb102cf18c7~mv2.jpeg/v1/fill/w_4096,h_2730,al_c,q_90,enc_auto/41bb54_a1498b39e5904f7eaddf9eb102cf18c7~mv2.jpeg"},
  {"id":"service_2","name":"Grooming Trọn gói","description":"Tắm, cắt tóc, styling, cắt móng, vệ sinh tai","basePrice":350000,"category":"full","serviceType":"full","petType":"dog","image":"https://thumbs.dreamstime.com/b/toy-poodle-dog-getting-groomed-pet-salon-neat-stylish-haircut-showing-its-adorable-face-fluffy-fur-clean-bright-320989222.jpg?w=768"},
  {"id":"service_3","name":"Spa Package","description":"Tắm, massage, chăm sóc da, thuốc gội cao cấp, khử mùi","basePrice":450000,"category":"spa","serviceType":"spa","petType":"dog","image":"https://tse3.mm.bing.net/th/id/OIP.PQyFtbDRolm4ykxdn8CcUgHaEJ?pid=Api&h=220&P=0"},
  {"id":"service_4","name":"Chăm sóc móng","description":"Cắt móng, điều trị móng, mài móng","basePrice":120000,"category":"basic","serviceType":"basic","petType":"all","image":"https://images.pexels.com/photos/4602558/pexels-photo-4602558.jpeg?auto=compress&cs=tinysrgb&w=900"},
  {"id":"service_5","name":"Grooming cho mèo","description":"Tắm và cắt tỉa chuyên biệt cho mèo","basePrice":280000,"category":"basic","serviceType":"basic","petType":"cat","image":"https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=900"},
  {"id":"service_6","name":"Spa cho mèo","description":"Tắm, massage, chăm sóc da cho mèo","basePrice":380000,"category":"spa","serviceType":"spa","petType":"cat","image":"https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=900"},
  {"id":"service_7","name":"Kiểu tóc Teddy","description":"Tạo kiểu Teddy cho thú cưng","basePrice":50000,"category":"addon","serviceType":"addon","petType":"dog","image":"https://images.pexels.com/photos/1568600/pexels-photo-1568600.jpeg?auto=compress&cs=tinysrgb&w=900"},
  {"id":"service_8","name":"Kiểu tóc Lion","description":"Tạo kiểu Lion (đầu sư tử) cho thú cưng","basePrice":60000,"category":"addon","serviceType":"addon","petType":"dog","image":"https://images.pexels.com/photos/356378/pexels-photo-356378.jpeg?auto=compress&cs=tinysrgb&w=900"},
  {"id":"service_9","name":"Kiểu tóc Korean","description":"Tạo kiểu Hàn Quốc cho thú cưng","basePrice":70000,"category":"addon","serviceType":"addon","petType":"dog","image":"https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=900"},
  {"id":"service_10","name":"Kiểu tóc Summer","description":"Tạo kiểu Summer mát mẻ cho thú cưng","basePrice":40000,"category":"addon","serviceType":"addon","petType":"dog","image":"https://images.pexels.com/photos/4602558/pexels-photo-4602558.jpeg?auto=compress&cs=tinysrgb&w=900"},
  {"id":"service_11","name":"Chăm sóc móng chuyên nghiệp","description":"Cắt móng, mài móng, chăm sóc da quanh móng","basePrice":150000,"category":"basic","serviceType":"basic","petType":"all","image":"https://images.pexels.com/photos/4602558/pexels-photo-4602558.jpeg?auto=compress&cs=tinysrgb&w=900"},
  {"id":"service_12","name":"Massage thư giãn","description":"Massage toàn thân giúp thú cưng thư giãn","basePrice":200000,"category":"spa","serviceType":"spa","petType":"all","image":"https://images.pexels.com/photos/1568600/pexels-photo-1568600.jpeg?auto=compress&cs=tinysrgb&w=900"},
  {"id":"service_13","name":"Vệ sinh và chăm sóc tai","description":"Vệ sinh tai sạch sẽ, nhổ lông tai an toàn","basePrice":120000,"category":"basic","serviceType":"basic","petType":"all","image":"https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=900"},
  {"id":"service_14","name":"Chăm sóc mắt","description":"Vệ sinh quanh mắt, loại bỏ lông thừa, chăm sóc đặc biệt","basePrice":100000,"category":"basic","serviceType":"basic","petType":"all","image":"https://images.pexels.com/photos/356378/pexels-photo-356378.jpeg?auto=compress&cs=tinysrgb&w=900"}
];

var DEFAULT_RULES = {
  Dog: {Short: 1, Medium: 1.2, Long: 1.5},
  Cat: {Short: 1, Medium: 1.15, Long: 1.3}
};

var groomingState = { services: [], priceRules: {}, bookings: [], selectedService: null };
var hairStylePriceMap = { Teddy: 50000, Lion: 60000, Korean: 70000, Summer: 40000 };
var gbDogBreeds = ['Poodle', 'Golden Retriever', 'Labrador', 'Corgi', 'Husky', 'Pomeranian', 'Shiba Inu'];
var gbCatBreeds = ['British Shorthair', 'Persian', 'Maine Coon', 'Ragdoll', 'Scottish Fold', 'Siamese'];

// DOM refs (resolved in initGroomingPage)
var serviceGrid, filterServiceType, filterPetType, gbSortSelect, activeTags, serviceCount;
var gbBookingForm, speciesInput, gbServiceSelect, furTypeInput, hairStyleInput, gbWeightInput;
var appointmentDateInput, appointmentTimeInput, customerNameInput, customerPhoneInput;
var gbPetNameInput, gbBreedInput, notesInput;
var summaryService, summaryWeight, summaryFurType, summaryBasePrice, summaryAddCost, summaryTotal, summaryHairStyle;
var rulesGrid, gbConfirmationModal, gbBtnCancel, gbBtnConfirmSubmit, gbSuccessModal, successMessage, gbBtnCloseSuccess;

function initGroomingPage() {
  serviceGrid        = document.getElementById('services-section');
  filterServiceType  = document.getElementById('filterServiceType');
  filterPetType      = document.getElementById('filterPetType');
  gbSortSelect       = document.getElementById('sortSelect');
  activeTags         = document.getElementById('activeTags');
  serviceCount       = document.getElementById('serviceCount');
  gbBookingForm      = document.getElementById('bookingFormElement');
  speciesInput       = document.getElementById('species');
  gbServiceSelect    = document.getElementById('service');
  furTypeInput       = document.getElementById('furType');
  hairStyleInput     = document.getElementById('hairStyle');
  gbWeightInput      = document.getElementById('weight');
  appointmentDateInput = document.getElementById('appointmentDate');
  appointmentTimeInput = document.getElementById('appointmentTime');
  customerNameInput  = document.getElementById('customerName');
  customerPhoneInput = document.getElementById('customerPhone');
  gbPetNameInput     = document.getElementById('petName');
  gbBreedInput       = document.getElementById('breed');
  notesInput         = document.getElementById('notes');
  rulesGrid          = document.getElementById('rulesGrid');
  gbConfirmationModal = document.getElementById('confirmationModal');
  gbBtnCancel        = document.getElementById('btnCancel');
  gbBtnConfirmSubmit = document.getElementById('btnConfirmSubmit');
  gbSuccessModal     = document.getElementById('successModal');
  successMessage     = document.getElementById('successMessage');
  gbBtnCloseSuccess  = document.getElementById('btnCloseSuccess');

  if (!serviceGrid) return;
  loadData();
}

function loadData() {
  groomingState.services = DEFAULT_SERVICES.slice();
  groomingState.priceRules = Object.assign({}, DEFAULT_RULES);
  try {
    var saved = JSON.parse(localStorage.getItem('groomingBookings'));
    groomingState.bookings = Array.isArray(saved) ? saved : [];
  } catch(e) { groomingState.bookings = []; }

  renderPriceRules();
  renderServiceCards();
  renderServiceSelect();
  attachUIEvents();
  updateBreedOptions();
  updateBookingSummary();
}

function gbFormatVND(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
}

function renderServiceCards() {
  if (!serviceGrid) return;
  serviceGrid.innerHTML = '';
  groomingState.services.forEach(function(item) {
    var card = document.createElement('article');
    card.className = 'service-card';
    card.dataset.category = item.serviceType || item.category || 'all';
    card.dataset.petType  = item.petType || 'all';
    card.dataset.serviceId = item.id;
    card.dataset.price    = item.basePrice;
    card.innerHTML =
      '<div class="service-img"><img src="' + item.image + '" alt="' + item.name + '" loading="lazy"></div>' +
      '<div class="service-info">' +
        '<div class="brand-tag">PETOPIA</div>' +
        '<h3>' + item.name + '</h3>' +
        '<p class="service-description">' + item.description + '</p>' +
        '<div class="service-price">' + gbFormatVND(item.basePrice) + '</div>' +
        '<button class="btn-add-cart" type="button">Đặt lịch hẹn</button>' +
      '</div>';
    serviceGrid.appendChild(card);
  });
  updateServiceCount();
}

function updateServiceCount() {
  if (!serviceCount || !serviceGrid) return;
  var visible = Array.from(serviceGrid.children).filter(function(c) { return c.style.display !== 'none'; }).length;
  serviceCount.textContent = visible + ' dịch vụ';
}

function renderPriceRules() {
  if (!rulesGrid) return;
  rulesGrid.innerHTML = '';
  Object.keys(groomingState.priceRules).forEach(function(species) {
    var rules = groomingState.priceRules[species];
    Object.keys(rules).forEach(function(furType) {
      var row = document.createElement('div');
      row.className = 'rule-card';
      row.innerHTML = '<strong>' + species + '</strong><span>' + furType + '</span><span>x' + rules[furType] + '</span>';
      rulesGrid.appendChild(row);
    });
  });
}

function attachUIEvents() {
  if (filterServiceType) filterServiceType.addEventListener('click', onFilterClick);
  if (filterPetType)     filterPetType.addEventListener('click', onFilterClick);
  if (gbSortSelect)      gbSortSelect.addEventListener('change', applyFilters);

  if (serviceGrid) {
    serviceGrid.addEventListener('click', function(e) {
      var btn = e.target.closest('.btn-add-cart');
      if (!btn) return;
      var card = e.target.closest('.service-card');
      if (!card) return;
      selectService(card.dataset.serviceId);
    });
  }
  if (gbServiceSelect) {
    gbServiceSelect.addEventListener('change', function() {
      gbServiceSelect.value ? selectService(gbServiceSelect.value, false) : (groomingState.selectedService = null, updateBookingSummary());
    });
  }
  [speciesInput, furTypeInput, gbWeightInput].forEach(function(inp) {
    if (!inp) return;
    inp.addEventListener('change', function() { if (inp === speciesInput) updateBreedOptions(); updateBookingSummary(); });
    inp.addEventListener('input', updateBookingSummary);
  });
  if (hairStyleInput) hairStyleInput.addEventListener('change', updateBookingSummary);
  [gbPetNameInput, gbBreedInput, customerNameInput, customerPhoneInput, notesInput].forEach(function(inp) {
    if (inp) inp.addEventListener('input', updateBookingSummary);
  });
  if (appointmentDateInput) appointmentDateInput.addEventListener('change', function() { validateTimeSlots(); updateBookingSummary(); });
  if (appointmentTimeInput) appointmentTimeInput.addEventListener('change', function() { validateTimeSlots(); updateBookingSummary(); });
  if (gbBookingForm)        gbBookingForm.addEventListener('submit', openConfirmationModal);
  if (gbBtnCancel)          gbBtnCancel.addEventListener('click', closeConfirmationModal);
  if (gbBtnConfirmSubmit)   gbBtnConfirmSubmit.addEventListener('click', confirmBooking);
  if (gbBtnCloseSuccess)    gbBtnCloseSuccess.addEventListener('click', closeSuccessModal);
}

function onFilterClick(e) {
  var item = e.target.closest('.sidebar-filter-item');
  if (!item) return;
  item.parentElement.querySelectorAll('.sidebar-filter-item').forEach(function(n) { n.classList.toggle('active', n === item); });
  applyFilters();
}

function applyFilters() {
  var selSvc = filterServiceType && filterServiceType.querySelector('.sidebar-filter-item.active') ? filterServiceType.querySelector('.sidebar-filter-item.active').dataset.filter : 'all';
  var selPet = filterPetType && filterPetType.querySelector('.sidebar-filter-item.active') ? filterPetType.querySelector('.sidebar-filter-item.active').dataset.filter : 'all';
  var sortVal = gbSortSelect ? gbSortSelect.value : 'default';
  Array.from(serviceGrid.children).forEach(function(card) {
    var match = (selSvc === 'all' || card.dataset.category === selSvc) &&
                (selPet === 'all' || card.dataset.petType === selPet || card.dataset.petType === 'all');
    card.style.display = match ? '' : 'none';
  });
  sortServiceCards(sortVal);
  updateServiceCount();
  renderActiveTags(selSvc, selPet);
}

function sortServiceCards(val) {
  var cards = Array.from(serviceGrid.children).filter(function(c) { return c.style.display !== 'none'; });
  cards.sort(function(a, b) {
    var aP = Number(a.dataset.price || 0), bP = Number(b.dataset.price || 0);
    if (val === 'price-asc') return aP - bP;
    if (val === 'price-desc') return bP - aP;
    return 0;
  });
  cards.forEach(function(c) { serviceGrid.appendChild(c); });
}

function renderActiveTags(sf, pf) {
  if (!activeTags) return;
  activeTags.innerHTML = '';
  var labelMap = { basic: 'Cắt tỉa', spa: 'Tắm & Spa', full: 'Trọn gói', all: 'Tất cả', dog: 'Chó', cat: 'Mèo' };
  var tags = [];
  if (sf && sf !== 'all') tags.push({ label: labelMap[sf] || sf, key: 'service' });
  if (pf && pf !== 'all') tags.push({ label: labelMap[pf] || pf, key: 'pet' });
  tags.forEach(function(tag) {
    var el = document.createElement('span');
    el.className = 'filter-tag';
    el.textContent = tag.label + ' ×';
    el.addEventListener('click', function() { resetFilter(tag.key); });
    activeTags.appendChild(el);
  });
}

function resetFilter(key) {
  var list = key === 'service' ? filterServiceType : filterPetType;
  if (!list) return;
  list.querySelectorAll('.sidebar-filter-item').forEach(function(n) { n.classList.toggle('active', n.dataset.filter === 'all'); });
  applyFilters();
}

function updateBreedOptions() {
  if (!gbBreedInput || !speciesInput) return;
  var breeds = speciesInput.value === 'Dog' ? gbDogBreeds : speciesInput.value === 'Cat' ? gbCatBreeds : [];
  gbBreedInput.innerHTML = '<option value="">Chọn giống</option>' +
    breeds.map(function(n) { return '<option value="' + n + '">' + n + '</option>'; }).join('');
  gbBreedInput.disabled = !breeds.length;
  if (!breeds.length) gbBreedInput.value = '';
}

function renderServiceSelect() {
  if (!gbServiceSelect) return;
  gbServiceSelect.innerHTML = '<option value="">Chọn dịch vụ</option>' +
    groomingState.services.map(function(s) {
      return '<option value="' + s.id + '">' + s.name + ' – ' + gbFormatVND(s.basePrice) + '</option>';
    }).join('');
}

function selectService(serviceId, autoNav) {
  groomingState.selectedService = groomingState.services.find(function(s) { return s.id === serviceId; }) || null;
  if (gbServiceSelect) gbServiceSelect.value = groomingState.selectedService ? groomingState.selectedService.id : '';
  if (serviceGrid) {
    serviceGrid.querySelectorAll('.service-card').forEach(function(c) {
      c.classList.toggle('service-card--selected', c.dataset.serviceId === serviceId);
    });
  }
  updateBookingSummary();
  if (autoNav !== false) showGroomingBooking();
}

function getWeightMultiplier(w) {
  if (w <= 5) return 1.0;
  if (w <= 10) return 1.2;
  if (w <= 20) return 1.5;
  return 2.0;
}

function getFurMultiplier() {
  var sp = speciesInput ? speciesInput.value : '';
  var ft = furTypeInput ? furTypeInput.value : '';
  return (groomingState.priceRules[sp] && groomingState.priceRules[sp][ft]) ? groomingState.priceRules[sp][ft] : 1;
}

function calculateEstimatedPrice() {
  if (!groomingState.selectedService) return 0;
  var w = Number(gbWeightInput ? gbWeightInput.value : 0);
  var base = groomingState.selectedService.basePrice;
  var furM = getFurMultiplier();
  var wM   = getWeightMultiplier(w);
  var hc   = hairStyleInput && hairStyleInput.value ? (hairStylePriceMap[hairStyleInput.value] || 0) : 0;
  return Math.round(base * furM * wM) + hc;
}

function updateBookingSummary() {
  summaryService  = document.getElementById('summaryService');
  summaryWeight   = document.getElementById('summaryWeight');
  summaryFurType  = document.getElementById('summaryFurType');
  summaryBasePrice = document.getElementById('summaryBasePrice');
  summaryAddCost  = document.getElementById('summaryAddCost');
  summaryTotal    = document.getElementById('summaryTotal');
  summaryHairStyle = document.getElementById('summaryHairStyle');

  if (!summaryService) return;
  var est = calculateEstimatedPrice();
  var base = groomingState.selectedService ? groomingState.selectedService.basePrice : 0;
  var furM = groomingState.selectedService ? getFurMultiplier() : 1;
  var wM   = (gbWeightInput && Number(gbWeightInput.value) > 0) ? getWeightMultiplier(Number(gbWeightInput.value)) : 1;
  var sc   = hairStyleInput && hairStyleInput.value ? (hairStylePriceMap[hairStyleInput.value] || 0) : 0;
  var add  = groomingState.selectedService ? (Math.round((furM * wM - 1) * base) + sc) : 0;

  summaryService.textContent  = groomingState.selectedService ? groomingState.selectedService.name : '–';
  if (summaryHairStyle) summaryHairStyle.textContent = hairStyleInput && hairStyleInput.value ? hairStyleInput.value + (sc ? ' +' + gbFormatVND(sc) : '') : '–';
  if (summaryWeight)   summaryWeight.textContent   = gbWeightInput && gbWeightInput.value ? gbWeightInput.value + ' kg' : '–';
  if (summaryFurType)  summaryFurType.textContent  = furTypeInput ? (furTypeInput.value || '–') : '–';
  if (summaryBasePrice) summaryBasePrice.textContent = groomingState.selectedService ? gbFormatVND(base) : '–';
  if (summaryAddCost)  summaryAddCost.textContent  = groomingState.selectedService ? gbFormatVND(add) : '–';
  if (summaryTotal)    summaryTotal.textContent    = groomingState.selectedService ? gbFormatVND(est) : '0 VND';
}

function validateForm() {
  if (!groomingState.selectedService) { alert('Vui lòng chọn một dịch vụ grooming.'); return false; }
  if (!(gbPetNameInput && gbPetNameInput.value.trim()) || !(speciesInput && speciesInput.value) || !(gbBreedInput && gbBreedInput.value) || !(furTypeInput && furTypeInput.value) || !(gbWeightInput && gbWeightInput.value)) {
    alert('Vui lòng điền đầy đủ thông tin thú cưng.'); return false;
  }
  if (Number(gbWeightInput.value) <= 0) { alert('Cân nặng phải lớn hơn 0.'); return false; }
  if (!(appointmentDateInput && appointmentDateInput.value) || !(appointmentTimeInput && appointmentTimeInput.value)) {
    alert('Vui lòng chọn ngày và giờ hẹn.'); return false;
  }
  if (!(customerNameInput && customerNameInput.value.trim()) || !(customerPhoneInput && customerPhoneInput.value.trim())) {
    alert('Vui lòng điền tên và số điện thoại.'); return false;
  }
  return true;
}

function validateTimeSlots() {
  if (!appointmentDateInput || !appointmentTimeInput) return;
  var date = appointmentDateInput.value;
  var bookedSlots = groomingState.bookings
    .filter(function(b) { return b.appointmentDate === date && b.status !== 'Đã hủy'; })
    .map(function(b) { return b.appointmentTime; });
  var avail = 0;
  Array.from(appointmentTimeInput.options).forEach(function(opt) {
    if (!opt.value) return;
    opt.disabled = bookedSlots.indexOf(opt.value) !== -1;
    if (!opt.disabled) avail++;
  });
  var warn = document.getElementById('timeWarning');
  if (warn) warn.textContent = (avail === 0 && date) ? 'Không còn giờ trống. Vui lòng chọn ngày khác.' : '';
  if (appointmentTimeInput.value && appointmentTimeInput.selectedOptions[0] && appointmentTimeInput.selectedOptions[0].disabled) {
    appointmentTimeInput.value = '';
  }
}

function openConfirmationModal(e) {
  e.preventDefault();
  if (!validateForm() || !gbConfirmationModal) return;
  var text = 'Dịch vụ: ' + groomingState.selectedService.name + '\n' +
             'Thú cưng: ' + gbPetNameInput.value.trim() + '\n' +
             'Ngày: ' + appointmentDateInput.value + '\n' +
             'Giờ: ' + appointmentTimeInput.value + '\n' +
             'Giá ước tính: ' + gbFormatVND(calculateEstimatedPrice());
  var ct = document.getElementById('confirmText');
  if (ct) ct.textContent = text;
  gbConfirmationModal.classList.add('show');
}
function closeConfirmationModal() { if (gbConfirmationModal) gbConfirmationModal.classList.remove('show'); }
function closeSuccessModal()      { if (gbSuccessModal) gbSuccessModal.classList.remove('show'); }

function generateBookingId() { return 'GRM-' + String(groomingState.bookings.length + 1).padStart(5, '0'); }

function confirmBooking() {
  if (!gbConfirmationModal) return;
  gbConfirmationModal.classList.remove('show');
  var booking = {
    bookingId: generateBookingId(),
    serviceId: groomingState.selectedService.id,
    serviceName: groomingState.selectedService.name,
    pet: {
      name: gbPetNameInput.value.trim(), species: speciesInput.value,
      breed: gbBreedInput.value, weight: gbWeightInput.value,
      furType: furTypeInput.value, hairStyle: hairStyleInput ? (hairStyleInput.value || '') : ''
    },
    customer: {
      name: customerNameInput.value.trim(), phone: customerPhoneInput.value.trim(),
      notes: notesInput ? notesInput.value.trim() : ''
    },
    appointmentDate: appointmentDateInput.value, appointmentTime: appointmentTimeInput.value,
    estimatedPrice: calculateEstimatedPrice(), status: 'Booked', createdAt: new Date().toISOString()
  };
  groomingState.bookings.push(booking);
  try { localStorage.setItem('groomingBookings', JSON.stringify(groomingState.bookings)); } catch(e) {}
  try {
    var PET_STORAGE_KEY = 'petopia_pets';
    var raw = localStorage.getItem(PET_STORAGE_KEY);
    var pets = raw ? JSON.parse(raw) : [];
    var petName = (booking.pet && booking.pet.name) ? booking.pet.name.trim() : '';
    var petSpecies = (booking.pet && booking.pet.species) ? booking.pet.species : '';
    var petBreed = (booking.pet && booking.pet.breed) ? booking.pet.breed.trim() : '';
    var matched = pets.find(function(p) {
      return p.name && p.name.trim().toLowerCase() === petName.toLowerCase()
        && ((p.type || '').toLowerCase() === (petSpecies || '').toLowerCase())
        && ((p.breed || '').toLowerCase() === (petBreed || '').toLowerCase());
    });
    if (!matched) {
      matched = {
        id: 'pet_' + Date.now() + '_' + Math.random().toString(36).slice(2,8),
        name: petName || 'Không tên',
        type: (petSpecies || '').toLowerCase() === 'cat' ? 'cat' : 'dog',
        breed: petBreed || '',
        weight: booking.pet && booking.pet.weight ? Number(booking.pet.weight) : 0,
        createdAt: new Date().toISOString(),
        notes: '',
        bookings: []
      };
      pets.push(matched);
    }
    matched.bookings = matched.bookings || [];
    matched.bookings.push({
      id: booking.bookingId || ('srv_' + Date.now()),
      type: 'grooming',
      serviceId: booking.serviceId,
      serviceName: booking.serviceName,
      date: booking.appointmentDate,
      time: booking.appointmentTime,
      price: booking.estimatedPrice,
      status: booking.status || 'Booked',
      createdAt: booking.createdAt || new Date().toISOString()
    });
    localStorage.setItem(PET_STORAGE_KEY, JSON.stringify(pets));
    try { window.dispatchEvent(new Event('petProfilesUpdated')); localStorage.setItem('pet_profiles_last_update', Date.now().toString()); } catch(e){}
  } catch(e) {}
  showSuccess(booking);
}

function showSuccess(booking) {
  if (!gbSuccessModal || !successMessage) return;
  successMessage.innerHTML = 'Mã đơn: <strong>' + booking.bookingId + '</strong><br>' +
    'Dịch vụ: ' + booking.serviceName + '<br>' +
    'Ngày: ' + booking.appointmentDate + '<br>' +
    'Giờ: ' + booking.appointmentTime + '<br>' +
    'Giá ước tính: ' + gbFormatVND(booking.estimatedPrice);
  gbSuccessModal.classList.add('show');
  if (gbBookingForm) gbBookingForm.reset();
  groomingState.selectedService = null;
  updateBookingSummary();
}

// expose for showGroomingBooking
window.refreshGroomingBookingSummary = updateBookingSummary;

// init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { setTimeout(initGroomingPage, 100); });
} else {
  setTimeout(initGroomingPage, 100);
}

})();

/* ================================================================
   5. CHATBOX AI (grooming.js inlined)
   ================================================================ */
var PETOPIA_KB = [
  { keys: ['giá', 'bao nhiêu', 'chi phí', 'phí', 'tiền'],
    reply: 'Bảng giá dịch vụ Petopia:\n• Grooming Cơ bản: từ 200.000đ\n• Grooming Trọn gói: từ 350.000đ\n• Spa Package: từ 450.000đ\n• Chăm sóc móng: từ 120.000đ\n\nPhụ thu kiểu tóc: Teddy +50k | Lion +60k | Korean +70k | Summer +40k 🐾' },
  { keys: ['dịch vụ', 'gói', 'có gì', 'cung cấp', 'loại'],
    reply: 'Petopia có 4 dịch vụ chính:\n✂️ Grooming Cơ bản — tắm, styling, cắt móng, trị tai\n✂️ Grooming Trọn gói — cơ bản + cắt tóc\n🌿 Spa Package — tắm, massage, chăm sóc da, khử mùi\n💅 Chăm sóc móng — cắt, điều trị, mài móng' },
  { keys: ['kiểu tóc', 'kiểu', 'teddy', 'lion', 'korean', 'summer'],
    reply: 'Các kiểu tóc tại Petopia:\n💇 Teddy Cut — +50.000đ\n🦁 Lion Cut — +60.000đ\n🌸 Korean Style — +70.000đ\n☀️ Summer Cut — +40.000đ\n\nChọn kiểu trong form đặt lịch phía trên nhé!' },
  { keys: ['bao lâu', 'mấy tiếng', 'thời gian', 'lâu không'],
    reply: 'Thời gian grooming:\n⏱ Cơ bản: ~1–1.5 tiếng\n⏱ Trọn gói: ~1.5–2 tiếng\n⏱ Spa Package: ~2–2.5 tiếng\n⏱ Chăm sóc móng: ~20–30 phút' },
  { keys: ['giờ', 'mấy giờ', 'khi nào', 'làm việc', 'thứ mấy'],
    reply: 'Giờ làm việc Petopia:\n📅 Thứ 2–7: 8:00–19:00\n📅 Chủ nhật: 9:00–17:00\n\nNên đặt lịch trước để tránh chờ nhé! 🐾' },
  { keys: ['chuẩn bị', 'mang gì', 'cần gì', 'trước khi'],
    reply: 'Cần chuẩn bị trước khi đến Petopia:\n📋 Mang theo giấy tờ tiêm chủng\n💬 Thông báo nếu thú cưng có dị ứng/bệnh lý\n🎀 Nhắn trước kiểu tóc mong muốn' },
  { keys: ['đặt lịch', 'book', 'hẹn', 'đăng ký'],
    reply: 'Bạn điền vào form "Đặt lịch chăm sóc thú cưng" ngay phía trên trang này nhé!\n\nSau khi gửi, đội ngũ xác nhận qua Zalo/SĐT trong vòng 30 phút!' },
  { keys: ['địa chỉ', 'ở đâu', 'đường', 'quận', 'chỗ nào'],
    reply: '📍 212 Đường Hoàng Diệu, Quận 4, TP.HCM\n🕐 T2–T7: 8:00–19:00 | CN: 9:00–17:00\n📞 0909 123 456' },
  { keys: ['hủy lịch', 'dời lịch', 'đổi lịch', 'hoàn tiền'],
    reply: '✅ Miễn phí hủy trước 24 giờ\n⚠️ Hủy trong 24h: mất 20% phí đặt cọc\n\nĐể hủy/dời lịch: 📞 0909 123 456 (Zalo/Gọi)' },
  { keys: ['tần suất', 'thường xuyên', 'bao lâu một lần', 'mấy tuần'],
    reply: 'Tần suất grooming khuyến nghị:\n🐩 Lông dài (Poodle…): 4–6 tuần/lần\n🐕 Lông trung bình: 6–8 tuần/lần\n🐈 Mèo lông ngắn: 8–12 tuần/lần\n🐈 Mèo lông dài: 4–6 tuần/lần' }
];
var FALLBACK_REPLY = 'Dạ, Petopia đã nhận được tin nhắn! 📩\nVấn đề này cần tư vấn trực tiếp.\nĐội ngũ sẽ liên hệ qua:\n📞 0909 123 456 (Zalo/Gọi)\n🌐 petopia.vn ❤️';

function normalizeText(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function getBotReply(text) {
  var t = normalizeText(text);
  for (var i = 0; i < PETOPIA_KB.length; i++) {
    for (var j = 0; j < PETOPIA_KB[i].keys.length; j++) {
      if (t.includes(normalizeText(PETOPIA_KB[i].keys[j]))) return PETOPIA_KB[i].reply;
    }
  }
  return FALLBACK_REPLY;
}

var chatFab      = document.getElementById('chatFab');
var chatWindow   = document.getElementById('chatWindow');
var chatClose    = document.getElementById('chatClose');
var chatInput    = document.getElementById('chatInput');
var chatSend     = document.getElementById('chatSend');
var chatMessages = document.getElementById('chatMessages');
var quickBtns    = document.getElementById('quickBtns');
var chatOpened   = false;

function openChat() {
  if (!chatWindow) return;
  chatWindow.classList.add('show');
  if (chatFab) chatFab.classList.add('open');
  if (chatInput) setTimeout(function() { chatInput.focus(); }, 300);
  if (!chatOpened) {
    chatOpened = true;
    setTimeout(function() { appendBotMsg('Xin chào! 👋 Mình là trợ lý Petopia, sẵn sàng giải đáp về dịch vụ, giá cả và đặt lịch cho bạn nhé!'); }, 350);
  }
}
function closeChat() {
  if (!chatWindow) return;
  chatWindow.classList.remove('show');
  if (chatFab) chatFab.classList.remove('open');
}

if (chatFab)   chatFab.addEventListener('click', function() { chatWindow && chatWindow.classList.contains('show') ? closeChat() : openChat(); });
if (chatClose) chatClose.addEventListener('click', closeChat);
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeChat(); });

function appendBotMsg(text) {
  if (!chatMessages) return;
  var div = document.createElement('div');
  div.className = 'chat-msg bot';
  div.style.whiteSpace = 'pre-line';
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleSendMessage() {
  if (!chatInput || !chatMessages) return;
  var text = chatInput.value.trim();
  if (!text) return;
  var userDiv = document.createElement('div');
  userDiv.className = 'chat-msg user';
  userDiv.textContent = text;
  chatMessages.appendChild(userDiv);
  chatInput.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;
  if (quickBtns) quickBtns.style.display = 'none';
  var typingDiv = document.createElement('div');
  typingDiv.className = 'chat-msg bot typing-indicator';
  typingDiv.id = 'typingDot';
  typingDiv.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  setTimeout(function() {
    var dot = document.getElementById('typingDot');
    if (dot) dot.remove();
    appendBotMsg(getBotReply(text));
  }, 600 + Math.random() * 500);
}

if (chatSend)  chatSend.addEventListener('click', handleSendMessage);
if (chatInput) chatInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleSendMessage(); });
document.querySelectorAll('.quick-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    if (!chatInput) return;
    chatInput.value = btn.getAttribute('data-q');
    handleSendMessage();
  });
});