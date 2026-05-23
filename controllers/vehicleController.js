const db = require("../config/db");

exports.showAddVehicle = (req, res) => {
  res.render("add-vehicle", { title: "Add Vehicle" });
};

exports.addVehicle = async (req, res, next) => {
  try {
    const { vehicle_reg_no, vehicle_make, vehicle_model, vehicle_type } = req.body;
    const customerId = req.session.customer.customer_id;

    if (!vehicle_reg_no || !vehicle_make || !vehicle_model || !vehicle_type) {
      req.session.error = "All vehicle fields are required.";
      return res.redirect("/vehicle/add");
    }

    const regNo = vehicle_reg_no.toUpperCase().trim();
    const [existing] = await db.execute("SELECT vehicle_reg_no FROM vehicles WHERE vehicle_reg_no = ?", [regNo]);
    if (existing.length > 0) {
      req.session.error = "This vehicle is already registered.";
      return res.redirect("/vehicle/add");
    }

    await db.execute(
      "INSERT INTO vehicles (vehicle_reg_no, vehicle_make, vehicle_model, vehicle_type, customer_id) VALUES (?, ?, ?, ?, ?)",
      [regNo, vehicle_make, vehicle_model, vehicle_type, customerId]
    );

    req.session.success = "Vehicle added successfully.";
    res.redirect("/vehicle/list");
  } catch (err) {
    next(err);
  }
};

exports.listVehicles = async (req, res, next) => {
  try {
    const customerId = req.session.customer.customer_id;
    const [vehicles] = await db.execute("SELECT * FROM vehicles WHERE customer_id = ? ORDER BY created_at DESC", [customerId]);
    res.render("vehicle-list", { title: "My Vehicles", vehicles });
  } catch (err) {
    next(err);
  }
};
