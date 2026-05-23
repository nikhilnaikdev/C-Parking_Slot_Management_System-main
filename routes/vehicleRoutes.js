const express = require("express");
const vehicleController = require("../controllers/vehicleController");
const { requireCustomer } = require("../config/auth");

const router = express.Router();

router.get("/add", requireCustomer, vehicleController.showAddVehicle);
router.post("/add", requireCustomer, vehicleController.addVehicle);
router.get("/list", requireCustomer, vehicleController.listVehicles);

module.exports = router;
