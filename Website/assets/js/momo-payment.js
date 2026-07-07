(function() {
    const API_BASE = ('http://localhost:3000').replace(/\/$/, '');

    window.MomoPayment = {
        async createPayment(amount, orderInfo, orderId) {
            const res = await fetch(API_BASE + '/api/momo/create-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, orderInfo, orderId })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Lỗi tạo yêu cầu MoMo');
            return { success: true, payUrl: data.payUrl, orderId: data.orderId };
        }
    };
})();
