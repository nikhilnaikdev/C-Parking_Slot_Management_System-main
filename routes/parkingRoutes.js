const express = require("express");
const parkingController = require("../controllers/parkingController");
const { requireCustomer, requireAdmin } = require("../config/auth");

const router = express.Router();

router.get("/locations", requireCustomer, parkingController.locations);
router.get("/book", requireCustomer, parkingController.showBookSlot);
router.post("/book", requireCustomer, parkingController.bookSlot);
router.get("/entry", requireAdmin, parkingController.showEntryPage);
router.post("/entry", requireAdmin, parkingController.markEntry);
router.get("/exit", requireAdmin, parkingController.showExitPage);
router.post("/exit", requireAdmin, parkingController.markExit);

module.exports = router;
