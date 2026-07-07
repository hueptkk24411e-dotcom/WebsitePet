const STORAGE_KEY = 'petopia_pets';

function getPets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function savePets(pets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
}

function generateId() {
  return 'pet_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function openPetModal(tab) {
  const modal = document.getElementById('petModal');
  if (!modal) return;
  modal.style.display = 'flex';
  ensureBookingFilterTabs();
  switchPetModalTab(tab || 'profile');
  renderPetList();
}

function ensureBookingFilterTabs() {
  const panel = document.getElementById('petPanel-bookings');
  if (!panel) return;

  let tabsContainer = panel.querySelector('#modalBookingFilterTabs');
  if (tabsContainer) return;

  if (typeof currentBookingFilter === 'undefined') {
    currentBookingFilter = 'all';
  }

  tabsContainer = document.createElement('div');
  tabsContainer.id = 'modalBookingFilterTabs';
  tabsContainer.style.cssText = 'display:flex;gap:8px;margin-bottom:14px;';
  tabsContainer.innerHTML = [
    { key: 'all', label: 'Tất cả' },
    { key: 'grooming', label: 'Grooming' },
    { key: 'hotel', label: 'Hotel' }
  ].map(item => {
    return `<button class="booking-filter-btn" onclick="setBookingFilter('${item.key}')" style="padding:6px 14px;border:1px solid #ddd;border-radius:20px;background:white;cursor:pointer;font-size:12px;font-weight:600;color:#888;">${item.label}</button>`;
  }).join('');

  const target = panel.querySelector('#modalBookingHistoryList');
  if (target) {
    panel.insertBefore(tabsContainer, target);
  } else {
    panel.appendChild(tabsContainer);
  }
  updateBookingFilterUI();
}

function closePetModal() {
  const modal = document.getElementById('petModal');
  if (modal) modal.style.display = 'none';
}

function switchPetModalTab(tab) {
  const tabs = document.querySelectorAll('.pet-modal-tab');
  const panels = document.querySelectorAll('.pet-modal-panel');
  tabs.forEach(t => t.classList.remove('active'));
  panels.forEach(p => p.style.display = 'none');

  if (tab === 'profile') {
    tabs[0].classList.add('active');
    const profilePanel = document.getElementById('petPanel-profile');
    if (profilePanel) profilePanel.style.display = 'block';
    renderPetList();
  } else {
    const targetTabIndex = tabs[1] && tabs[1].getAttribute('data-tab') === 'bookings' ? 1 : 1;
    tabs[targetTabIndex].classList.add('active');
    const bookingsPanel = document.getElementById('petPanel-bookings');
    if (bookingsPanel) bookingsPanel.style.display = 'block';
    currentBookingFilter = 'all';
    updateBookingFilterUI();
    renderBookingHistory('all');
  }
}

function renderPetList() {
  const container = document.getElementById('petListContainer');
  if (!container) return;

  const pets = getPets();
  if (!pets.length) {
    container.innerHTML = '<p style="text-align:center;color:#aaa;padding:20px 0;">Chưa có thú cưng nào. Hãy thêm ngay!</p>';
    return;
  }

  container.innerHTML = pets.map((pet, index) => `
    <div class="pet-card">
      <div class="pet-card__header">
        <strong>${index + 1}. ${pet.name}</strong>
        <span class="pet-card__type">${pet.type === 'dog' ? '🐕' : '🐈'} ${pet.type === 'dog' ? 'Chó' : 'Mèo'}</span>
      </div>
      <div class="pet-card__body">
        <p><b>Giống:</b> ${pet.breed}</p>
        <p><b>Cân nặng:</b> ${pet.weight} kg</p>
        ${pet.gender ? `<p><b>Giới tính:</b> ${pet.gender === 'male' ? 'Đực' : 'Cái'}</p>` : ''}
        ${pet.color ? `<p><b>Màu lông:</b> ${pet.color}</p>` : ''}
        ${pet.birthDate ? `<p><b>Ngày sinh:</b> ${new Date(pet.birthDate).toLocaleDateString('vi-VN')}</p>` : ''}
        ${pet.notes ? `<p><b>Ghi chú:</b> ${pet.notes}</p>` : ''}
      </div>
      <div class="pet-card__actions">
        <button onclick="editPet('${pet.id}')" class="pet-btn-edit">Sửa</button>
        <button onclick="deletePet('${pet.id}')" class="pet-btn-delete">Xóa</button>
      </div>
    </div>
  `).join('');
}

function handlePetSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const id = form.dataset.editId;

  const pet = {
    id: id || generateId(),
    name: formData.get('petName')?.trim() || '',
    type: formData.get('petType') || 'dog',
    breed: formData.get('breed')?.trim() || '',
    weight: parseFloat(formData.get('weight')) || 0,
    gender: formData.get('gender') || '',
    color: formData.get('color')?.trim() || '',
    birthDate: formData.get('birthDate') || '',
    notes: formData.get('notes')?.trim() || '',
  };

  if (!pet.name || !pet.breed || !pet.weight) {
    showToast('Vui lòng nhập đầy đủ tên, giống và cân nặng!', 'error');
    return;
  }

  let pets = getPets();
  if (id) {
    const idx = pets.findIndex(p => p.id === id);
    if (idx >= 0) pets[idx] = { ...pets[idx], ...pet };
  } else {
    pet.createdAt = new Date().toISOString();
    pets.push(pet);
  }
  savePets(pets);
  form.reset();
  delete form.dataset.editId;
  document.getElementById('petFormTitle').textContent = '🐾 Thêm thú cưng mới';
  renderPetList();
  showToast('Đã lưu thông tin thú cưng thành công!');
}

function editPet(id) {
  const pets = getPets();
  const pet = pets.find(p => p.id === id);
  if (!pet) return;

  const form = document.getElementById('petForm');
  if (!form) return;

  form.dataset.editId = pet.id;
  form.querySelector('[name="petName"]').value = pet.name;
  form.querySelector('[name="petType"]').value = pet.type;
  form.querySelector('[name="breed"]').value = pet.breed;
  form.querySelector('[name="weight"]').value = pet.weight;
  form.querySelector('[name="gender"]').value = pet.gender || '';
  form.querySelector('[name="color"]').value = pet.color || '';
  form.querySelector('[name="birthDate"]').value = pet.birthDate || '';
  form.querySelector('[name="notes"]').value = pet.notes || '';
  document.getElementById('petFormTitle').textContent = '✏️ Cập nhật thú cưng';
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function deletePet(id) {
  if (!confirm('Bạn có chắc muốn xóa thông tin thú cưng này?')) return;
  const pets = getPets().filter(p => p.id !== id);
  savePets(pets);
  renderPetList();
  showToast('Đã xóa thông tin thú cưng.');
}

function showToast(msg, type) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: ${type === 'error' ? '#d32f2f' : '#2e7d32'}; color: #fff;
    padding: 10px 20px; border-radius: 8px; font-weight: 600; z-index: 10001;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-size: 14px;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// NOTE: Toàn bộ logic dữ liệu/hiển thị lịch sử đặt lịch (getPetProfileBookings,
// renderBookingHistory, setBookingFilter, cancelBooking, đánh giá dịch vụ...)
// nay được gộp về MỘT nơi duy nhất trong assets/js/lich-su-dat-lich.js để
// tránh trùng lặp code và đảm bảo tab "Đặt phòng" trong modal Hồ sơ thú cưng
// dùng chung đầy đủ tính năng (xem chi tiết / hủy đơn / đánh giá) với trang
// lịch sử đặt lịch chính.

document.addEventListener('DOMContentLoaded', () => {
  const petForm = document.getElementById('petForm');
  if (petForm) {
    petForm.addEventListener('submit', handlePetSubmit);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePetModal();
  });
});
