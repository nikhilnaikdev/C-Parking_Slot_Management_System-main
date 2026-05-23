const express = require("express");
const bookingController = require("../controllers/bookingController");
const { requireCustomer } = require("../config/auth");

const router = express.Router();

router.get("/ticket", requireCustomer, bookingController.ticket);
router.get("/exit-ticket", requireCustomer, bookingController.exitTicket);
router.get("/exit-ticket/pdf", requireCustomer, bookingController.exitTicketPdf);
router.get("/history", requireCustomer, bookingController.history);
router.get("/receipts", requireCustomer, bookingController.receipts);

module.exports = router;
