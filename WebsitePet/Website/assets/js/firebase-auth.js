// Import các hàm cần thiết từ Firebase SDK qua CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Thông tin cấu hình dự án Petopia (Đã dọn dẹp khoảng trắng thừa)
const firebaseConfig = {
   apiKey : "" , 
    authDomain : "petopia-f9527.firebaseapp.com" , 
    projectId : "petopia-f9527" , 
    storageBucket : "petopia-f9527.firebasestorage.app" , 
    messagingSenderId : "1004810131005" , 
    appId : "1:1004810131005:web:c24f3ac831e8b263cabc54" , 
    measurementId : "G-ZT5YKZN3KH" 
};

// Khởi tạo Firebase và Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Khởi tạo Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Khởi tạo Facebook Auth Provider
const facebookProvider = new FacebookAuthProvider();

/* ================= TIỆN ÍCH CHUNG (Gắn vào window để HTML gọi được) ================= */

function getRedirectTarget(role) {
    return role === 'admin' ? 'admin/dashboard.html' : 'index.html';
}

window.showToast = function (message, type = 'success', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, duration);
};

window.switchView = function (viewId) {
    document.querySelectorAll('.view-section').forEach(view => {
        view.classList.add('hidden-view');
    });
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.remove('hidden-view');
    
    if(viewId === 'view-forgot') {
        const step1 = document.getElementById('forgotFormStep1');
        if(step1) step1.classList.remove('hidden-view');
        const desc = document.getElementById('forgotDesc');
        if(desc) desc.innerText = "Nhập email để nhận liên kết đặt lại mật khẩu";
    }
};

window.togglePass = function (inputId, iconEl) {
    const input = document.getElementById(inputId);
    if(!input) return;
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    iconEl.classList.toggle('fa-eye');
    iconEl.classList.toggle('fa-eye-slash');
};

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function clearErrorOnInput(inputId, groupId, errorId) {
    const inputEl = document.getElementById(inputId);
    if (inputEl) {
        inputEl.addEventListener('input', function() {
            const group = document.getElementById(groupId);
            if(group) group.classList.remove('error-field');
            const errorEl = document.getElementById(errorId);
            if (errorEl) errorEl.style.display = "none";
        });
    }
}

    // =======================
    // Lấy role từ db.json (theo email)
    // =======================

    async function hydrateCurrentUserFromDb(email, fallbackName) {
        try {
            const res = await fetch('../sbackendpet/db.json');
            if (!res.ok) throw new Error('fetch db.json failed');
            const db = await res.json();

            const normalized = String(email || '').toLowerCase();
            const found = Array.isArray(db.users)
                ? db.users.find(u => String(u.email || '').toLowerCase() === normalized)
                : null;

            const role = found && found.role ? found.role : 'customer';
            const name = found && found.name ? found.name : fallbackName;

            return { name: name || fallbackName || email, email, role };
        } catch (e) {
            // Nếu không load được db thì vẫn cho đăng nhập nhưng role mặc định = customer
            return { name: fallbackName || email, email, role: 'customer' };
        }
    }

    // --- HÀM XỬ LÝ ĐĂNG NHẬP GOOGLE ---
function handleGoogleAuthSuccess(result) {
    const user = result.user;

    localStorage.setItem('track_session_user', user.email);

    hydrateCurrentUserFromDb(user.email, user.displayName)
        .then((cu) => {
            localStorage.setItem('currentUser', JSON.stringify(cu));
            window.showToast(`Chào mừng ${cu.name || 'bạn'} đã quay trở lại!`, "success");
            console.log("Google User đã đăng nhập:", user);
            setTimeout(() => { window.location.href = getRedirectTarget(cu.role); }, 1000);
        });
}


// Yêu cầu: Thêm domain vào Firebase Console → Authentication → Settings → Authorized domains

window.loginWithGoogle = function() {
    // iOS/Safari thường chặn popup, nên luôn dùng redirect cho mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        signInWithRedirect(auth, googleProvider)
            .catch((redirectError) => {
                window.showToast("Không thể mở trang đăng nhập. Vui lòng thử lại!", "error");
            });
    } else {
        signInWithPopup(auth, googleProvider)
            .then(handleGoogleAuthSuccess)
            .catch((error) => {
                if (error.code === 'auth/unauthorized-domain' || error.code === 'auth/popup-blocked' || error.code === 'auth/operation-not-allowed') {
                    signInWithRedirect(auth, googleProvider)
                        .catch((redirectError) => {
                            window.showToast("Vui lòng thêm domain '" + window.location.origin + "' vào Firebase Console → Authentication → Settings → Authorized domains", "error");
                        });
                } else {
                    window.showToast("Lỗi đăng nhập Google: " + error.message, "error");
                }
            });
    }
};

// --- HÀM XỬ LÝ ĐĂNG NHẬP FACEBOOK ---
function handleFacebookAuthSuccess(result) {
    const user = result.user;

    // LƯU SESSION CHO SHOP.JS NHẬN DIỆN
    localStorage.setItem('track_session_user', user.email || user.uid);

    hydrateCurrentUserFromDb(user.email, user.displayName)
        .then((cu) => {
            localStorage.setItem('currentUser', JSON.stringify(cu));
            window.showToast(`Chào mừng ${cu.name || 'bạn'} đã quay trở lại!`, "success");
            console.log("Facebook User đã đăng nhập:", user);
            setTimeout(() => { window.location.href = getRedirectTarget(cu.role); }, 1000);
        });
}


// Yêu cầu: Bật Facebook trong Firebase Console → Authentication → Sign-in method,
// và nhập App ID + App Secret của Facebook App tại đó (KHÔNG đưa App Secret vào code).
// Đồng thời thêm OAuth redirect URI mà Firebase cung cấp vào Facebook Developers Console.

window.loginWithFacebook = function() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
        signInWithRedirect(auth, facebookProvider)
            .catch((redirectError) => {
                window.showToast("Không thể mở trang đăng nhập. Vui lòng thử lại!", "error");
            });
    } else {
        signInWithPopup(auth, facebookProvider)
            .then(handleFacebookAuthSuccess)
            .catch((error) => {
                if (error.code === 'auth/account-exists-with-different-credential') {
                    window.showToast("Email này đã được đăng ký bằng phương thức khác. Vui lòng đăng nhập bằng phương thức ban đầu!", "error");
                } else if (error.code === 'auth/unauthorized-domain' || error.code === 'auth/popup-blocked' || error.code === 'auth/operation-not-allowed') {
                    signInWithRedirect(auth, facebookProvider)
                        .catch((redirectError) => {
                            window.showToast("Vui lòng thêm domain '" + window.location.origin + "' vào Firebase Console → Authentication → Settings → Authorized domains", "error");
                        });
                } else {
                    window.showToast("Lỗi đăng nhập Facebook: " + error.message, "error");
                }
            });
    }
};

/* ================= XỬ LÝ SỰ KIỆN KHI DOM SẴN SÀNG ================= */

document.addEventListener('DOMContentLoaded', function () {
    // Đăng ký xóa lỗi khi gõ
    clearErrorOnInput('loginEmail', 'loginEmailGroup', 'loginEmailError');
    clearErrorOnInput('loginPassword', 'loginPasswordGroup', 'loginPasswordError');
    clearErrorOnInput('regName', 'regNameGroup', 'regNameError');
    clearErrorOnInput('regEmail', 'regEmailGroup', 'regEmailError');
    clearErrorOnInput('regPassword', 'regPasswordGroup', 'regPasswordError');
    clearErrorOnInput('forgotEmail', 'forgotEmailGroup', 'forgotEmailError');

    /* 1. XỬ LÝ ĐĂNG NHẬP (FIREBASE EMAIL) */
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            let isValid = true;
            const emailVal = document.getElementById('loginEmail').value.trim();
            const passVal = document.getElementById('loginPassword').value;

            if (!validateEmail(emailVal)) {
                document.getElementById('loginEmailGroup').classList.add('error-field');
                document.getElementById('loginEmailError').style.display = "block";
                isValid = false;
            }
            if (passVal.length < 6) {
                document.getElementById('loginPasswordGroup').classList.add('error-field');
                document.getElementById('loginPasswordError').style.display = "block";
                isValid = false;
            }

            if (isValid) {
                const btnSubmit = document.getElementById('btnLoginSubmit');
                const btnSpinner = document.getElementById('btnLoginSpinner');
                const btnText = document.getElementById('btnLoginText');

                if(btnSubmit) btnSubmit.disabled = true;
                if(btnSpinner) btnSpinner.style.display = 'inline-block';
                if(btnText) btnText.textContent = ' Đang đăng nhập...';

// Gọi hàm đăng nhập của Firebase
                // EMAIL/PASSWORD theo yêu cầu: bỏ qua password, chỉ check email trong db.json
                hydrateCurrentUserFromDb(emailVal, emailVal.split('@')[0])
                    .then((cu) => {
                        localStorage.setItem('track_session_user', cu.email);
                        localStorage.setItem('currentUser', JSON.stringify(cu));

                        window.showToast("Đăng nhập thành công!", "success");

                        // Xóa pending cart item nếu có
                        const pendingItem = localStorage.getItem("pending_cart_item");
                        if (pendingItem) {
                            localStorage.removeItem("pending_cart_item");
                        }
                        setTimeout(() => { window.location.href = getRedirectTarget(cu.role); }, 1000);
                    })
                    .catch(() => {
                        if(btnSubmit) btnSubmit.disabled = false;
                        if(btnSpinner) btnSpinner.style.display = 'none';
                        if(btnText) btnText.innerHTML = '<i class="fa-solid fa-paw paw-icon"></i> Đăng nhập';

                        document.getElementById('loginPasswordGroup').classList.add('error-field');
                        const loginError = document.getElementById('loginPasswordError');
                        if(loginError) {
                            loginError.innerText = "Email hoặc mật khẩu không chính xác.";
                            loginError.style.display = "block";
                        }
                    });

            }
        });
    }

    /* 2. XỬ LÝ ĐĂNG KÝ (FIREBASE EMAIL) */
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            let isValid = true;
            const emailVal = document.getElementById('regEmail').value.trim();
            const passVal = document.getElementById('regPassword').value;
            const confirmVal = document.getElementById('regConfirm').value;

            if (!validateEmail(emailVal)) {
                document.getElementById('regEmailGroup').classList.add('error-field');
                document.getElementById('regEmailError').style.display = "block";
                isValid = false;
            }
            if (passVal.length < 6) {
                document.getElementById('regPasswordGroup').classList.add('error-field');
                document.getElementById('regPasswordError').style.display = "block";
                isValid = false;
            }
            if (passVal !== confirmVal) {
                document.getElementById('regConfirmGroup').classList.add('error-field');
                document.getElementById('regConfirmError').style.display = "block";
                isValid = false;
            }

            if (isValid) {
                const btnSubmit = document.getElementById('btnRegSubmit');
                const btnSpinner = document.getElementById('btnRegSpinner');
                const btnText = document.getElementById('btnRegText');

                if(btnSubmit) btnSubmit.disabled = true;
                if(btnSpinner) btnSpinner.style.display = 'inline-block';
                if(btnText) btnText.textContent = ' Đang xử lý...';

                // Gọi hàm tạo tài khoản của Firebase
                createUserWithEmailAndPassword(auth, emailVal, passVal)
                    .then((userCredential) => {
                        window.showToast("Đăng ký thành công! Vui lòng đăng nhập.", "success");
                        const loginEmailInput = document.getElementById('loginEmail');
                        if(loginEmailInput) loginEmailInput.value = emailVal;
                        
                        if(btnSubmit) btnSubmit.disabled = false;
                        if(btnSpinner) btnSpinner.style.display = 'none';
                        if(btnText) btnText.innerHTML = '<i class="fa-solid fa-user-plus paw-icon"></i> Đăng ký';
                        
                        setTimeout(() => { window.switchView('view-login'); }, 1500);
                    })
                    .catch((error) => {
                        if(btnSubmit) btnSubmit.disabled = false;
                        if(btnSpinner) btnSpinner.style.display = 'none';
                        if(btnText) btnText.innerHTML = '<i class="fa-solid fa-user-plus paw-icon"></i> Đăng ký';

                        if (error.code === 'auth/email-already-in-use') {
                            document.getElementById('regEmailGroup').classList.add('error-field');
                            const regEmailError = document.getElementById('regEmailError');
                            if(regEmailError) {
                                regEmailError.innerText = "Email này đã được đăng ký.";
                                regEmailError.style.display = "block";
                            }
                        } else if (error.code === 'auth/unauthorized-domain') {
                            window.showToast("Domain chưa được ủy quyền. Vui lòng liên hệ quản trị viên!", "error");
                        } else {
                            window.showToast("Lỗi đăng ký: " + error.message, "error");
                        }
                    });
            }
        });
    }

    /* 3. XỬ LÝ QUÊN MẬT KHẨU */
    const forgotFormStep1 = document.getElementById('forgotFormStep1');
    if (forgotFormStep1) {
        forgotFormStep1.addEventListener('submit', function (e) {
            e.preventDefault();
            const emailVal = document.getElementById('forgotEmail').value.trim();

            if (!validateEmail(emailVal)) {
                document.getElementById('forgotEmailGroup').classList.add('error-field');
                document.getElementById('forgotEmailError').style.display = "block";
            } else {
                const btnSubmit = document.getElementById('btnForgotSubmit');
                const btnSpinner = document.getElementById('btnForgotSpinner');

                if(btnSubmit) btnSubmit.disabled = true;
                if(btnSpinner) btnSpinner.style.display = 'inline-block';

                sendPasswordResetEmail(auth, emailVal)
                    .then(() => {
                        if(btnSubmit) btnSubmit.disabled = false;
                        if(btnSpinner) btnSpinner.style.display = 'none';
                        window.showToast(`Liên kết đặt lại mật khẩu đã được gửi đến ${emailVal}!`, "success", 6000);
                        setTimeout(() => { window.switchView('view-login'); }, 2000);
                    })
                    .catch((error) => {
                        if(btnSubmit) btnSubmit.disabled = false;
                        if(btnSpinner) btnSpinner.style.display = 'none';
                        if (error.code === 'auth/user-not-found') {
                            window.showToast("Email này chưa được đăng ký trong hệ thống!", "error");
                        } else if (error.code === 'auth/unauthorized-domain') {
                            window.showToast("Domain chưa được ủy quyền. Vui lòng liên hệ quản trị viên!", "error");
                        } else {
                            window.showToast("Gửi yêu cầu thất bại. Vui lòng thử lại!", "error");
                        }
                    });
            }
        });
    }
 
    // Xử lý kết quả redirect từ Google/Facebook Sign-In
    const handleRedirectResult = async () => {
        try {
            const result = await getRedirectResult(auth);
            if (result && result.user) {
                const providerId = result.providerId || (result._tokenResponse && result._tokenResponse.providerId) || '';
                if (providerId.includes('facebook')) {
                    handleFacebookAuthSuccess(result);
                } else {
                    handleGoogleAuthSuccess(result);
                }
            }
        } catch (error) {
            if (error.code !== 'auth/no-auth-event') {
                window.showToast("Lỗi đăng nhập: " + error.message, "error");
            }
        }
    };
    
    // Gọi xử lý redirect khi trang load
    handleRedirectResult();
 });
