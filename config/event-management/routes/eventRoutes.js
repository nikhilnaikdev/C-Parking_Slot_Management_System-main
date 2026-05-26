const express = require("express");
const eventController = require("../controllers/eventController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", eventController.getEvents);
router.get("/:id", eventController.getEvent);
router.post("/", protect, adminOnly, eventController.createEvent);
router.put("/:id", protect, adminOnly, eventController.updateEvent);
router.delete("/:id", protect, adminOnly, eventController.deleteEvent);

module.exports = router;
