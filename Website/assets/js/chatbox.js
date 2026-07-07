/* =========================================
   CẤU HÌNH DỮ LIỆU & API
   ========================================= */
var PETOPIA_KB = [];

var FALLBACK_REPLY = 'Dạ, Petopia đã nhận được tin nhắn của bạn! 📩\nVấn đề này cần tư vấn trực tiếp để hỗ trợ tốt nhất.\nĐội ngũ nhân viên sẽ liên hệ lại ngay qua:\n📞 0909 123 456 (Zalo/Gọi)\n🌐 petopia.vn ❤️';

// ↓↓↓ THAY KEY CỦA BẠN VÀO ĐÂY ↓↓↓

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
    const src = 'assets/dataset/product.xml';
    try {
        const res = await fetch(src);
        const xmlText = await res.text();
        
        // Chuyển XML thành DOM để dễ đọc
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        // Trích xuất thông tin quan trọng (Ví dụ: tên sản phẩm và giá)
        // Giả sử file XML của bạn có cấu trúc <product><name>...</name><price>...</price></product>
        let items = [];
        const products = xmlDoc.getElementsByTagName("product");
        
        for (let i = 0; i < products.length; i++) {
            const name = products[i].getElementsByTagName("name")[0]?.textContent;
            const price = products[i].getElementsByTagName("price")[0]?.textContent;
            items.push(`${name} - Giá: ${price}`);
        }

        window.PETOPIA_CONTEXT = items.join('\n');
        console.log("Dữ liệu đã trích xuất:", window.PETOPIA_CONTEXT);
    } catch (e) {
        console.error('Lỗi đọc XML:', e);
    }
}

// Gọi API Gemini
async function callGeminiAPI(prompt) {
    await PETOPIA_CONTEXT; 
    console.log(PETOPIA_CONTEXT)
    // 1. Nâng cấp System Prompt với cấu trúc rõ ràng
    const systemPrompt = `Bạn là nhân viên chăm sóc khách hàng nhiệt tình, đáng yêu của Petopia Pet Shop.
Xưng hô: "mình" và "bạn". Giọng điệu: Thân thiện, chuyên nghiệp, ngắn gọn (dưới 100 chữ nếu có thể).

[QUY TẮC QUAN TRỌNG]
1. Ưu tiên sử dụng thông tin trong [DỮ LIỆU CỬA HÀNG] để trả lời về giá cả, dịch vụ, chính sách.
2. Nếu câu hỏi về giá/khuyến mãi KHÔNG có trong [DỮ LIỆU CỬA HÀNG], tuyệt đối KHÔNG tự bịa ra. Hãy xin lỗi và mời khách liên hệ hotline hoặc đến trực tiếp.
3. Nếu khách hỏi kiến thức chăm sóc thú cưng chung chung, hãy tư vấn nhiệt tình dựa trên kiến thức chung.
4. Nếu khách hỏi vấn đề không liên quan đến thú cưng hoặc cửa hàng, hãy từ chối khéo léo.

[DỮ LIỆU CỬA HÀNG]
${window.PETOPIA_CONTEXT || 'Hiện chưa có dữ liệu cụ thể về sản phẩm.'}`;

    try {
        const res = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // Đưa system prompt vào đúng trường systemInstruction của API
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [{
                    role: 'user',
                    parts: [{ text: prompt }] // Chỉ chứa câu hỏi của khách ở đây
                }],
                // Thêm generationConfig để tinh chỉnh AI
                generationConfig: {
                    temperature: 0.3, // Nhiệt độ thấp (0.1 - 0.3) giúp AI trả lời chính xác, ít "ảo giác", rất hợp cho CSKH
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
            // Tốc độ gõ chữ, bạn có thể chỉnh thông số ở đây
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
    // Đảm bảo bạn có style CSS cho class này nhé
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

    // Gắn tin người dùng
    appendUserMsg(text);
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Tắt / Bật quick buttons tùy ý bạn (đang ẩn)
    if (quickBtns) quickBtns.style.display = 'none';

    // Hiện "Đang nhập..."
    var dot = showTyping();
    
    try {
        var reply = await getBotReply(text);
        
        // Thời gian chờ trễ một chút để giống người thật
        await new Promise(function(r) { setTimeout(r, 400 + Math.random() * 300); });
        
        // Xóa "Đang nhập..." và in câu trả lời với stream
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