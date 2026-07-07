/* Grooming booking module: load services and rules from JSON, render UI, validate, confirm, and store booking data. */
/* Wrapped in IIFE to avoid variable name conflicts with grooming.js */

(function () {

var DEFAULT_SERVICES = [
  {"id":"service_1","name":"Grooming Cơ bản","description":"Tắm, cắt tỉa cơ bản, cắt móng, vệ sinh tai","basePrice":200000,"category":"basic","serviceType":"basic","petType":"dog","image":"https://static.wixstatic.com/media/41bb54_a1498b39e5904f7eaddf9eb102cf18c7~mv2.jpeg/v1/fill/w_4096,h_2730,al_c,q_90,enc_auto/41bb54_a1498b39e5904f7eaddf9eb102cf18c7~mv2.jpeg"},
  {"id":"service_2","name":"Grooming Trọn gói","description":"Tắm, cắt tóc, styling, cắt móng, vệ sinh tai","basePrice":350000,"category":"full","serviceType":"full","petType":"dog","image":"https://thumbs.dreamstime.com/b/toy-poodle-dog-getting-groomed-pet-salon-neat-stylish-haircut-showing-its-adorable-face-fluffy-fur-clean-bright-320989222.jpg?w=768"},
  {"id":"service_3","name":"Spa Package","description":"Tắm, massage, chăm sóc da, thuốc gội cao cấp, khử mùi","basePrice":450000,"category":"spa","serviceType":"spa","petType":"dog","image":"https://tse3.mm.bing.net/th/id/OIP.PQyFtbDRolm4ykxdn8CcUgHaEJ?pid=Api&h=220&P=0"},
  {"id":"service_4","name":"Chăm sóc móng","description":"Cắt móng, điều trị móng, mài móng","basePrice":120000,"category":"basic","serviceType":"basic","petType":"all","image":"https://tse2.mm.bing.net/th/id/OIP.PQyFtbDRolm4ykxdn8CcUgHaEJ?pid=Api&h=220&P=0&w=300"},
  {"id":"service_5","name":"Grooming cho mèo","description":"Tắm và cắt tỉa chuyên biệt cho mèo","basePrice":280000,"category":"basic","serviceType":"basic","petType":"cat","image":"https://tse1.mm.bing.net/th/id/OIP.YxvQZ7zH8lF8zQ5FzB4zzgHaEK?pid=Api&h=220"},
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

var PENDING_GROOMING_SERVICE_KEY = 'pendingGroomingService';

var groomingState = {
  services: [],
  priceRules: {},
  bookings: [],
  selectedService: null,
};

var serviceGrid = document.getElementById('services-section');
var filterServiceType = document.getElementById('filterServiceType');
var filterPetType = document.getElementById('filterPetType');
var gbSortSelect = document.getElementById('sortSelect');
var activeTags = document.getElementById('activeTags');
var serviceCount = document.getElementById('serviceCount');

var gbBookingForm = document.getElementById('bookingFormElement');
var speciesInput = document.getElementById('species');
var gbServiceSelect = document.getElementById('service');
var furTypeInput = document.getElementById('furType');
var hairStyleInput = document.getElementById('hairStyle');
var gbWeightInput = document.getElementById('weight');
var appointmentDateInput = document.getElementById('appointmentDate');
var appointmentTimeInput = document.getElementById('appointmentTime');
var customerNameInput = document.getElementById('customerName');
var customerPhoneInput = document.getElementById('customerPhone');
var gbPetNameInput = document.getElementById('petName');
var gbBreedInput = document.getElementById('breed');
var notesInput = document.getElementById('notes');
var bookingServicesList = document.getElementById('booking-services-list');

var gbDogBreeds = ['Poodle', 'Golden Retriever', 'Labrador', 'Corgi', 'Husky', 'Pomeranian', 'Shiba Inu'];
var gbCatBreeds = ['British Shorthair', 'Persian', 'Maine Coon', 'Ragdoll', 'Scottish Fold', 'Siamese'];

var summaryService = document.getElementById('summaryService');
var summaryWeight = document.getElementById('summaryWeight');
var summaryFurType = document.getElementById('summaryFurType');
var summaryBasePrice = document.getElementById('summaryBasePrice');
var summaryAddCost = document.getElementById('summaryAddCost');
var summaryTotal = document.getElementById('summaryTotal');
var summaryHairStyle = document.getElementById('summaryHairStyle');

var rulesGrid = document.getElementById('rulesGrid');

var gbConfirmationModal = document.getElementById('confirmationModal');
var gbBtnCancel = document.getElementById('btnCancel');
var gbBtnConfirmSubmit = document.getElementById('btnConfirmSubmit');
var gbSuccessModal = document.getElementById('successModal');
var successMessage = document.getElementById('successMessage');
var gbBtnCloseSuccess = document.getElementById('btnCloseSuccess');

var timeSlotWarning = null;

function initGroomingPage() {
  try {
  serviceGrid = document.getElementById('services-section');
  filterServiceType = document.getElementById('filterServiceType');
  filterPetType = document.getElementById('filterPetType');
  gbSortSelect = document.getElementById('sortSelect');
  activeTags = document.getElementById('activeTags');
  serviceCount = document.getElementById('serviceCount');
  gbBookingForm = document.getElementById('bookingFormElement');
  speciesInput = document.getElementById('species');
  gbServiceSelect = document.getElementById('service');
  furTypeInput = document.getElementById('furType');
  hairStyleInput = document.getElementById('hairStyle');
  gbWeightInput = document.getElementById('weight');
  appointmentDateInput = document.getElementById('appointmentDate');
  appointmentTimeInput = document.getElementById('appointmentTime');
  customerNameInput = document.getElementById('customerName');
  customerPhoneInput = document.getElementById('customerPhone');
  gbPetNameInput = document.getElementById('petName');
  gbBreedInput = document.getElementById('breed');
  notesInput = document.getElementById('notes');
  bookingServicesList = document.getElementById('booking-services-list');
  rulesGrid = document.getElementById('rulesGrid');
  gbConfirmationModal = document.getElementById('confirmationModal');
  gbBtnCancel = document.getElementById('btnCancel');
  gbBtnConfirmSubmit = document.getElementById('btnConfirmSubmit');
  gbSuccessModal = document.getElementById('successModal');
  successMessage = document.getElementById('successMessage');
  gbBtnCloseSuccess = document.getElementById('btnCloseSuccess');
  if (!serviceGrid && !bookingServicesList) {
    console.warn('[Grooming] No service container found, skipping render.');
    return;
  }
  loadJsonData().then(function () {
    console.log('[Grooming] Data loaded. Services:', groomingState.services.length, 'Rules:', Object.keys(groomingState.priceRules).length);
    renderPriceRules();
    if (serviceGrid) {
      renderServiceCards();
      console.log('[Grooming] Service cards rendered. Grid children:', serviceGrid ? serviceGrid.children.length : 0);
    }
    renderBookingServiceCards();
    renderServiceSelect();
    attachUIEvents();
    updateBreedOptions();
    applyPendingGroomingService();
    updateBookingSummary();
  }).catch(function (error) {
    console.error('[Grooming] Cannot initialize grooming page:', error);
  });
  } catch (err) {
    console.error('Error in initGroomingPage:', err);
  }
}

var hairStylePriceMap = {
  'Teddy': 50000,
  'Lion': 60000,
  'Korean': 70000,
  'Summer': 40000
};

async function loadJsonData() {
  groomingState.services = DEFAULT_SERVICES.slice();
  groomingState.priceRules = Object.assign({}, DEFAULT_RULES);
  try {
    var response = await fetch('assets/dataset/grooming-services.json');
    if (response.ok) {
      var data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        groomingState.services = data;
      }
    }
  } catch (err) {
    console.warn('[Grooming] Cannot load grooming-services.json, using DEFAULT_SERVICES:', err);
  }
  var savedBookings = null;
  try {
    savedBookings = JSON.parse(localStorage.getItem('groomingBookings'));
  } catch (err) {
    savedBookings = null;
  }
  groomingState.bookings = Array.isArray(savedBookings) ? savedBookings : [];
}

function gbFormatVND(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

function renderServiceCards() {
  if (!serviceGrid) return;
  serviceGrid.innerHTML = '';
  groomingState.services.forEach(function (item) {
    var card = document.createElement('article');
    card.className = 'service-card';
    card.dataset.category = item.serviceType || item.category || 'all';
    card.dataset.petType = item.petType || 'all';
    card.dataset.serviceId = item.id;
    card.dataset.price = item.basePrice;

    card.innerHTML = "<div class=\"service-img\"><img src=\"" + item.image + "\" alt=\"" + item.name + "\"></div>" +
      "<div class=\"service-info\">" +
      "<div class=\"brand-tag\">PETOPIA</div>" +
      "<h3>" + item.name + "</h3>" +
      "<p class=\"service-description\">" + item.description + "</p>" +
      "<div class=\"service-price\">" + gbFormatVND(item.basePrice) + "</div>" +
      "<button class=\"btn-add-cart\" type=\"button\">Đặt lịch hẹn</button>" +
      "</div>";

    serviceGrid.appendChild(card);
  });
  updateServiceCount();
}

function renderBookingServiceCards() {
  if (!bookingServicesList) return;
  bookingServicesList.innerHTML = '';
  groomingState.services.forEach(function (item) {
    var card = document.createElement('div');
    card.className = 'booking-service-card';
    if (groomingState.selectedService && groomingState.selectedService.id === item.id) {
      card.classList.add('selected');
    }
    card.dataset.serviceId = item.id;
    card.innerHTML = "<img src=\"" + item.image + "\" alt=\"" + item.name + "\">" +
      "<div class=\"booking-service-card__info\">" +
      "<strong>" + item.name + "</strong>" +
      "<span>" + gbFormatVND(item.basePrice) + "</span>" +
      "</div>";

    card.addEventListener('click', function () {
      selectService(item.id);
      var cards = bookingServicesList.querySelectorAll('.booking-service-card');
      cards.forEach(function (c) {
        c.classList.toggle('selected', c.dataset.serviceId === item.id);
      });
    });

    bookingServicesList.appendChild(card);
  });
}

function updateServiceCount() {
  if (!serviceCount || !serviceGrid) return;
  var visible = Array.from(serviceGrid.children).filter(function (card) {
    return card.style.display !== 'none';
  }).length;
  serviceCount.textContent = visible + ' dịch vụ';
}

function renderPriceRules() {
  if (!rulesGrid || !groomingState.priceRules) return;
  rulesGrid.innerHTML = '';
  Object.keys(groomingState.priceRules).forEach(function (species) {
    var speciesRules = groomingState.priceRules[species];
    Object.keys(speciesRules).forEach(function (furType) {
      var multiplier = speciesRules[furType];
      var row = document.createElement('div');
      row.className = 'rule-card';
      row.innerHTML = '<strong>' + species + '</strong><span>' + furType + '</span><span>x' + multiplier + '</span>';
      rulesGrid.appendChild(row);
    });
  });
}

function attachUIEvents() {
  if (filterServiceType) {
    filterServiceType.addEventListener('click', onFilterClick);
  }
  if (filterPetType) {
    filterPetType.addEventListener('click', onFilterClick);
  }
  if (gbSortSelect) {
    gbSortSelect.addEventListener('change', applyFilters);
  }
  if (serviceGrid) {
    serviceGrid.addEventListener('click', function (event) {
      var button = event.target.closest('.btn-add-cart');
      if (!button) return;
      var card = event.target.closest('.service-card');
      if (!card) return;
      selectService(card.dataset.serviceId);
      if (typeof showGroomingBooking === 'function') {
        showGroomingBooking();
      }
    });
  }
  if (gbServiceSelect) {
    gbServiceSelect.addEventListener('change', function () {
      if (gbServiceSelect.value) {
        selectService(gbServiceSelect.value, false); // false = không navigate
      } else {
        groomingState.selectedService = null;
        updateBookingSummary();
      }
    });
  }
  [speciesInput, furTypeInput, gbWeightInput].forEach(function (input) {
    if (!input) return;
    input.addEventListener('change', function () {
      if (input === speciesInput) updateBreedOptions();
      updateBookingSummary();
    });
    input.addEventListener('input', updateBookingSummary);
  });

  if (hairStyleInput) {
    hairStyleInput.addEventListener('change', updateBookingSummary);
  }
  [gbPetNameInput, gbBreedInput, customerNameInput, customerPhoneInput, notesInput].forEach(function (input) {
    if (!input) return;
    input.addEventListener('input', updateBookingSummary);
  });
  if (appointmentDateInput) {
    appointmentDateInput.addEventListener('change', function () {
      validateTimeSlots();
      updateBookingSummary();
    });
  }
  if (appointmentTimeInput) {
    appointmentTimeInput.addEventListener('change', function () {
      validateTimeSlots();
      updateBookingSummary();
    });
  }
  if (gbBookingForm) gbBookingForm.addEventListener('submit', openConfirmationModal);
  if (gbBtnCancel) gbBtnCancel.addEventListener('click', closeConfirmationModal);
  if (gbBtnConfirmSubmit) gbBtnConfirmSubmit.addEventListener('click', confirmBooking);
  if (gbBtnCloseSuccess) gbBtnCloseSuccess.addEventListener('click', closeSuccessModal);
}

function onFilterClick(event) {
  var item = event.target.closest('.sidebar-filter-item');
  if (!item) return;
  item.parentElement.querySelectorAll('.sidebar-filter-item').forEach(function (node) {
    node.classList.toggle('active', node === item);
  });
  applyFilters();
}

function applyFilters() {
  var selectedService = filterServiceType && filterServiceType.querySelector('.sidebar-filter-item.active') ? filterServiceType.querySelector('.sidebar-filter-item.active').dataset.filter : 'all';
  var selectedPetType = filterPetType && filterPetType.querySelector('.sidebar-filter-item.active') ? filterPetType.querySelector('.sidebar-filter-item.active').dataset.filter : 'all';
  var sortValue = gbSortSelect ? gbSortSelect.value : 'default';

  Array.from(serviceGrid.children).forEach(function (card) {
    var category = card.dataset.category || 'all';
    var petType = card.dataset.petType || 'all';
    var isMatching = (selectedService === 'all' || category === selectedService) &&
                     (selectedPetType === 'all' || petType === selectedPetType || petType === 'all');
    card.style.display = isMatching ? '' : 'none';
  });
  sortServiceCards(sortValue);
  updateServiceCount();
  renderActiveTags(selectedService, selectedPetType);
}

function sortServiceCards(value) {
  var cards = Array.from(serviceGrid.children).filter(function (card) {
    return card.style.display !== 'none';
  });
  cards.sort(function (a, b) {
    var aPrice = Number(a.dataset.price || 0);
    var bPrice = Number(b.dataset.price || 0);
    if (value === 'price-asc') return aPrice - bPrice;
    if (value === 'price-desc') return bPrice - aPrice;
    return 0;
  });
  cards.forEach(function (card) { serviceGrid.appendChild(card); });
}

function renderActiveTags(serviceFilter, petFilter) {
  if (!activeTags) return;
  activeTags.innerHTML = '';
  var labelMap = {
    basic: 'Cắt tỉa', spa: 'Tắm & Spa', full: 'Trọn gói', all: 'Tất cả',
    dog: 'Chó', cat: 'Mèo'
  };
  var tags = [];
  if (serviceFilter && serviceFilter !== 'all') tags.push({ label: labelMap[serviceFilter] || serviceFilter, key: 'service' });
  if (petFilter && petFilter !== 'all') tags.push({ label: labelMap[petFilter] || petFilter, key: 'pet' });
  tags.forEach(function (tag) {
    var tagEl = document.createElement('span');
    tagEl.className = 'filter-tag';
    tagEl.textContent = tag.label + ' ×';
    tagEl.addEventListener('click', function () {
      resetFilter(tag.key);
    });
    activeTags.appendChild(tagEl);
  });
}

function resetFilter(key) {
  if (key === 'service') {
    filterServiceType.querySelectorAll('.sidebar-filter-item').forEach(function (node) {
      node.classList.toggle('active', node.dataset.filter === 'all');
    });
  }
  if (key === 'pet') {
    filterPetType.querySelectorAll('.sidebar-filter-item').forEach(function (node) {
      node.classList.toggle('active', node.dataset.filter === 'all');
    });
  }
  applyFilters();
}

function updateBreedOptions() {
  if (!gbBreedInput || !speciesInput) return;
  var breeds = speciesInput.value === 'Dog' ? gbDogBreeds : speciesInput.value === 'Cat' ? gbCatBreeds : [];
  gbBreedInput.innerHTML = '<option value="">Chọn giống</option>' +
    breeds.map(function (name) { return '<option value="' + name + '">' + name + '</option>'; }).join('');
  gbBreedInput.disabled = breeds.length === 0;
  if (breeds.length === 0) {
    gbBreedInput.value = '';
  }
}

function renderServiceSelect() {
  if (!gbServiceSelect || !Array.isArray(groomingState.services)) return;
  gbServiceSelect.innerHTML = '<option value="">Chọn dịch vụ</option>' +
    groomingState.services.map(function (item) {
      return '<option value="' + item.id + '">' + item.name + ' - ' + gbFormatVND(item.basePrice) + '</option>';
    }).join('');
}

function applyPendingGroomingService() {
  var pendingId = null;
  try {
    pendingId = localStorage.getItem(PENDING_GROOMING_SERVICE_KEY);
  } catch (err) {
    pendingId = null;
  }
  if (!pendingId) return;
  try {
    localStorage.removeItem(PENDING_GROOMING_SERVICE_KEY);
  } catch (err) {
    /* ignore */
  }
  selectService(pendingId, false);
}

function selectService(serviceId, autoNavigate) {
  groomingState.selectedService = groomingState.services.find(function (item) {
    return item.id === serviceId;
  }) || null;
  if (gbServiceSelect) {
    gbServiceSelect.value = groomingState.selectedService ? groomingState.selectedService.id : '';
  }
  // Highlight card được chọn
  if (serviceGrid) {
    serviceGrid.querySelectorAll('.service-card').forEach(function (c) {
      c.classList.toggle('service-card--selected', c.dataset.serviceId === serviceId);
    });
  }
  if (bookingServicesList) {
    bookingServicesList.querySelectorAll('.booking-service-card').forEach(function (c) {
      c.classList.toggle('selected', c.dataset.serviceId === serviceId);
    });
  }
  updateBookingSummary();
  if (autoNavigate !== false) {
    if (typeof showGroomingBooking === 'function') {
      showGroomingBooking();
    }
  }
}

function getWeightMultiplier(weight) {
  if (weight <= 5) return 1.0;
  if (weight <= 10) return 1.2;
  if (weight <= 20) return 1.5;
  return 2.0;
}

function getFurMultiplier() {
  var species = speciesInput ? speciesInput.value : '';
  var furType = furTypeInput ? furTypeInput.value : '';
  return (groomingState.priceRules[species] && groomingState.priceRules[species][furType]) ? groomingState.priceRules[species][furType] : 1;
}

function calculateEstimatedPrice() {
  if (!groomingState.selectedService) return 0;
  var weight = Number(gbWeightInput ? gbWeightInput.value : 0);
  var basePrice = groomingState.selectedService.basePrice;
  var furMultiplier = getFurMultiplier();
  var weightMultiplier = getWeightMultiplier(weight);
  var haircutCost = 0;
  try { haircutCost = hairStyleInput && hairStyleInput.value ? (hairStylePriceMap[hairStyleInput.value] || 0) : 0; } catch (e) { haircutCost = 0; }
  return Math.round(basePrice * furMultiplier * weightMultiplier) + haircutCost;
}

function updateBookingSummary() {
  if (!summaryService) return;
  var estimated = calculateEstimatedPrice();
  var basePrice = groomingState.selectedService ? groomingState.selectedService.basePrice : 0;
  var furMultiplier = groomingState.selectedService ? getFurMultiplier() : 1;
  var weightMultiplier = (gbWeightInput && Number(gbWeightInput.value) > 0) ? getWeightMultiplier(Number(gbWeightInput.value)) : 1;
  var styleCost = hairStyleInput && hairStyleInput.value ? (hairStylePriceMap[hairStyleInput.value] || 0) : 0;
  var additionalCost = groomingState.selectedService ? (Math.round((furMultiplier * weightMultiplier - 1) * basePrice) + styleCost) : 0;

  summaryService.textContent = groomingState.selectedService ? groomingState.selectedService.name : '-';
  if (summaryHairStyle) summaryHairStyle.textContent = hairStyleInput && hairStyleInput.value ? hairStyleInput.value + (styleCost ? ' +' + gbFormatVND(styleCost) : '') : '-';
  if (summaryWeight) summaryWeight.textContent = gbWeightInput && gbWeightInput.value ? gbWeightInput.value + ' kg' : '-';
  if (summaryFurType) summaryFurType.textContent = furTypeInput ? furTypeInput.value : '-';
  if (summaryBasePrice) summaryBasePrice.textContent = groomingState.selectedService ? gbFormatVND(basePrice) : '-';
  if (summaryAddCost) summaryAddCost.textContent = groomingState.selectedService ? gbFormatVND(additionalCost) : '-';
  if (summaryTotal) summaryTotal.textContent = groomingState.selectedService ? gbFormatVND(estimated) : '0 VND';
}

function validateForm() {
  if (!groomingState.selectedService) {
    alert('Vui lòng chọn một dịch vụ grooming.');
    return false;
  }
  if (!(gbPetNameInput && gbPetNameInput.value.trim()) || !(speciesInput && speciesInput.value) || !(gbServiceSelect && gbServiceSelect.value) || !(gbBreedInput && gbBreedInput.value.trim()) || !(furTypeInput && furTypeInput.value) || !(gbWeightInput && gbWeightInput.value)) {
    alert('Vui lòng điền đầy đủ thông tin thú cưng.');
    return false;
  }
  if (Number(gbWeightInput.value) <= 0) {
    alert('Cân nặng phải lớn hơn 0.');
    return false;
  }
  if (!(appointmentDateInput && appointmentDateInput.value) || !(appointmentTimeInput && appointmentTimeInput.value)) {
    alert('Vui lòng chọn ngày và giờ hẹn.');
    return false;
  }
  if (!(customerNameInput && customerNameInput.value.trim()) || !(customerPhoneInput && customerPhoneInput.value.trim())) {
    alert('Vui lòng điền tên và số điện thoại khách hàng.');
    return false;
  }
  return true;
}

function openConfirmationModal(event) {
  event.preventDefault();
  if (!validateForm() || !gbConfirmationModal) return;
  var text = 'Dịch vụ: ' + groomingState.selectedService.name + '\n' +
             'Thú cưng: ' + gbPetNameInput.value.trim() + '\n' +
             'Ngày: ' + appointmentDateInput.value + '\n' +
             'Giờ: ' + appointmentTimeInput.value + '\n' +
             'Giá ước tính: ' + gbFormatVND(calculateEstimatedPrice());
  var confirmTextEl = document.getElementById('confirmText');
  if (confirmTextEl) confirmTextEl.textContent = text;
  gbConfirmationModal.classList.add('show');
}

function closeConfirmationModal() {
  if (gbConfirmationModal) gbConfirmationModal.classList.remove('show');
}

function closeSuccessModal() {
  if (gbSuccessModal) gbSuccessModal.classList.remove('show');
}

function generateBookingId() {
  var count = groomingState.bookings.length + 1;
  return 'GRM-' + String(count).padStart(5, '0');
}

async function confirmBooking() {
  if (!gbConfirmationModal) return;
  gbConfirmationModal.classList.remove('show');
  var booking = {
    bookingId: generateBookingId(),
    serviceId: groomingState.selectedService.id,
    serviceName: groomingState.selectedService.name,
    pet: {
      name: gbPetNameInput.value.trim(),
      species: speciesInput.value,
      breed: gbBreedInput.value.trim(),
      weight: gbWeightInput.value,
      furType: furTypeInput.value,
      hairStyle: hairStyleInput ? (hairStyleInput.value || '') : ''
    },
    customer: {
      name: customerNameInput.value.trim(),
      phone: customerPhoneInput.value.trim(),
      notes: notesInput ? notesInput.value.trim() : ''
    },
    appointmentDate: appointmentDateInput.value,
    appointmentTime: appointmentTimeInput.value,
    estimatedPrice: calculateEstimatedPrice(),
    status: 'Booked',
    createdAt: new Date().toISOString()
  };
  groomingState.bookings.push(booking);
  await persistBookings(booking);
  saveToPetProfile(booking);
  showSuccess(booking);
}

async function persistBookings(booking) {
  if (typeof window === 'undefined') return;
  try {
    var response = await fetch('/api/grooming/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    });
    if (!response.ok) throw new Error('API not available');
    return;
  } catch (error) {
    localStorage.setItem('groomingBookings', JSON.stringify(groomingState.bookings));
  }
}

function showSuccess(booking) {
  if (!gbSuccessModal || !successMessage) return;
  successMessage.innerHTML = 'Mã đơn: <strong>' + booking.bookingId + '</strong><br>' +
                             'Dịch vụ: ' + booking.serviceName + '<br>' +
                             'Ngày: ' + booking.appointmentDate + '<br>' +
                             'Giờ: ' + booking.appointmentTime + '<br>' +
                             'Giá: ' + gbFormatVND(booking.estimatedPrice);
  gbSuccessModal.classList.add('show');
  if (gbBookingForm) gbBookingForm.reset();
  groomingState.selectedService = null;
  updateBookingSummary();
}

function saveToPetProfile(booking) {
  if (typeof window === 'undefined') return;
  try {
    var PET_STORAGE_KEY = 'petopia_pets';
    var raw = localStorage.getItem(PET_STORAGE_KEY);
    var pets = raw ? JSON.parse(raw) : [];

    var petName = (booking.pet && booking.pet.name) ? booking.pet.name.trim() : '';
    var petSpecies = (booking.pet && booking.pet.species) ? booking.pet.species : '';
    var petBreed = (booking.pet && booking.pet.breed) ? booking.pet.breed.trim() : '';

    var matched = pets.find(function (p) {
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
    var serviceRecord = {
      id: booking.bookingId || ('srv_' + Date.now()),
      type: 'grooming',
      serviceId: booking.serviceId,
      serviceName: booking.serviceName,
      date: booking.appointmentDate,
      time: booking.appointmentTime,
      price: booking.estimatedPrice,
      status: booking.status || 'Booked',
      createdAt: booking.createdAt || new Date().toISOString()
    };
    matched.bookings.push(serviceRecord);

    localStorage.setItem(PET_STORAGE_KEY, JSON.stringify(pets));
    try { window.dispatchEvent(new Event('petProfilesUpdated')); localStorage.setItem('pet_profiles_last_update', Date.now().toString()); } catch(e){}
  } catch (error) {
    console.error('Error saving to pet profile:', error);
  }
}

function saveBookings() {
  if (typeof window === 'undefined') return;
  localStorage.setItem('groomingBookings', JSON.stringify(groomingState.bookings));
}

function showTimeSlotWarning(message) {
  var warningEl = document.getElementById('timeWarning');
  if (!warningEl) return;
  warningEl.textContent = message;
  warningEl.style.color = '#c62828';
}

function clearTimeSlotWarning() {
  var warningEl = document.getElementById('timeWarning');
  if (!warningEl) return;
  warningEl.textContent = '';
}

function validateTimeSlots() {
  if (!appointmentDateInput || !appointmentTimeInput) return;
  var date = appointmentDateInput.value;
  var bookedSlots = groomingState.bookings
    .filter(function (item) { return item.appointmentDate === date && item.status !== 'Cancelled'; })
    .map(function (item) { return item.appointmentTime; });
  var availableCount = 0;
  Array.from(appointmentTimeInput.options).forEach(function (option) {
    if (!option.value) return;
    var disabled = bookedSlots.indexOf(option.value) !== -1;
    option.disabled = disabled;
    if (!disabled) availableCount++;
  });
  if (availableCount === 0 && date) {
    showTimeSlotWarning('Không còn giờ trống. Vui lòng chọn ngày khác.');
  } else {
    clearTimeSlotWarning();
  }
  if (appointmentTimeInput.value && appointmentTimeInput.selectedOptions[0].disabled) {
    appointmentTimeInput.value = '';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(initGroomingPage, 100);
  });
} else {
  setTimeout(initGroomingPage, 100);
}

// Expose re-init for summary fields after page switch
window.refreshGroomingBookingSummary = function () {
  summaryService  = document.getElementById('summaryService');
  summaryWeight   = document.getElementById('summaryWeight');
  summaryFurType  = document.getElementById('summaryFurType');
  summaryBasePrice= document.getElementById('summaryBasePrice');
  summaryAddCost  = document.getElementById('summaryAddCost');
  summaryTotal    = document.getElementById('summaryTotal');
  summaryHairStyle= document.getElementById('summaryHairStyle');
  updateBookingSummary();
};

})(); // end IIFE