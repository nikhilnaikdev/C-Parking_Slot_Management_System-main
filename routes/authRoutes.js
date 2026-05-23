const express = require("express");
const authController = require("../controllers/authController");
const { requireCustomer } = require("../config/auth");

const router = express.Router();

router.get("/signup", authController.showSignup);
router.post("/signup", authController.signup);
router.get("/login", authController.showLogin);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.get("/dashboard", requireCustomer, authController.dashboard);

module.exports = router;
