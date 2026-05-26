const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET || "eventpro_secret");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication token required" });
    }

    const decoded = verifyToken(token);
    if (decoded.role === "admin") {
      req.admin = await Admin.findById(decoded.id);
    } else {
      req.user = await User.findById(decoded.id);
    }

    if (!req.user && !req.admin) {
      return res.status(401).json({ message: "Account no longer exists" });
    }

    req.auth = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.admin || req.auth.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

module.exports = { protect, adminOnly };
