require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const https = require("https");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, "public")));
const ROOT = path.join(__dirname, "..");

app.use(express.static(ROOT));

const PORT = process.env.PORT || 3000;

// =======================
// MOMO CONFIG
// =======================

const MOMO = {
    partnerCode: process.env.MOMO_PARTNER_CODE || "MOMOBKUN20180529",
    accessKey: process.env.MOMO_ACCESS_KEY || "klm05TvNBzhg7h7j",
    secretKey: process.env.MOMO_SECRET_KEY || "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa",
    endpoint: "https://test-payment.momo.vn/v2/gateway/api/create"
};

// =======================
// SIGNATURE
// =======================

function createSignature(data) {
    const rawSignature =
        `accessKey=${data.accessKey}` +
        `&amount=${data.amount}` +
        `&extraData=${data.extraData}` +
        `&ipnUrl=${data.ipnUrl}` +
        `&orderId=${data.orderId}` +
        `&orderInfo=${data.orderInfo}` +
        `&partnerCode=${data.partnerCode}` +
        `&redirectUrl=${data.redirectUrl}` +
        `&requestId=${data.requestId}` +
        `&requestType=${data.requestType}`;

    return crypto
        .createHmac("sha256", MOMO.secretKey)
        .update(rawSignature)
        .digest("hex");
}

// =======================
// CREATE PAYMENT
// =======================

app.post("/api/momo/create-payment", (req, res) => {

    console.log("BODY:", req.body);

    const { amount, orderInfo, orderId } = req.body;

    if (!amount || !orderId) {
        return res.status(400).json({
            success: false,
            message: "Thiếu amount hoặc orderId"
        });
    }

    const requestId = Date.now().toString();

    const payload = {
        partnerCode: MOMO.partnerCode,
        accessKey: MOMO.accessKey,

        requestId,

        amount: String(amount),

        orderId: String(orderId),

        orderInfo: orderInfo || "Thanh toán Petopia",

        redirectUrl: "http://localhost:3000/index.html",

        ipnUrl: "http://localhost:3000/api/momo/ipn",

        extraData: "",

        requestType: "payWithATM"
    };

    payload.signature = createSignature(payload);

    const body = JSON.stringify(payload);

    const options = {
        hostname: "test-payment.momo.vn",
        port: 443,
        path: "/v2/gateway/api/create",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body)
        }
    };

    const momoReq = https.request(options, momoRes => {

        let response = "";

        momoRes.on("data", chunk => {
            response += chunk;
        });

        momoRes.on("end", () => {

            console.log("========== MOMO RESPONSE ==========");
            console.log(response);

            try {

                const result = JSON.parse(response);

                console.log(result);

                if (result.payUrl) {

                    return res.json({
                        success: true,
                        payUrl: result.payUrl,
                        orderId: result.orderId,
                        momo: result
                    });

                }

                return res.status(400).json({
                    success: false,
                    momo: result
                });

            } catch (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Không parse được response",
                    raw: response
                });

            }

        });

    });

    momoReq.on("error", err => {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    });

    momoReq.write(body);

    momoReq.end();

});

// =======================
// IPN
// =======================

app.post("/api/momo/ipn", (req, res) => {

    console.log("====== IPN ======");

    console.log(req.body);

    res.sendStatus(200);

});

// =======================

app.get("/", (req, res) => {

    res.send("Petopia Server Running");

});

app.get("/api/jobs", (req, res) => {
    try {
        const dbPath = path.join(ROOT, "sbackendpet", "db.json");
        const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
        const jobs = (db.jobs && Array.isArray(db.jobs.jobs)) ? db.jobs.jobs : [];
        res.json({ success: true, jobs });
    } catch (err) {
        console.error("Error reading jobs from db.json:", err);
        res.status(500).json({ success: false, message: "Cannot load jobs" });
    }
});

// =======================

app.listen(PORT, () => {

    console.log(`Server: http://localhost:${PORT}`);

});