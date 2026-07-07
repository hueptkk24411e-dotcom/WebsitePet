let rooms = {};
let provinces = [];      // Danh sách tỉnh/thành từ vietnam-provinces.json

// ==========================================
// 1. TẢI DỮ LIỆU KHI TRANG LOAD
// ==========================================

// Tải dữ liệu phòng từ hotel.json
fetch("assets/dataset/hotel.json")
    .then(res => res.json())
    .then(data => {
        rooms = data;
        // Render sidebar ngay sau khi tải xong — không cần đợi người dùng bấm
        const petType = (typeof currentPetType !== 'undefined' && currentPetType) ? currentPetType : 'dog';
        renderSidebarRooms(petType);
    })
    .catch(err => console.error("Lỗi tải hotel.json:", err));

// Tải danh sách tỉnh/thành phố từ vietnam-provinces.json
fetch("assets/dataset/vietnam-provinces.json")
    .then(res => res.json())
    .then(data => {
        provinces = data;
        loadProvinceOptions();
    })
    .catch(err => console.error("Lỗi tải vietnam-provinces.json:", err));

// ==========================================
// 2. ĐỔ DỮ LIỆU VÀO SELECT BOXES
// ==========================================

// Đổ danh sách tỉnh/thành vào select #pickupProvince
function loadProvinceOptions() {
    const select = document.getElementById("pickupProvince");
    if (!select) return;
    select.innerHTML = '<option value="">-- Chọn tỉnh/thành phố --</option>';
    provinces.forEach(p => {
        const option = document.createElement("option");
        option.value = p.name;
        option.textContent = `${p.type} ${p.name}`;
        select.appendChild(option);
    });
}

// ==========================================
// LOGIC GIAO DIỆN XEM PHÒNG (SIDEBAR + DETAIL)
// ==========================================

function showViewRoom() {
    showPage('viewroom');
    switchPetTab('dog');
}

// Khi nhấn vào card phòng trên trang chủ => chuyển sang trang đặt phòng
function showCategoryDetail(roomType) {
    // Chờ rooms load xong nếu chưa có dữ liệu
    if (!rooms || Object.keys(rooms).length === 0) {
        const checkLoaded = setInterval(() => {
            if (rooms && Object.keys(rooms).length > 0) {
                clearInterval(checkLoaded);
                doShowCategoryDetail(roomType);
            }
        }, 100);
        return;
    }
    doShowCategoryDetail(roomType);
}

function doShowCategoryDetail(roomType) {
    const petType = 'dog';
    const roomList = rooms[petType]?.[roomType];
    if (roomList && roomList.length > 0) {
        const room = roomList[0];
        // Lưu thông tin phòng và điều hướng tới booking
        try {
            localStorage.setItem(PENDING_HOTEL_BOOKING_KEY, JSON.stringify({ room, petType, roomType }));
        } catch (e) {
            console.error("Không thể lưu thông tin phòng đã chọn:", e);
        }
        window.location.href = 'booking.html';
    } else {
        showPage('hotel');
    }
}

// Render sidebar chỉ hiện các phòng thuộc hạng roomType, tự động chọn phòng đầu tiên
function _renderSidebarByCategory(petType, roomType) {
    const sidebarContainer = document.getElementById('room-list-sidebar');
    if (!sidebarContainer || !rooms[petType]) return;

    const typeLabels = { normal: 'Tiêu Chuẩn', premium: 'Cao Cấp', vip: 'VIP' };
    let htmlContent = '';

    // Thêm tiêu đề lọc nhỏ phía trên sidebar
    htmlContent += `<div class="sidebar-filter-label">📋 Hạng: <strong>${typeLabels[roomType] || roomType.toUpperCase()}</strong>
        <button class="sidebar-show-all-btn" onclick="switchPetTab('${petType}')">Xem tất cả</button>
    </div>`;

    const roomList = rooms[petType][roomType];
    if (roomList && roomList.length > 0) {
        roomList.forEach(room => {
            htmlContent += `
                <div class="room-sidebar-item" id="sidebar-${room.roomNumber}" onclick="showRoomDetail('${petType}', '${roomType}', '${room.roomNumber}')">
                    <img src="${room.image}" alt="${room.roomName}">
                    <div class="room-sidebar-info">
                        <h4>[${room.roomNumber}] ${room.roomName}</h4>
                        <span>${room.price}</span>
                        <small class="tag-${roomType}">Hạng ${roomType.toUpperCase()}</small>
                    </div>
                </div>
            `;
        });
    } else {
        htmlContent += `<div class="sidebar-empty">Không có phòng nào thuộc hạng này.</div>`;
    }

    sidebarContainer.innerHTML = htmlContent;

    // Tự động hiển thị chi tiết phòng đầu tiên
    if (roomList && roomList.length > 0) {
        showRoomDetail(petType, roomType, roomList[0].roomNumber);
    }
}

function switchPetTab(petType) {
    currentPetType = petType;
    const buttons = document.querySelectorAll('.pet-btn');
    if (buttons.length >= 2) {
        buttons.forEach(btn => btn.classList.remove('active'));
        if (petType === 'dog') buttons[0].classList.add('active');
        else buttons[1].classList.add('active');
    }
    renderSidebarRooms(petType);
}

function renderSidebarRooms(petType) {
    const sidebarContainer = document.getElementById('room-list-sidebar');
    if (!sidebarContainer || !rooms[petType]) return;

    let htmlContent = '';
    const categories = ['normal', 'premium', 'vip'];
    categories.forEach(roomType => {
        if (rooms[petType][roomType]) {
            rooms[petType][roomType].forEach(room => {
                htmlContent += `
                    <div class="room-sidebar-item" id="sidebar-${room.roomNumber}" onclick="showRoomDetail('${petType}', '${roomType}', '${room.roomNumber}')">
                        <img src="${room.image}" alt="${room.roomName}">
                        <div class="room-sidebar-info">
                            <h4>[${room.roomNumber}] ${room.roomName}</h4>
                            <span>${room.price}</span>
                            <small class="tag-${roomType}">Hạng ${roomType.toUpperCase()}</small>
                        </div>
                    </div>
                `;
            });
        }
    });

    sidebarContainer.innerHTML = htmlContent;

    const firstCat = categories.find(cat => rooms[petType][cat] && rooms[petType][cat].length > 0);
    if (firstCat) {
        const firstRoom = rooms[petType][firstCat][0];
        showRoomDetail(petType, firstCat, firstRoom.roomNumber);
    }
}

function showRoomDetail(petType, roomType, roomNumber) {
    if (!rooms[petType] || !rooms[petType][roomType]) return;
    const room = rooms[petType][roomType].find(r => r.roomNumber === roomNumber);
    if (!room) return;

    document.querySelectorAll('.room-sidebar-item').forEach(item => item.classList.remove('active'));
    const activeItem = document.getElementById(`sidebar-${roomNumber}`);
    if (activeItem) activeItem.classList.add('active');

    const detailContainer = document.getElementById("room-detail-display");
    if (!detailContainer) return;

    detailContainer.innerHTML = `
    <div class="room-detail-box">
        <div class="room-detail-image">
            <img src="${room.image}" alt="${room.roomName}">
        </div>
        <div class="room-detail-info">
            <span class="room-number-badge">${room.roomNumber}</span>
            <h2>${room.roomName}</h2>
            <div class="detail-price">${room.price}</div>
            <p class="detail-description">${room.description}</p>
            <h3>Tiện ích bao gồm:</h3>
            <ul class="detail-features">
                ${room.features.map(feature => `<li>✔ ${feature}</li>`).join("")}
            </ul>
            <button class="book-room-btn" onclick="bookRoom('${petType}','${roomType}','${room.roomNumber}')">
                🐾 Đặt phòng ngay
            </button>
        </div>
    </div>`;
}

function backToRooms() {
    showPage("hotel");
}

// ==========================================
// MULTI-STEP BOOKING
// ==========================================
let globalRoomPriceNum  = 0;
let globalRoomNameStr   = "";
let globalRoomImageStr  = "";
let globalRoomPriceStr  = "";
let globalBookingPetType = "dog";

// Key dùng để lưu tạm thông tin phòng đã chọn vào localStorage,
// vì showPage('booking') điều hướng sang file booking.html (load lại trang
// hoàn toàn) nên mọi biến/global trong bộ nhớ JS hiện tại sẽ bị mất.
// => Phải lưu xuống localStorage rồi đọc lại ở trang booking.html sau khi load xong.
const PENDING_HOTEL_BOOKING_KEY = "pendingHotelBooking";

function bookRoom(petType, roomType, roomNumber) {
    if (!rooms[petType] || !rooms[petType][roomType]) return;
    const room = rooms[petType][roomType].find(r => r.roomNumber === roomNumber);
    if (!room) return;

    // Lưu thông tin phòng đã chọn để trang booking.html (sau khi load lại) đọc ra điền form
    try {
        localStorage.setItem(PENDING_HOTEL_BOOKING_KEY, JSON.stringify({ room, petType, roomType }));
    } catch (e) {
        console.error("Không thể lưu thông tin phòng đã chọn:", e);
    }

    showPage('booking');
}

// Điền thông tin phòng (room, petType, roomType) vào form đặt phòng bước 1
function _applyBookedRoom(room, petType, roomType) {
    // Hiển thị bước 1, ẩn các bước còn lại
    document.getElementById("bookingStep1").style.display = "block";
    document.getElementById("bookingStep2").style.display = "none";
    document.getElementById("bookingStep3").style.display = "none";
    const s4 = document.getElementById("bookingStep4");
    const s5 = document.getElementById("bookingStepSuccess");
    if (s4) s4.style.display = "none";
    if (s5) s5.style.display = "none";

    globalRoomNameStr   = `${room.roomName} (${room.roomNumber})`;
    globalRoomPriceNum  = parseInt(room.price.replace(/[^0-9]/g, '')) || 0;
    globalRoomImageStr  = room.image;
    globalRoomPriceStr  = room.price;
    globalBookingPetType = petType;

    document.getElementById("hotelRoomType").value  = globalRoomNameStr;

    // Cập nhật hbPetType ẩn theo loại phòng
    const petTypeHidden = document.getElementById("hbPetType");
    if (petTypeHidden) petTypeHidden.value = petType;

    // Hiển thị banner phòng đã chọn (roomPreviewBox)
    _updateRoomPreviewBox(room, petType, roomType);

    resetBookingFormState();
    loadPetSelectOptions();
    updateBookingRoomCost();
    updateProgressBar(1);
}

// Khi trang booking.html vừa load lại (do showPage điều hướng bằng window.location.href),
// đọc thông tin phòng đã lưu tạm trong localStorage và điền vào form, sau đó xoá đi.
function _initBookingPageFromStorage() {
    if (document.body.getAttribute("data-page") !== "booking") return;

    let saved = null;
    try {
        saved = JSON.parse(localStorage.getItem(PENDING_HOTEL_BOOKING_KEY) || "null");
    } catch (e) {
        saved = null;
    }
    if (!saved || !saved.room) return;

    _applyBookedRoom(saved.room, saved.petType, saved.roomType);

    // Dùng xong thì xoá để F5 lại trang không tự điền nhầm dữ liệu cũ
    localStorage.removeItem(PENDING_HOTEL_BOOKING_KEY);
}

document.addEventListener("DOMContentLoaded", _initBookingPageFromStorage);

function _updateRoomPreviewBox(room, petType, roomType) {
    const box = document.getElementById("roomPreviewBox");
    if (!box) return;
    box.style.display = "block";

    const img = document.getElementById("roomPreviewImg");
    if (img) img.src = room.image;

    const petBadge = document.getElementById("roomPreviewPetBadge");
    if (petBadge) petBadge.textContent = petType === 'dog' ? '🐕 Chó' : '🐈 Mèo';

    const typeBadge = document.getElementById("roomPreviewTypeBadge");
    if (typeBadge) {
        const typeLabels = { normal: 'Tiêu chuẩn', premium: 'Cao cấp', vip: 'VIP' };
        typeBadge.textContent = typeLabels[roomType] || roomType.toUpperCase();
    }

    const name = document.getElementById("roomPreviewName");
    if (name) name.textContent = room.roomName;

    const number = document.getElementById("roomPreviewNumber");
    if (number) number.textContent = `#${room.roomNumber}`;

    const price = document.getElementById("roomPreviewPrice");
    if (price) price.textContent = room.price;

    const features = document.getElementById("roomPreviewFeatures");
    if (features) {
        features.innerHTML = room.features.slice(0, 3).map(f =>
            `<li style="background:#fff0e6;color:#ff6600;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;">✔ ${f}</li>`
        ).join("");
    }
}

// Xoá sạch dữ liệu form cũ
function resetBookingFormState() {
    hideError();
    clearAllFieldErrors();

    // Bước 1
    ["hbPetName", "hbPetBreed", "hbPetWeight", "hbPhone", "hotelCheckIn", "hotelCheckOut", "hotelNotes"]
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });

    const agree = document.getElementById("hotelAgree");
    if (agree) agree.checked = false;

    // Bước 2
    const noPickupRadio = document.querySelector('input[name="pickupOption"][value="no"]');
    if (noPickupRadio) noPickupRadio.checked = true;
    togglePickupSection(false);

    ["pickupName", "pickupPhone", "pickupAddressDetail", "pickupTime", "pickupNote"]
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    const provinceSelect = document.getElementById("pickupProvince");
    if (provinceSelect) provinceSelect.value = "";
}

function updateBookingRoomCost() {
    const checkInVal  = document.getElementById("hotelCheckIn")?.value;
    const checkOutVal = document.getElementById("hotelCheckOut")?.value;

    const nightsEl = document.getElementById("bookingRoomNights");
    const totalEl  = document.getElementById("bookingRoomTotal");

    if (!checkInVal || !checkOutVal) {
        if (nightsEl) nightsEl.textContent = "0 đêm";
        if (totalEl)  totalEl.textContent  = "0 VNĐ";
        return;
    }

    const d1   = new Date(checkInVal);
    const d2   = new Date(checkOutVal);
    if (d2 <= d1) {
        if (nightsEl) nightsEl.textContent = "0 đêm";
        if (totalEl)  totalEl.textContent  = "0 VNĐ";
        return;
    }

    const days     = Math.max(1, Math.ceil((d2 - d1) / (1000 * 3600 * 24)));
    const roomCost = days * globalRoomPriceNum;
    if (nightsEl) nightsEl.textContent = `${days} đêm`;
    if (totalEl)  totalEl.textContent  = `${roomCost.toLocaleString('vi-VN')} VNĐ`;
}

// ==========================================
// HÀM HỖ TRỢ VALIDATION
// ==========================================

function setFieldError(inputId, message) {
    const inputEl = document.getElementById(inputId);
    const errorEl = document.getElementById("err-" + inputId);

    if (message) {
        if (inputEl) inputEl.classList.add("input-invalid");
        if (errorEl) { errorEl.textContent = message; errorEl.style.display = "block"; }
        return false;
    } else {
        if (inputEl) inputEl.classList.remove("input-invalid");
        if (errorEl) { errorEl.textContent = ""; errorEl.style.display = "none"; }
        return true;
    }
}

function clearAllFieldErrors() {
    document.querySelectorAll(".field-error").forEach(el => {
        el.textContent = "";
        el.style.display = "none";
    });
    document.querySelectorAll(".input-invalid").forEach(el => {
        el.classList.remove("input-invalid");
    });
}

function isValidVNPhone(phone) {
    return /^(0[35789])[0-9]{8}$/.test(phone.trim());
}

function scrollToFirstError() {
    const firstInvalid = document.querySelector(".input-invalid");
    if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        firstInvalid.focus({ preventScroll: true });
    }
}

// ==========================================
// VALIDATE & ĐIỀU HƯỚNG BƯỚC 1
// ==========================================

function validateStep1() {
    clearAllFieldErrors();
    let isValid = true;

    const petName = document.getElementById("hbPetName")?.value.trim();
    if (!petName) isValid = setFieldError("hbPetName", "Vui lòng nhập tên thú cưng.") && isValid;

    const breed = document.getElementById("hbPetBreed")?.value.trim();
    if (!breed) isValid = setFieldError("hbPetBreed", "Vui lòng nhập giống loài.") && isValid;

    const weightRaw = document.getElementById("hbPetWeight")?.value.trim();
    const weightNum = parseFloat(weightRaw);
    if (!weightRaw || isNaN(weightNum)) {
        isValid = setFieldError("hbPetWeight", "Cân nặng phải là số dương (VD: 4.5).") && isValid;
    } else if (weightNum <= 0) {
        isValid = setFieldError("hbPetWeight", "Cân nặng phải lớn hơn 0.") && isValid;
    } else if (weightNum > 100) {
        isValid = setFieldError("hbPetWeight", "Cân nặng không hợp lệ (tối đa 100kg).") && isValid;
    }

    const phone = document.getElementById("hbPhone")?.value.trim();
    if (!phone) {
        isValid = setFieldError("hbPhone", "Vui lòng nhập số điện thoại liên hệ.") && isValid;
    } else if (!isValidVNPhone(phone)) {
        isValid = setFieldError("hbPhone", "Số điện thoại không hợp lệ (10 số, VD: 0912345678).") && isValid;
    }

    const checkInVal  = document.getElementById("hotelCheckIn")?.value;
    const checkOutVal = document.getElementById("hotelCheckOut")?.value;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    if (!checkInVal) {
        isValid = setFieldError("hotelCheckIn", "Vui lòng chọn ngày nhận phòng.") && isValid;
    } else if (new Date(checkInVal) < today) {
        isValid = setFieldError("hotelCheckIn", "Ngày nhận phòng không được là ngày đã qua.") && isValid;
    }

    if (!checkOutVal) {
        isValid = setFieldError("hotelCheckOut", "Vui lòng chọn ngày trả phòng.") && isValid;
    } else if (checkInVal && new Date(checkOutVal) <= new Date(checkInVal)) {
        isValid = setFieldError("hotelCheckOut", "Ngày trả phòng phải sau ngày nhận phòng.") && isValid;
    }

    const agree = document.getElementById("hotelAgree");
    const agreeGroup = document.querySelector(".booking-agree-group");
    if (!agree || !agree.checked) {
        isValid = setFieldError("hotelAgree", "Bạn cần đồng ý với điều khoản để tiếp tục.") && isValid;
        if (agreeGroup) agreeGroup.style.border = "1.5px solid #d32f2f";
    } else {
        if (agreeGroup) agreeGroup.style.border = "1px solid #ffe0cc";
    }

    if (!isValid) {
        showError("Vui lòng kiểm tra lại các trường được đánh dấu đỏ bên dưới.");
        scrollToFirstError();
    } else {
        hideError();
    }
    return isValid;
}

async function goToStep2() {
    if (!validateStep1()) return;

    await savePetToJSON();

    document.getElementById("bookingStep1").style.display = "none";
    document.getElementById("bookingStep2").style.display = "block";
    updateProgressBar(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function savePetToJSON() {
    try {
        const petData = {
            petName:  document.getElementById("hbPetName")?.value.trim()  || "",
            petType:  document.getElementById("hbPetType")?.value         || "dog",
            breed:    document.getElementById("hbPetBreed")?.value.trim() || "",
            weight:   parseFloat(document.getElementById("hbPetWeight")?.value) || 0,
            phone:    document.getElementById("hbPhone")?.value.trim()    || "",
            notes:    document.getElementById("hotelNotes")?.value.trim() || ""
        };

        const response = await fetch("http://localhost:3000/api/pets", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(petData)
        });

        const result = await response.json();
        if (result.success) {
            console.log("Đã lưu thông tin thú cưng thành công!");
        }
    } catch (err) {
        console.warn("Không thể lưu dữ liệu thú cưng (API chưa kết nối):", err.message);
    }
}

function backToStep1() {
    document.getElementById("bookingStep2").style.display = "none";
    document.getElementById("bookingStep1").style.display = "block";
    updateProgressBar(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function togglePickupSection(show) {
    const fields = document.getElementById("pickupFormFields");
    if (fields) fields.style.display = show ? "flex" : "none";
    if (show) {
        if (fields) fields.style.flexDirection = "column";
    }
    ["pickupName", "pickupPhone", "pickupProvince", "pickupAddressDetail", "pickupTime"]
        .forEach(id => setFieldError(id, ""));
}

// ==========================================
// VALIDATE & ĐIỀU HƯỚNG BƯỚC 2
// ==========================================

function validateStep2(isPickup) {
    if (!isPickup) return true;

    clearAllFieldErrors();
    let isValid = true;

    const pName = document.getElementById("pickupName")?.value.trim();
    if (!pName) isValid = setFieldError("pickupName", "Vui lòng nhập tên người liên hệ.") && isValid;

    const pPhone = document.getElementById("pickupPhone")?.value.trim();
    if (!pPhone) {
        isValid = setFieldError("pickupPhone", "Vui lòng nhập số điện thoại.") && isValid;
    } else if (!isValidVNPhone(pPhone)) {
        isValid = setFieldError("pickupPhone", "Số điện thoại không hợp lệ (10 số, VD: 0912345678).") && isValid;
    }

    const pProvince = document.getElementById("pickupProvince")?.value;
    if (!pProvince) isValid = setFieldError("pickupProvince", "Vui lòng chọn tỉnh/thành phố.") && isValid;

    const pAddrDetail = document.getElementById("pickupAddressDetail")?.value.trim();
    if (!pAddrDetail) {
        isValid = setFieldError("pickupAddressDetail", "Vui lòng nhập địa chỉ chi tiết.") && isValid;
    } else if (pAddrDetail.length < 5) {
        isValid = setFieldError("pickupAddressDetail", "Địa chỉ chi tiết quá ngắn, vui lòng nhập đúng địa chỉ.") && isValid;
    }

    const pTime = document.getElementById("pickupTime")?.value;
    if (!pTime) {
        isValid = setFieldError("pickupTime", "Vui lòng chọn thời gian đón mong muốn.") && isValid;
    } else if (new Date(pTime) < new Date()) {
        isValid = setFieldError("pickupTime", "Thời gian đón không được ở quá khứ.") && isValid;
    }

    if (!isValid) {
        showError("Vui lòng kiểm tra lại thông tin đưa đón được đánh dấu đỏ bên dưới.");
        scrollToFirstError();
    } else {
        hideError();
    }
    return isValid;
}

function goToStep3() {
    const isPickup = document.querySelector('input[name="pickupOption"]:checked')?.value === "yes";
    if (!validateStep2(isPickup)) return;

    const checkIn  = document.getElementById("hotelCheckIn")?.value;
    const checkOut = document.getElementById("hotelCheckOut")?.value;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const days = Math.max(1, Math.ceil((d2 - d1) / (1000 * 3600 * 24)));

    const roomCost   = days * globalRoomPriceNum;
    const pickupCost = isPickup ? 50000 : 0;
    const finalTotal = roomCost + pickupCost;

    const costRoomType = document.getElementById("costRoomType");
    if (costRoomType) costRoomType.textContent = globalRoomNameStr;

    const costPPN = document.getElementById("costPricePerNight");
    if (costPPN) costPPN.textContent = globalRoomPriceStr || `${globalRoomPriceNum.toLocaleString('vi-VN')} VNĐ`;

    const costNights = document.getElementById("costNights");
    if (costNights) costNights.textContent = `${days} đêm`;

    const costRoomCost = document.getElementById("costRoomCost");
    if (costRoomCost) costRoomCost.textContent = `${roomCost.toLocaleString('vi-VN')} VNĐ`;

    const costPickupRow = document.getElementById("costPickupRow");
    if (costPickupRow) {
        costPickupRow.innerHTML = isPickup
            ? `<div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:14px;"><span>Phí đón tận nơi:</span><strong>50.000 VNĐ</strong></div>`
            : '';
    }

    const costTotal = document.getElementById("costTotal");
    if (costTotal) costTotal.textContent = `${finalTotal.toLocaleString('vi-VN')} VNĐ`;

    document.getElementById("bookingStep2").style.display = "none";
    document.getElementById("bookingStep3").style.display = "block";
    updateProgressBar(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function backToStep2() {
    document.getElementById("bookingStep3").style.display = "none";
    document.getElementById("bookingStep2").style.display = "block";
    updateProgressBar(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==========================================
// BƯỚC 4: XÁC NHẬN
// ==========================================

function goToStep4() {
    const checkIn  = document.getElementById("hotelCheckIn")?.value;
    const checkOut = document.getElementById("hotelCheckOut")?.value;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const days = Math.max(1, Math.ceil((d2 - d1) / (1000 * 3600 * 24)));
    const isPickup = document.querySelector('input[name="pickupOption"]:checked')?.value === "yes";
    const roomCost   = days * globalRoomPriceNum;
    const pickupCost = isPickup ? 50000 : 0;
    const finalTotal = roomCost + pickupCost;

    const confRoomImg = document.getElementById("confRoomImg");
    if (confRoomImg && globalRoomImageStr) {
        confRoomImg.src = globalRoomImageStr;
        confRoomImg.style.display = "block";
    }

    const el = (id) => document.getElementById(id);
    if (el("confPetName"))   el("confPetName").textContent   = el("hbPetName")?.value  || "-";
    if (el("confPetBreed"))  el("confPetBreed").textContent  = el("hbPetBreed")?.value || "-";
    if (el("confPetWeight")) el("confPetWeight").textContent = el("hbPetWeight")?.value ? `${el("hbPetWeight").value} kg` : "-";

    if (el("confRoomName"))  el("confRoomName").textContent  = globalRoomNameStr;
    if (el("confRoomPrice")) el("confRoomPrice").textContent = globalRoomPriceStr;

    if (el("confCheckIn"))  el("confCheckIn").textContent  = checkIn;
    if (el("confCheckOut")) el("confCheckOut").textContent = checkOut;
    if (el("confNights"))   el("confNights").textContent   = `${days} đêm`;

    if (el("confPickupAddr")) {
        if (isPickup) {
            const province    = el("pickupProvince")?.value || "";
            const addrDetail  = el("pickupAddressDetail")?.value.trim() || "";
            const pName       = el("pickupName")?.value.trim() || "";
            const pPhone      = el("pickupPhone")?.value.trim() || "";
            const pTime       = el("pickupTime")?.value || "";
            el("confPickupAddr").innerHTML =
                `${addrDetail}, ${province}<br>
                 <small>Liên hệ: ${pName} - ${pPhone}</small><br>
                 <small>Thời gian: ${pTime ? new Date(pTime).toLocaleString('vi-VN') : '-'}</small>`;
        } else {
            el("confPickupAddr").textContent = "Không sử dụng";
        }
    }

    if (el("confNotes")) el("confNotes").textContent = el("hotelNotes")?.value || "(Không có)";

    if (el("confRoomCost"))   el("confRoomCost").textContent   = `${roomCost.toLocaleString('vi-VN')} VNĐ`;
    if (el("confPickupCost")) el("confPickupCost").textContent = isPickup ? "50.000 VNĐ" : "0 VNĐ";
    if (el("confTotal"))      el("confTotal").textContent      = `${finalTotal.toLocaleString('vi-VN')} VNĐ`;

    document.getElementById("bookingStep3").style.display = "none";
    document.getElementById("bookingStep4").style.display = "block";
    updateProgressBar(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function backToStep3() {
    document.getElementById("bookingStep4").style.display = "none";
    document.getElementById("bookingStep3").style.display = "block";
    updateProgressBar(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==========================================
// BƯỚC 5: HOÀN TẤT
// ==========================================

function confirmAndCreateBooking() {
    const checkIn  = document.getElementById("hotelCheckIn")?.value;
    const checkOut = document.getElementById("hotelCheckOut")?.value;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const days = Math.max(1, Math.ceil((d2 - d1) / (1000 * 3600 * 24)));
    const isPickup   = document.querySelector('input[name="pickupOption"]:checked')?.value === "yes";
    const roomCost   = days * globalRoomPriceNum;
    const pickupCost = isPickup ? 50000 : 0;
    const finalTotal = roomCost + pickupCost;
    const randomBookingId = "BK" + Math.floor(100000 + Math.random() * 900000);

    const el = (id) => document.getElementById(id);
    if (el("lblNewBookingId"))    el("lblNewBookingId").textContent    = randomBookingId;
    if (el("lblSuccessPetName"))  el("lblSuccessPetName").textContent  = el("hbPetName")?.value || "-";
    if (el("lblSuccessRoom"))     el("lblSuccessRoom").textContent     = globalRoomNameStr;
    if (el("lblSuccessCheckIn"))  el("lblSuccessCheckIn").textContent  = checkIn;
    if (el("lblSuccessCheckOut")) el("lblSuccessCheckOut").textContent = checkOut;
    if (el("lblSuccessTotal"))    el("lblSuccessTotal").textContent    = `${finalTotal.toLocaleString('vi-VN')} VNĐ`;

    document.getElementById("bookingStep4").style.display = "none";
    document.getElementById("bookingStepSuccess").style.display = "block";
    updateProgressBar(5);
    window.scrollTo({ top: 0, behavior: "smooth" });

    saveHotelBookingToPetProfile({
        bookingId: randomBookingId,
        type: "hotel",
        roomName: globalRoomNameStr,
        roomPrice: globalRoomPriceStr,
        petType: globalBookingPetType,
        pet: {
            name: el("hbPetName")?.value.trim() || "",
            breed: el("hbPetBreed")?.value.trim() || "",
            weight: el("hbPetWeight")?.value || ""
        },
        customer: {
            phone: el("hbPhone")?.value.trim() || ""
        },
        checkIn: checkIn,
        checkOut: checkOut,
        nights: days,
        isPickup: isPickup,
        roomCost: roomCost,
        pickupCost: pickupCost,
        totalPrice: finalTotal,
        status: "Booked",
        createdAt: new Date().toISOString()
    });

    resetBookingFormState();
}

// Lưu đơn đặt phòng hotel vào hồ sơ thú cưng (petProfileBookings) để hiển thị
// trong tab "Đặt phòng" của modal Hồ sơ thú cưng, cùng chỗ với các đơn grooming.
function saveHotelBookingToPetProfile(booking) {
    if (typeof window === "undefined") return;
    try {
        const raw = localStorage.getItem("petProfileBookings");
        const bookings = raw ? JSON.parse(raw) : [];
        bookings.push(booking);
        localStorage.setItem("petProfileBookings", JSON.stringify(bookings));
    } catch (error) {
        console.error("Error saving hotel booking to pet profile:", error);
    }
}

// ==========================================
// THANH TIẾN TRÌNH
// ==========================================

function updateProgressBar(currentStep) {
    for (let i = 1; i <= 5; i++) {
        const el = document.getElementById(`progressStep${i}`);
        if (!el) continue;
        el.classList.remove("active", "done");
        if (i < currentStep)        el.classList.add("done");
        else if (i === currentStep) el.classList.add("active");
    }
}

// ==========================================
// ĐIỀU HƯỚNG TRANG
// ==========================================

function showPage(pageId) {
    const allPages = [
        'home-page', 'shop-page', 'hotel-page', 'grooming-page',
        'policy-page', 'blog-page', 'contact-page', 'about-page',
        'room-detail-page', 'viewroom-page', 'booking-page'
    ];
    allPages.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const target = document.getElementById(pageId + '-page');
    if (target) {
        target.style.display = (pageId === 'viewroom') ? 'flex' : 'block';
    }
    window.scrollTo(0, 0);
}

function showError(message) {
    const errorBox = document.getElementById("formError");
    if (!errorBox) return;
    errorBox.innerText = message;
    errorBox.style.display = "block";
    errorBox.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hideError() {
    const errorBox = document.getElementById("formError");
    if (errorBox) errorBox.style.display = "none";
}

// ==========================================
// LIVE VALIDATION (xoá lỗi khi người dùng sửa)
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    // Tải lại tỉnh nếu fetch xong trước DOM
    if (provinces.length > 0) loadProvinceOptions();

    const liveIds = [
        "hbPetName", "hbPetBreed", "hbPetWeight", "hbPhone",
        "hotelCheckIn", "hotelCheckOut", "hotelAgree",
        "pickupName", "pickupPhone", "pickupProvince", "pickupAddressDetail", "pickupTime"
    ];

    liveIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const evt = (el.tagName === "SELECT" || el.type === "checkbox" || el.type === "date" || el.type === "datetime-local")
            ? "change" : "input";
        el.addEventListener(evt, () => {
            setFieldError(id, "");
            if (id === "hotelAgree") {
                const agreeGroup = document.querySelector(".booking-agree-group");
                if (agreeGroup) agreeGroup.style.border = "1px solid #ffe0cc";
            }
        });
    });

    // Cập nhật chi phí khi đổi ngày
    const checkInEl  = document.getElementById("hotelCheckIn");
    const checkOutEl = document.getElementById("hotelCheckOut");
    if (checkInEl)  checkInEl.addEventListener("change",  updateBookingRoomCost);
    if (checkOutEl) checkOutEl.addEventListener("change", updateBookingRoomCost);
});