const express = require("express");
const bookingController = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, bookingController.createBooking);
router.get("/mine", protect, bookingController.myBookings);
router.patch("/:id/cancel", protect, bookingController.cancelBooking);

module.exports = router;
