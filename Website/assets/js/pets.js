const express = require("express");
const router = express.Router();

// Lưu tạm trong RAM, giống collection "pets" bên MongoDB thật sau này
let pets = [];
let petCounter = 1;

/**
 * POST /api/pets
 * Được gọi từ hotel.js (savePetToMongoDB) mỗi khi khách qua Bước 2.
 */
router.post("/", (req, res) => {
  try {
    const data = req.body;

    const newPet = {
      _id: "pet_demo_" + petCounter++,
      ownerId: data.ownerId || null,
      petName: data.petName || "Thú cưng ẩn danh",
      petType: data.petType || "dog",
      breed: data.breed || "Không rõ",
      weight: data.weight || 0,
      phone: data.phone || "",
      notes: data.notes || "",
      createdAt: new Date().toISOString(),
    };

    pets.push(newPet);

    return res.json({ success: true, pet: newPet });
  } catch (err) {
    console.error("Lỗi lưu pet:", err);
    return res.status(500).json({ success: false, message: "Lỗi server khi lưu thú cưng." });
  }
});

/**
 * GET /api/pets (tiện debug)
 */
router.get("/", (req, res) => {
  return res.json({ success: true, pets });
});

module.exports = router;
