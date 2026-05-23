const db = require("../config/db");

async function refreshRemainingSlots(areaName) {
  const [[counts]] = await db.execute(
    "SELECT COUNT(*) AS total_slots, SUM(slot_status = 'available') AS remaining_slots FROM parking_areas WHERE area_name = ?",
    [areaName]
  );
  await db.execute(
    "UPDATE parking_areas SET total_slots = ?, remaining_slots = ? WHERE area_name = ?",
    [counts.total_slots, counts.remaining_slots || 0, areaName]
  );
}

exports.showPayment = async (req, res, next) => {
  try {
    const customerId = req.session.customer.customer_id;
    const bookingId = req.query.booking_id;

    const [rows] = await db.execute(
      "SELECT b.*, r.receipt_id, r.in_time, r.exit_time, r.duration, r.total_amount, p.area_name FROM bookings b JOIN receipts r ON b.booking_id = r.booking_id JOIN parking_areas p ON b.parking_slot_id = p.parking_slot_id WHERE b.booking_id = ? AND b.customer_id = ? AND b.booking_status = 'exited'",
      [bookingId, customerId]
    );

    if (rows.length === 0) {
      req.session.error = "Payment is available only after exit ticket generation.";
      return res.redirect("/booking/history");
    }

    const downloadedBills = req.session.downloadedBills || [];
    if (!downloadedBills.includes(String(bookingId))) {
      req.session.error = "Please download the checkout PDF bill before payment.";
      return res.redirect(`/booking/exit-ticket?id=${bookingId}`);
    }

    res.render("payment", { title: "Payment", payment: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.pay = async (req, res, next) => {
  try {
    const customerId = req.session.customer.customer_id;
    const { booking_id, payment_method } = req.body;

    if (!booking_id || !payment_method) {
      req.session.error = "Payment details are missing.";
      return res.redirect("/booking/history");
    }

    const [rows] = await db.execute(
      "SELECT b.*, r.receipt_id, r.total_amount, p.area_name FROM bookings b JOIN receipts r ON b.booking_id = r.booking_id JOIN parking_areas p ON b.parking_slot_id = p.parking_slot_id WHERE b.booking_id = ? AND b.customer_id = ? AND b.booking_status = 'exited'",
      [booking_id, customerId]
    );

    if (rows.length === 0) {
      req.session.error = "Invalid payment request.";
      return res.redirect("/booking/history");
    }

    const downloadedBills = req.session.downloadedBills || [];
    if (!downloadedBills.includes(String(booking_id))) {
      req.session.error = "Please download the checkout PDF bill before payment.";
      return res.redirect(`/booking/exit-ticket?id=${booking_id}`);
    }

    const booking = rows[0];

    const [transactionResult] = await db.execute(
      "INSERT INTO transactions (customer_id, amount, payment_status, payment_method) VALUES (?, ?, 'Paid', ?)",
      [customerId, booking.total_amount, payment_method]
    );

    await db.execute(
      "UPDATE receipts SET transaction_id = ? WHERE receipt_id = ?",
      [transactionResult.insertId, booking.receipt_id]
    );

    await db.execute(
      "UPDATE parking_areas SET slot_status = 'available', vehicle_reg_no = NULL WHERE parking_slot_id = ?",
      [booking.parking_slot_id]
    );
    await refreshRemainingSlots(booking.area_name);

    await db.execute("UPDATE bookings SET booking_status = 'completed' WHERE booking_id = ?", [booking.booking_id]);

    req.session.success = "Payment completed. Parking slot is now free.";
    res.redirect("/booking/receipts");
  } catch (err) {
    next(err);
  }
};
