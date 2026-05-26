const db = require("../config/db");
const User = require("../models/User");
const Booking = require("../models/Booking");

exports.stats = async (req, res, next) => {
  try {
    const [[userCount]] = await db.execute("SELECT COUNT(*) AS total FROM users");
    const [[eventCount]] = await db.execute("SELECT COUNT(*) AS total FROM events");
    const [[bookingCount]] = await db.execute("SELECT COUNT(*) AS total FROM bookings");
    const [[revenue]] = await db.execute(
      "SELECT COALESCE(SUM(total_price), 0) AS total FROM bookings WHERE status = 'confirmed'"
    );

    res.json({
      users: userCount.total,
      events: eventCount.total,
      bookings: bookingCount.total,
      revenue: revenue.total
    });
  } catch (error) {
    next(error);
  }
};

exports.users = async (req, res, next) => {
  try {
    res.json(await User.all());
  } catch (error) {
    next(error);
  }
};

exports.bookings = async (req, res, next) => {
  try {
    res.json(await Booking.all());
  } catch (error) {
    next(error);
  }
};
