/* =========================================
   CẤU HÌNH DỮ LIỆU & API
   ========================================= */
var PETOPIA_KB = [
  {
    keys: ["giờ mở cửa", "mấy giờ đóng cửa", "mở cửa lúc nào", "thời gian hoạt động", "hoạt động mấy giờ", "mở cửa mấy giờ", "đóng cửa mấy giờ"],
    reply: "Petopia mở cửa từ 08:00 đến 22:00 tất cả các ngày trong tuần nhé! 🐾"
  },
  {
    keys: ["địa chỉ", "ở đâu", "chi nhánh", "cửa hàng", "shop ở đâu", "cửa hàng ở đâu"],
    reply: "Petopia có 3 chi nhánh:\n- Quận 1: 25 Nguyễn Huệ 📞 0901111111\n- Quận 7: 120 Nguyễn Thị Thập 📞 0902222222\n- TP.Thủ Đức: 88 Võ Văn Ngân 📞 0903333333\nMình có thể giúp bạn tìm đường nếu cần nhé!"
  },
  {
    keys: ["số điện thoại", "hotline", "liên hệ", "gọi điện", "gọi cho", "sdt", "số đt"],
    reply: "Bạn có thể liên hệ Petopia qua các số:\n- Quận 1: 0901111111\n- Quận 7: 0902222222\n- TP.Thủ Đức: 0903333333\nHoặc inbox fanpage, mình sẽ chuyển giúp! 📞"
  },
  {
    keys: ["grooming", "cắt tỉa", "tắm", "spa", "làm đẹp", "chải lông", "tắm rửa"],
    reply: "Petopia có đa dạng dịch vụ grooming:\n- Grooming Cơ bản: 200.000đ\n- Grooming Trọn gói: 350.000đ\n- Spa Package: 450.000đ\n- Chăm sóc móng: 120.000đ\n- Grooming cho mèo: 280.000đ\nBạn muốn đặt lịch cho bé nào? Mình hướng dẫn nhé!"
  },
  {
    keys: ["khách sạn", "trông", "lưu trú", " hotel", "phòng nghỉ", "gửi thú cưng", "trông chó", "trông mèo", "board", "trông cu"],
    reply: "Petopia có Pet Hotel với nhiều hạng phòng:\n- Phòng thường: 200.000đ - 270.000đ/đêm\n- Premium: 350.000đ - 450.000đ/đêm\n- VIP: 600.000đ - 800.000đ/đêm\nPhòng có camera 24/7, cho ăn 2 bữa/ngày. Bạn cho mình biết loại thú cưng và nhu cầu để tư vấn chính xác hơn nhé! 🐶🐱"
  },
  {
    keys: ["đặt lịch", "booking", "hẹn lịch", "lịch hẹn", "đặt chỗ", "đặt lịch grooming"],
    reply: "Bạn có thể đặt lịch trực tiếp trên website mục Grooming/Booking, hoặc gọi hotline chi nhánh gần nhất. Mình khuyên nên đặt trước 1-2 ngày để có slot ưng ý nhé! ✨"
  },
  {
    keys: ["giao hàng", "vận chuyển", "ship", "freeship", "phí ship", "giao tận nhà", "ship cod"],
    reply: "Petopia giao hàng toàn quốc:\n- Nội thành HCM: 30.000đ (đơn từ 500.000đ freeship)\n- Các tỉnh khác: 50.000đ\n- Giao nhanh 2-4h nội thành\nMình có thể theo dõi đơn hàng qua website nếu bạn đã có account nhé!"
  },
  {
    keys: ["thanh toán", "momo", "cod", "thẻ", "transfer", "chuyển khoản", "trả tiền", "qr"],
    reply: "Bạn có thể thanh toán:\n- Tiền mặt khi nhận hàng (COD)\n- Momo QR\n- Chuyển khoản ngân hàng\nMọi hình thức đều an toàn và có hóa đơn đầy đủ nhé!"
  },
  {
    keys: ["đổi trả", "bảo hành", "lỗi", "hàng lỗi", "đổi hàng", "trả lại", "hoàn tiền"],
    reply: "Chính sách đổi trả 7 ngày nếu:\n- Hàng lỗi sản xuất\n- Sai sản phẩm\n- Hàng hư hỏng do vận chuyển\nGiữ nguyên bao bì, còn tem mác. Liên hệ hotline để được hướng dẫn cụ thể!"
  },
  {
    keys: ["nuôi", "chăm sóc", "ăn gì", "cho ăn", "dinh dưỡng", "tắm", "tiêm", "bệnh", "ốm", "sức khỏe"],
    reply: "Mình có thể tư vấn kiến thức chăm sóc cơ bản nha! Với câu hỏi về bệnh lý cụ thể, bạn nên đưa bé đến cơ sở Petopia gần nhất để bác sĩ thú y khám trực tiếp, kết quả sẽ chính xác hơn rất nhiều đấy! 🏥"
  },
  {
    keys: ["giá", "bao nhiêu", "tiền", "rẻ", "giảm giá", "khuyến mãi", "sale", "ưu đãi"],
    reply: "Giá dịch vụ và sản phẩm Petopia rất cạnh tranh nha! Bạn có thể xem chi tiết trên từng trang dịch vụ của website, hoặc cho mình biết bạn quan tâm món gì để mình tư vấn cụ thể! 💰"
  },
  {
    keys: ["đăng ký", "tài khoản", "account", "tạo tài khoản", "đăng ký thành viên"],
    reply: "Bạn có thể đăng ký tài khoản Petopia bằng email hoặc đăng nhập nhanh bằng Google/Facebook để nhận nhiều ưu đãi thành viên nhé! 🎉"
  },
  {
    keys: ["chó", "cún", "dog"],
    reply: "Petopia yêu thương tất cả các bé chó! Bạn cần tư vấn đồ chơi, thức ăn, grooming hay khách sạn cho chó? Mình sẵn sàng giúp! 🐕"
  },
  {
    keys: ["mèo", "cat", "miêu"],
    reply: "Petopia cũng phục vụ các bé mèo yêu! Mình có thể tư vấn về thức ăn mèo, dịch vụ grooming mèo hay phòng khách sạn dành riêng cho mèo đó nha! 🐱"
  }
];

var FALLBACK_REPLY = 'Dạ, Petopia đã nhận được tin nhắn của bạn! 📩\nVấn đề này cần tư vấn trực tiếp để hỗ trợ tốt nhất.\nĐội ngũ nhân viên sẽ liên hệ lại ngay qua:\n📞 0909 123 456 (Zalo/Gọi)\n🌐 petopia.vn ❤️';

// ↓↓↓ THAY KEY CỦA BẠN VÀO ĐÂY ↓↓↓
var GEMINI_API_KEY = ''; 
// Sử dụng model gemini-1.5-flash tốc độ cao
var GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY;

/* =========================================
   HÀM TIỆN ÍCH
   ========================================= */
// Hàm chuẩn hóa chuỗi để so sánh (tránh lỗi ReferenceError)
function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase().trim();
}

function getTimeString() {
    var now = new Date();
    var h = now.getHours();
    var m = now.getMinutes();
    return h + ':' + (m < 10 ? '0' + m : m);
}

/* =========================================
   XỬ LÝ DỮ LIỆU & KẾT NỐI API
   ========================================= */
// Tải dữ liệu JSON làm ngữ cảnh (context) cho AI
let PETOPIA_CONTEXT = ''; 
async function loadPetopiaData() {
    var base = 'assets/dataset/';
    if (window.location.pathname.indexOf('/admin/') !== -1 || window.location.pathname.indexOf('/pages/') !== -1) {
        base = '../assets/dataset/';
    }
    
    try {
        // 1. Load store info
        try {
            const storeRes = await fetch(base + 'store.json');
            if (storeRes.ok) {
                const storeData = await storeRes.json();
                const stores = (storeData.stores || []).map(s => 
                    `- ${s.name}: ${s.address}, ${s.openTime}, ${s.phone}. Dịch vụ: ${(s.services || []).join(', ')}`
                ).join('\n');
                PETOPIA_CONTEXT += '\n[THÔNG TIN CỬA HÀNG]\n' + stores;
            }
        } catch (e) { console.warn('Lỗi load store:', e); }
        
        // 2. Load grooming services
        try {
            const groomRes = await fetch(base + 'grooming-services.json');
            if (groomRes.ok) {
                const groomData = await groomRes.json();
                const services = (groomData || []).map(s => 
                    `- ${s.name}: ${s.basePrice ? s.basePrice.toLocaleString('vi-VN') + 'đ' : 'Liên hệ'} - ${s.description || ''}`
                ).join('\n');
                PETOPIA_CONTEXT += '\n[DỊCH VỤ GROOMING]\n' + services;
            }
        } catch (e) { console.warn('Lỗi load grooming:', e); }
        
        // 3. Load hotel rooms
        try {
            const hotelRes = await fetch(base + 'hotel.json');
            if (hotelRes.ok) {
                const hotelData = await hotelRes.json();
                let hotelText = '';
                ['dog', 'cat'].forEach(type => {
                    const typeName = type === 'dog' ? 'Chó' : 'Mèo';
                    if (hotelData[type]) {
                        ['normal', 'premium', 'vip'].forEach(grade => {
                            if (hotelData[type][grade]) {
                                hotelText += `\n[PHÒNG ${typeName} - ${grade.toUpperCase()}]\n`;
                                hotelData[type][grade].forEach(r => {
                                    hotelText += `- ${r.roomName} (${r.roomNumber}): ${r.price} - ${r.description || ''}. Tiện ích: ${(r.features || []).join(', ')}\n`;
                                });
                            }
                        });
                    }
                });
                PETOPIA_CONTEXT += '\n[PET HOTEL]\n' + hotelText;
            }
        } catch (e) { console.warn('Lỗi load hotel:', e); }
        
        // 4. Load products from XML
        try {
            const xmlRes = await fetch(base + 'product.xml');
            if (xmlRes.ok) {
                const xmlText = await xmlRes.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, "text/xml");
                const products = xmlDoc.getElementsByTagName("product");
                let productList = [];
                const maxProducts = Math.min(products.length, 120);
                for (let i = 0; i < maxProducts; i++) {
                    const name = products[i].getElementsByTagName("name")[0]?.textContent;
                    const brand = products[i].getElementsByTagName("brand")[0]?.textContent;
                    const price = products[i].getElementsByTagName("price")[0]?.textContent;
                    const category = products[i].getElementsByTagName("category")[0]?.textContent;
                    if (name) {
                        productList.push(`- ${brand ? brand + ' | ' : ''}${name}: ${price || 'Liên hệ'} (${category || 'Sản phẩm'})`);
                    }
                }
                PETOPIA_CONTEXT += '\n[SẢN PHẨM]\n' + productList.join('\n');
            }
        } catch (e) { console.warn('Lỗi load product XML:', e); }
        
        console.log("PETOPIA_CONTEXT đã load xong, độ dài:", PETOPIA_CONTEXT.length);
    } catch (e) {
        console.error('Lỗi tổng loadPetopiaData:', e);
    }
}

// Gọi API Gemini
async function callGeminiAPI(prompt) {
    // 1. Nâng cấp System Prompt với cấu trúc rõ ràng
    const systemPrompt = `Bạn là nhân viên chăm sóc khách hàng nhiệt tình, đáng yêu của Petopia Pet Shop.
Xưng hô: "mình" và "bạn". Giọng điệu: Thân thiện, chuyên nghiệp, ngắn gọn (dưới 100 chữ nếu có thể).

[QUY TẮC QUAN TRỌNG]
1. Ưu tiên sử dụng thông tin trong [DỮ LIỆU CỬA HÀNG] để trả lời về giá cả, dịch vụ, chính sách, địa chỉ, giờ mở cửa.
2. Nếu câu hỏi về giá/khuyến mãi KHÔNG có trong [DỮ LIỆU CỬA HÀNG], tuyệt đối KHÔNG tự bịa ra. Hãy xin lỗi và mời khách liên hệ hotline hoặc đến trực tiếp.
3. Nếu khách hỏi kiến thức chăm sóc thú cưng chung chung, hãy tư vấn nhiệt tình dựa trên kiến thức chung.
4. Nếu khách hỏi vấn đề không liên quan đến thú cưng hoặc cửa hàng, hãy từ chối khéo léo.
5. Nếu khách hỏi về thông tin đã có trong [DỮ LIỆU CỬA HÀNG], hãy trả lời chính xác chi tiết.

${window.PETOPIA_CONTEXT || 'Hiện chưa có dữ liệu cụ thể về cửa hàng.'}`;

    try {
        const res = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [{
                    role: 'user',
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    topK: 40,
                    topP: 0.95
                }
            })
        });
        
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        return json.candidates?.[0]?.content?.parts?.[0]?.text || FALLBACK_REPLY;
    } catch (e) {
        console.error('Gemini API error:', e);
        return null;
    }
}

// Lấy phản hồi từ Bot
async function getBotReply(text) {
    const t = normalizeText(text);
    
    // 1. Tìm trong Knowledge Base cục bộ trước
    if (PETOPIA_KB && PETOPIA_KB.length > 0) {
        for (var i = 0; i < PETOPIA_KB.length; i++) {
            var item = PETOPIA_KB[i];
            for (var j = 0; j < item.keys.length; j++) {
                if (t.includes(normalizeText(item.keys[j]))) return item.reply;
            }
        }
    }
    
    // 2. Chặn nếu chưa khai báo API Key
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'ĐIỀN_API_KEY_CỦA_BẠN_VÀO_ĐÂY' || GEMINI_API_KEY === '') {
        console.warn('Thiếu API Key Gemini!');
        return FALLBACK_REPLY;
    }
    
    // 3. Nếu không có sẵn, hỏi Gemini AI
    const aiReply = await callGeminiAPI(text);
    return aiReply || FALLBACK_REPLY;
}

// Khởi chạy load data khi trang web đã sẵn sàng
document.addEventListener('DOMContentLoaded', loadPetopiaData);

/* =========================================
   GIAO DIỆN & TƯƠNG TÁC NGƯỜI DÙNG (DOM)
   ========================================= */
var chatFab      = document.getElementById('chatFab');
var chatWindow   = document.getElementById('chatWindow');
var chatClose    = document.getElementById('chatClose');
var chatInput    = document.getElementById('chatInput');
var chatSend     = document.getElementById('chatSend');
var chatMessages = document.getElementById('chatMessages');
var quickBtns    = document.getElementById('quickBtns');
var chatBadge    = document.getElementById('chatBadge');

var chatOpened = false;

// Đóng / Mở Chat
function openChat() {
    if (!chatWindow) return;
    chatWindow.classList.add('show');
    if (chatFab)   chatFab.classList.add('open');
    if (chatBadge) chatBadge.classList.remove('show');
    if (chatInput) setTimeout(function () { chatInput.focus(); }, 300);

    if (!chatOpened) {
        chatOpened = true;
        setTimeout(function () {
            appendBotMsg('Xin chào! 👋 Mình là trợ lý Petopia, sẵn sàng giải đáp về dịch vụ, giá cả và đặt lịch cho bạn nhé!', false);
        }, 350);
    }
}

function closeChat() {
    if (!chatWindow) return;
    chatWindow.classList.remove('show');
    if (chatFab) chatFab.classList.remove('open');
}

if (chatFab)   chatFab.addEventListener('click', function () {
    chatWindow && chatWindow.classList.contains('show') ? closeChat() : openChat();
});
if (chatClose) chatClose.addEventListener('click', closeChat);

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeChat();
});

// Render Tin nhắn người dùng
function appendUserMsg(text) {
    if (!chatMessages) return;
    var row = document.createElement('div');
    row.className = 'msg msg--user';
    
    var body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.style.alignItems = 'flex-end';
    
    var bubble = document.createElement('div');
    bubble.className = 'msg__bubble';
    bubble.textContent = text;
    bubble.style.whiteSpace = 'pre-line';
    
    var time = document.createElement('span');
    time.className = 'msg__time';
    time.textContent = getTimeString();
    
    body.appendChild(bubble);
    body.appendChild(time);
    row.appendChild(body);
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Render Tin nhắn Bot (hỗ trợ stream gõ chữ)
function appendBotMsg(text, stream) {
    if (!chatMessages) return;
    var row = document.createElement('div');
    row.className = 'msg msg--bot';
    
    var avatar = document.createElement('div');
    avatar.className = 'msg__avatar';
    avatar.textContent = '🐾';
    
    var body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    
    var bubble = document.createElement('div');
    bubble.className = 'msg__bubble';
    bubble.style.whiteSpace = 'pre-line';
    
    var time = document.createElement('span');
    time.className = 'msg__time';
    time.textContent = getTimeString();
    
    body.appendChild(bubble);
    body.appendChild(time);
    row.appendChild(avatar);
    row.appendChild(body);
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (stream) {
        typeText(bubble, text);
    } else {
        bubble.textContent = text;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    return bubble;
}

// Hiệu ứng giả lập gõ chữ mượt mà
async function typeText(element, text) {
    for (var i = 0; i < text.length; i++) {
        element.textContent += text[i];
        chatMessages.scrollTop = chatMessages.scrollHeight;
        await new Promise(function(r) { 
            setTimeout(r, 10 + Math.random() * 15); 
        });
    }
}

// Hiệu ứng "Đang nhập..."
function showTyping() {
    if (!chatMessages) return null;
    var div = document.createElement('div');
    div.className = 'typing-indicator';
    div.id = 'typingDot';
    div.innerHTML = '<span>.</span><span>.</span><span>.</span>'; 
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return div;
}

// Kích hoạt khi bấm gửi
async function handleSendMessage() {
    if (!chatInput || !chatMessages) return;
    var text = chatInput.value.trim();
    if (!text) return;

    appendUserMsg(text);
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (quickBtns) quickBtns.style.display = 'none';

    var dot = showTyping();
    
    try {
        var reply = await getBotReply(text);
        
        await new Promise(function(r) { setTimeout(r, 400 + Math.random() * 300); });
        
        if (dot) dot.remove();
        appendBotMsg(reply, true);
    } catch (e) {
        if (dot) dot.remove();
        appendBotMsg(FALLBACK_REPLY, true);
    }
}

// Lắng nghe nút Gửi và phím Enter
if (chatSend)  chatSend.addEventListener('click', handleSendMessage);
if (chatInput) chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') handleSendMessage();
});

// Các nút trả lời nhanh (Quick Buttons)
document.querySelectorAll('.quick-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        if (!chatInput) return;
        chatInput.value = btn.getAttribute('data-q');
        handleSendMessage();
    });
});
