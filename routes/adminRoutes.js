const express = require("express");
const adminController = require("../controllers/adminController");
const { requireAdmin } = require("../config/auth");

const router = express.Router();

router.get("/login", adminController.showLogin);
router.post("/login", adminController.login);
router.get("/dashboard", requireAdmin, adminController.dashboard);
router.get("/bookings", requireAdmin, adminController.bookings);
router.get("/bills", requireAdmin, adminController.bills);
router.get("/transactions", requireAdmin, adminController.transactions);
router.get("/logout", requireAdmin, adminController.logout);

module.exports = router;
