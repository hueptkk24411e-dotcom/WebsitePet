'use strict';

/* ============================================================
   contact.js  –  Petopia Contact Page Handler
   · Validate form
   · Lưu data vào localStorage
   · Toast notification
   ============================================================ */

const Contact = {

  STORAGE_KEY: 'petopia_contact_messages',

  init() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleSubmit();
    });

    // Clear error khi người dùng gõ lại
    ['cf-name', 'cf-phone', 'cf-message'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this._clearError(id));
    });
  },

  _handleSubmit() {
    // ── Validate ──────────────────────────────────────────
    const name    = document.getElementById('cf-name');
    const phone   = document.getElementById('cf-phone');
    const email   = document.getElementById('cf-email');
    const message = document.getElementById('cf-message');

    let valid = true;

    if (!name.value.trim()) {
      this._setError('cf-name', 'Vui lòng nhập họ và tên');
      valid = false;
    }
    if (!phone.value.trim()) {
      this._setError('cf-phone', 'Vui lòng nhập số điện thoại');
      valid = false;
    } else if (!/^[0-9]{9,11}$/.test(phone.value.trim().replace(/\s/g, ''))) {
      this._setError('cf-phone', 'Số điện thoại không hợp lệ');
      valid = false;
    }
    if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      this._setError('cf-email', 'Email không đúng định dạng');
      valid = false;
    }
    if (!message.value.trim()) {
      this._setError('cf-message', 'Vui lòng nhập nội dung tin nhắn');
      valid = false;
    }

    if (!valid) return;

    // ── Build data object ─────────────────────────────────
    const entry = {
      id:        Date.now(),
      timestamp: new Date().toISOString(),
      name:      name.value.trim(),
      phone:     phone.value.trim(),
      email:     email.value.trim() || null,
      message:   message.value.trim(),
      status:    'new'
    };

    // ── Save to localStorage ──────────────────────────────
    this._save(entry);

    // ── UI feedback ───────────────────────────────────────
    const btn = document.getElementById('contactSubmitBtn');
    const successMsg = document.getElementById('contactSuccessMsg');

    btn.classList.add('success');
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Đã gửi thành công!';

    if (successMsg) successMsg.classList.add('show');

    this._showToast('Tin nhắn của bạn đã được gửi thành công!');

    // Reset sau 3.5 giây
    setTimeout(() => {
      document.getElementById('contactForm').reset();
      btn.classList.remove('success');
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Gửi tin nhắn';
      if (successMsg) successMsg.classList.remove('show');
    }, 3500);
  },

  _save(entry) {
    try {
      const existing = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      existing.unshift(entry);            // mới nhất lên đầu
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
      console.log('[Contact] Đã lưu:', entry);
    } catch (err) {
      console.error('[Contact] Lưu thất bại:', err);
    }
  },

  getMessages() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch { return []; }
  },

  _setError(id, msg) {
    const el  = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    if (el)  el.classList.add('error');
    if (err) { err.textContent = msg; err.classList.add('show'); }
  },

  _clearError(id) {
    const el  = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    if (el)  el.classList.remove('error');
    if (err) err.classList.remove('show');
  },

  _showToast(msg) {
    let toast = document.getElementById('contactToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'contactToast';
      toast.className = 'contact-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${msg}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
  }
};

/* ── AUTO-INIT ─────────────────────────────────────────────
   Gọi Contact.init() khi chuyển sang trang contact
   (hook vào showPage giống blog.js)
──────────────────────────────────────────────────────────── */
(function () {
  let inited = false;
  document.addEventListener('DOMContentLoaded', () => {
    const orig = window.showPage;
    if (typeof orig !== 'function') return;

    window.showPage = function (page) {
      orig(page);
      if (page === 'contact' && !inited) {
        inited = true;
        Contact.init();
      }
    };
  });
})();
