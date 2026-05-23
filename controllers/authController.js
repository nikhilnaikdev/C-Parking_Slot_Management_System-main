const bcrypt = require("bcrypt");
const db = require("../config/db");

// =====================
// SHOW SIGNUP PAGE
// =====================
exports.showSignup = (req, res) => {
  res.render("signup", {
    title: "Customer Signup"
  });
};

// =====================
// CUSTOMER SIGNUP
// =====================
exports.signup = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      address,
      mobile_no
    } = req.body;

    // Validation
    if (!full_name || !email || !password || !address || !mobile_no) {
      req.session.error = "All fields are required.";
      return res.redirect("/signup");
    }

    // Check existing email
    const [existing] = await db.execute(
      "SELECT customer_id FROM customers WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      req.session.error = "Email already registered.";
      return res.redirect("/signup");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert customer
    const [result] = await db.execute(
      `INSERT INTO customers 
      (full_name, email, password, address, mobile_no) 
      VALUES (?, ?, ?, ?, ?)`,
      [
        full_name,
        email,
        hashedPassword,
        address,
        mobile_no
      ]
    );

    // Create session
    req.session.customer = {
      customer_id: result.insertId,
      full_name,
      email
    };

    req.session.success = "Signup successful.";

    // Redirect dashboard
    return res.redirect("/dashboard");

  } catch (err) {
    console.error("Signup Error:", err);

    req.session.error = err.message;

    return res.redirect("/signup");
  }
};

// =====================
// SHOW LOGIN PAGE
// =====================
exports.showLogin = (req, res) => {
  res.render("login", {
    title: "Customer Login"
  });
};

// =====================
// CUSTOMER LOGIN
// =====================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      req.session.error = "Email and password required.";
      return res.redirect("/login");
    }

    // Find customer
    const [customers] = await db.execute(
      "SELECT * FROM customers WHERE email = ?",
      [email]
    );

    if (customers.length === 0) {
      req.session.error = "Invalid email or password.";
      return res.redirect("/login");
    }

    const customer = customers[0];

    // Compare password
    const isMatch = await bcrypt.compare(
      password,
      customer.password
    );

    if (!isMatch) {
      req.session.error = "Invalid email or password.";
      return res.redirect("/login");
    }

    // Session
    req.session.customer = {
      customer_id: customer.customer_id,
      full_name: customer.full_name,
      email: customer.email
    };

    req.session.success = "Login successful.";

    return res.redirect("/dashboard");

  } catch (err) {
    console.error("Login Error:", err);

    req.session.error = err.message;

    return res.redirect("/login");
  }
};

// =====================
// CUSTOMER DASHBOARD
// =====================
exports.dashboard = async (req, res) => {
  try {

    // Check login
    if (!req.session.customer) {
      return res.redirect("/login");
    }

    const customerId = req.session.customer.customer_id;

    // Vehicle count
    const [[vehicleCount]] = await db.execute(
      "SELECT COUNT(*) AS total FROM vehicles WHERE customer_id = ?",
      [customerId]
    );

    // Booking count
    const [[bookingCount]] = await db.execute(
      "SELECT COUNT(*) AS total FROM bookings WHERE customer_id = ?",
      [customerId]
    );

    // Payments count
    const [[paymentCount]] = await db.execute(
      "SELECT COUNT(*) AS total FROM payments"
    );

    res.render("customer-dashboard", {
      title: "Customer Dashboard",
      stats: {
        vehicles: vehicleCount.total,
        bookings: bookingCount.total,
        payments: paymentCount.total
      },
      customer: req.session.customer
    });

  } catch (err) {
    console.error("Dashboard Error:", err);

    req.session.error = err.message;

    return res.redirect("/");
  }
};

// =====================
// LOGOUT
// =====================
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};