const express = require("express");
const paymentController = require("../controllers/paymentController");
const { requireCustomer } = require("../config/auth");

const router = express.Router();

router.get("/", requireCustomer, paymentController.showPayment);
router.post("/", requireCustomer, paymentController.pay);

module.exports = router;
