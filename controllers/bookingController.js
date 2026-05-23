const db = require("../config/db");

function pdfText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildSimplePdf(lines) {
  const objects = [];
  const pageText = lines
    .map((line, index) => `BT /F1 ${index === 0 ? 20 : 12} Tf 50 ${760 - index * 28} Td (${pdfText(line)}) Tj ET`)
    .join("\n");

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push(`<< /Length ${Buffer.byteLength(pageText)} >>\nstream\n${pageText}\nendstream`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "binary");
}

function getHourlyRate(vehicleType) {
  const rates = { Bike: 20, Car: 50, Truck: 100 };
  return rates[vehicleType] || 50;
}

function addBillDetails(ticket) {
  if (!ticket) {
    return null;
  }

  const billedHours = Math.max(1, parseInt(ticket.duration, 10) || 1);
  const ratePerHour = getHourlyRate(ticket.vehicle_type);

  return {
    ...ticket,
    billed_hours: billedHours,
    rate_per_hour: ratePerHour,
    calculated_amount: billedHours * ratePerHour
  };
}

async function getExitTicket(customerId, bookingId) {
  const [rows] = await db.execute(
    "SELECT b.booking_id, b.ticket_number, b.vehicle_reg_no, b.booking_status, c.full_name, v.vehicle_type, p.area_name, p.parking_slot_id, r.receipt_id, r.in_time, r.exit_time, r.duration, r.total_amount, t.payment_status FROM bookings b JOIN customers c ON b.customer_id = c.customer_id JOIN vehicles v ON b.vehicle_reg_no = v.vehicle_reg_no JOIN parking_areas p ON b.parking_slot_id = p.parking_slot_id JOIN receipts r ON b.booking_id = r.booking_id LEFT JOIN transactions t ON r.transaction_id = t.transaction_id WHERE b.booking_id = ? AND b.customer_id = ? AND r.receipt_type = 'exit'",
    [bookingId, customerId]
  );

  return addBillDetails(rows[0]);
}

exports.ticket = async (req, res, next) => {
  try {
    const customerId = req.session.customer.customer_id;
    const bookingId = req.query.id;

    const [rows] = await db.execute(
      "SELECT b.*, c.full_name, p.area_name FROM bookings b JOIN customers c ON b.customer_id = c.customer_id JOIN parking_areas p ON b.parking_slot_id = p.parking_slot_id WHERE b.booking_id = ? AND b.customer_id = ?",
      [bookingId, customerId]
    );

    if (rows.length === 0) {
      req.session.error = "Booking ticket not found.";
      return res.redirect("/booking/history");
    }

    res.render("booking-ticket", { title: "Booking Ticket", booking: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.history = async (req, res, next) => {
  try {
    const customerId = req.session.customer.customer_id;
    const [bookings] = await db.execute(
      "SELECT b.*, p.area_name, r.total_amount, r.receipt_type FROM bookings b JOIN parking_areas p ON b.parking_slot_id = p.parking_slot_id LEFT JOIN receipts r ON b.booking_id = r.booking_id WHERE b.customer_id = ? ORDER BY b.booking_time DESC",
      [customerId]
    );
    res.render("booking-history", { title: "Booking History", bookings });
  } catch (err) {
    next(err);
  }
};

exports.receipts = async (req, res, next) => {
  try {
    const customerId = req.session.customer.customer_id;
    const [receipts] = await db.execute(
      "SELECT r.*, b.ticket_number, p.area_name, t.payment_status, t.payment_method FROM receipts r JOIN bookings b ON r.booking_id = b.booking_id JOIN parking_areas p ON r.parking_slot_id = p.parking_slot_id LEFT JOIN transactions t ON r.transaction_id = t.transaction_id WHERE r.customer_id = ? ORDER BY r.created_at DESC",
      [customerId]
    );
    res.render("receipts", { title: "Receipts", receipts });
  } catch (err) {
    next(err);
  }
};

exports.exitTicket = async (req, res, next) => {
  try {
    const customerId = req.session.customer.customer_id;
    const bookingId = req.query.id;
    const ticket = await getExitTicket(customerId, bookingId);

    if (!ticket) {
      req.session.error = "Exit bill not found. Please checkout first.";
      return res.redirect("/booking/history");
    }

    res.render("exit-ticket", { title: "Exit Bill", ticket });
  } catch (err) {
    next(err);
  }
};

exports.exitTicketPdf = async (req, res, next) => {
  try {
    const customerId = req.session.customer.customer_id;
    const bookingId = req.query.id;
    const ticket = await getExitTicket(customerId, bookingId);

    if (!ticket) {
      req.session.error = "Exit bill not found. Please checkout first.";
      return res.redirect("/booking/history");
    }

    const lines = [
      "Smart Parking Exit Bill",
      `Ticket Number: ${ticket.ticket_number}`,
      `Customer Name: ${ticket.full_name}`,
      `Vehicle Number: ${ticket.vehicle_reg_no}`,
      `Vehicle Type: ${ticket.vehicle_type}`,
      `Parking Location: ${ticket.area_name}`,
      `Slot ID: ${ticket.parking_slot_id}`,
      `Entry Time: ${new Date(ticket.in_time).toLocaleString()}`,
      `Checkout Time: ${new Date(ticket.exit_time).toLocaleString()}`,
      `Billed Hours: ${ticket.billed_hours}`,
      `Rate Per Hour: Rs. ${ticket.rate_per_hour}`,
      `Calculation: ${ticket.billed_hours} x ${ticket.rate_per_hour} = Rs. ${ticket.calculated_amount}`,
      `Total Amount: Rs. ${ticket.total_amount}`,
      `Payment Status: ${ticket.payment_status || "Pending"}`,
      "",
      "Please show this PDF bill while paying the parking fee."
    ];

    const pdfBuffer = buildSimplePdf(lines);

    if (!req.session.downloadedBills) {
      req.session.downloadedBills = [];
    }

    if (!req.session.downloadedBills.includes(String(ticket.booking_id))) {
      req.session.downloadedBills.push(String(ticket.booking_id));
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="exit-bill-${ticket.ticket_number}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};
