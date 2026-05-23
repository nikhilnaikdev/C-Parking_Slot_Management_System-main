const bcrypt = require("bcrypt");
const db = require("../config/db");

exports.showLogin = (req, res) => {
  res.render("admin-login", { title: "Admin Login" });
};

exports.login = async (req, res, next) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const { password } = req.body;

    const [admins] = await db.execute("SELECT * FROM admins WHERE email = ?", [email]);
    if (admins.length === 0) {
      req.session.error = "Invalid admin login.";
      return res.redirect("/admin/login");
    }

    const admin = admins[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      req.session.error = "Invalid admin login.";
      return res.redirect("/admin/login");
    }

    req.session.admin = {
      admin_id: admin.admin_id,
      admin_name: admin.admin_name,
      email: admin.email,
      parking_location: admin.parking_location
    };

    req.session.success = "Admin login successful.";
    res.redirect("/admin/dashboard");
  } catch (err) {
    next(err);
  }
};

exports.dashboard = async (req, res, next) => {
  try {
    const location = req.session.admin.parking_location;
    const [[slots]] = await db.execute(
      "SELECT COUNT(*) AS total, SUM(slot_status = 'available') AS available, SUM(slot_status = 'occupied') AS occupied FROM parking_areas WHERE area_name = ?",
      [location]
    );
    const [[bookings]] = await db.execute(
      "SELECT COUNT(*) AS total FROM bookings b JOIN parking_areas p ON b.parking_slot_id = p.parking_slot_id WHERE p.area_name = ?",
      [location]
    );

    res.render("admin-dashboard", {
      title: "Admin Dashboard",
      stats: {
        total: slots.total || 0,
        available: slots.available || 0,
        occupied: slots.occupied || 0,
        bookings: bookings.total || 0
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.bookings = async (req, res, next) => {
  try {
    const location = req.session.admin.parking_location;
    const [bookings] = await db.execute(
      "SELECT b.*, c.full_name, p.area_name FROM bookings b JOIN customers c ON b.customer_id = c.customer_id JOIN parking_areas p ON b.parking_slot_id = p.parking_slot_id WHERE p.area_name = ? ORDER BY b.booking_time DESC",
      [location]
    );
    res.render("admin-bookings", { title: "Admin Bookings", bookings });
  } catch (err) {
    next(err);
  }
};

exports.transactions = async (req, res, next) => {
  try {
    const location = req.session.admin.parking_location;
    const [transactions] = await db.execute(
      "SELECT t.*, c.full_name, b.ticket_number, p.area_name FROM transactions t JOIN customers c ON t.customer_id = c.customer_id JOIN receipts r ON t.transaction_id = r.transaction_id JOIN bookings b ON r.booking_id = b.booking_id JOIN parking_areas p ON r.parking_slot_id = p.parking_slot_id WHERE p.area_name = ? ORDER BY t.created_at DESC",
      [location]
    );
    res.render("admin-transactions", { title: "Admin Transactions", transactions });
  } catch (err) {
    next(err);
  }
};

exports.bills = async (req, res, next) => {
  try {
    const location = req.session.admin.parking_location;
    const [bills] = await db.execute(
      "SELECT r.receipt_id, r.in_time, r.exit_time, r.duration, r.total_amount, b.ticket_number, b.vehicle_reg_no, b.booking_status, c.full_name, t.payment_status, t.payment_method, t.created_at AS paid_at FROM receipts r JOIN bookings b ON r.booking_id = b.booking_id JOIN customers c ON r.customer_id = c.customer_id JOIN parking_areas p ON r.parking_slot_id = p.parking_slot_id LEFT JOIN transactions t ON r.transaction_id = t.transaction_id WHERE p.area_name = ? AND r.receipt_type = 'exit' ORDER BY r.exit_time DESC",
      [location]
    );

    res.render("admin-bills", { title: "Checkout Bills", bills });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
};
