const express = require("express");
const adminController = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, adminOnly);
router.get("/stats", adminController.stats);
router.get("/users", adminController.users);
router.get("/bookings", adminController.bookings);

module.exports = router;
