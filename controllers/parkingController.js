const db = require("../config/db");

function createTicketNumber() {
  return `TKT-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
}

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

exports.locations = async (req, res, next) => {
  try {
    const [locations] = await db.execute(
      "SELECT area_name, MAX(total_slots) AS total_slots, SUM(slot_status = 'available') AS available_slots, SUM(slot_status = 'occupied') AS occupied_slots FROM parking_areas GROUP BY area_name ORDER BY area_name"
    );
    res.render("parking-locations", { title: "Parking Locations", locations });
  } catch (err) {
    next(err);
  }
};

exports.showBookSlot = async (req, res, next) => {
  try {
    const customerId = req.session.customer.customer_id;
    const areaName = req.query.area;

    const [vehicles] = await db.execute("SELECT * FROM vehicles WHERE customer_id = ?", [customerId]);
    const [areas] = await db.execute("SELECT DISTINCT area_name FROM parking_areas ORDER BY area_name");

    let slots = [];
    if (areaName) {
      [slots] = await db.execute(
        "SELECT parking_slot_id, area_name FROM parking_areas WHERE area_name = ? AND slot_status = 'available' ORDER BY parking_slot_id",
        [areaName]
      );
    }

    res.render("slot-booking", {
      title: "Book Slot",
      vehicles,
      areas,
      slots,
      selectedArea: areaName || ""
    });
  } catch (err) {
    next(err);
  }
};

exports.bookSlot = async (req, res, next) => {
  try {
    const customerId = req.session.customer.customer_id;
    const { vehicle_reg_no, parking_slot_id } = req.body;

    if (!vehicle_reg_no || !parking_slot_id) {
      req.session.error = "Please choose a vehicle and available slot.";
      return res.redirect("/parking/book");
    }

    const [active] = await db.execute(
      "SELECT booking_id FROM bookings WHERE customer_id = ? AND booking_status IN ('booked', 'entered', 'exited')",
      [customerId]
    );
    if (active.length > 0) {
      req.session.error = "You already have an active booking. Complete payment before booking another slot.";
      return res.redirect("/booking/history");
    }

    const [ownedVehicles] = await db.execute(
      "SELECT vehicle_reg_no FROM vehicles WHERE vehicle_reg_no = ? AND customer_id = ?",
      [vehicle_reg_no, customerId]
    );
    if (ownedVehicles.length === 0) {
      req.session.error = "Selected vehicle does not belong to your account.";
      return res.redirect("/parking/book");
    }

    const [slots] = await db.execute(
      "SELECT * FROM parking_areas WHERE parking_slot_id = ? AND slot_status = 'available'",
      [parking_slot_id]
    );
    if (slots.length === 0) {
      req.session.error = "Parking Full or selected slot is already booked.";
      return res.redirect("/parking/locations");
    }

    const slot = slots[0];
    if (slot.remaining_slots <= 0) {
      req.session.error = "Parking Full.";
      return res.redirect("/parking/locations");
    }

    await db.execute(
      "UPDATE parking_areas SET slot_status = 'occupied', vehicle_reg_no = ? WHERE parking_slot_id = ? AND slot_status = 'available'",
      [vehicle_reg_no, parking_slot_id]
    );

    await refreshRemainingSlots(slot.area_name);

    const ticketNumber = createTicketNumber();
    const [result] = await db.execute(
      "INSERT INTO bookings (customer_id, vehicle_reg_no, parking_slot_id, booking_status, ticket_number, entry_status) VALUES (?, ?, ?, 'booked', ?, 'pending')",
      [customerId, vehicle_reg_no, parking_slot_id, ticketNumber]
    );

    req.session.success = "Slot booked successfully. Show this ticket at entry.";
    res.redirect(`/booking/ticket?id=${result.insertId}`);
  } catch (err) {
    next(err);
  }
};

exports.showEntryPage = (req, res) => {
  res.render("parking-entry", { title: "Verify Entry" });
};

exports.markEntry = async (req, res, next) => {
  try {
    const { ticket_number } = req.body;
    const location = req.session.admin.parking_location;

    if (!ticket_number) {
      req.session.error = "Ticket number is required.";
      return res.redirect("/parking/entry");
    }

    const [bookings] = await db.execute(
      "SELECT b.* FROM bookings b JOIN parking_areas p ON b.parking_slot_id = p.parking_slot_id WHERE b.ticket_number = ? AND b.booking_status = 'booked' AND p.area_name = ?",
      [ticket_number, location]
    );
    if (bookings.length === 0) {
      req.session.error = "Invalid ticket, wrong location, or vehicle already entered.";
      return res.redirect("/parking/entry");
    }

    const booking = bookings[0];
    await db.execute(
      "UPDATE bookings SET entry_status = 'entered', booking_status = 'entered' WHERE booking_id = ?",
      [booking.booking_id]
    );

    await db.execute(
      "INSERT INTO receipts (customer_id, booking_id, parking_slot_id, in_time, receipt_type, total_amount) VALUES (?, ?, ?, NOW(), 'entry', 0)",
      [booking.customer_id, booking.booking_id, booking.parking_slot_id]
    );

    req.session.success = "Entry approved successfully.";
    res.redirect("/admin/bookings");
  } catch (err) {
    next(err);
  }
};

exports.showExitPage = (req, res) => {
  res.render("parking-exit", { title: "Verify Exit" });
};

exports.markExit = async (req, res, next) => {
  try {
    const { ticket_number } = req.body;
    const location = req.session.admin.parking_location;

    if (!ticket_number) {
      req.session.error = "Ticket number is required.";
      return res.redirect("/parking/exit");
    }

    const [bookings] = await db.execute(
      "SELECT b.*, v.vehicle_type, p.area_name FROM bookings b JOIN vehicles v ON b.vehicle_reg_no = v.vehicle_reg_no JOIN parking_areas p ON b.parking_slot_id = p.parking_slot_id WHERE b.ticket_number = ? AND b.booking_status = 'entered' AND p.area_name = ?",
      [ticket_number, location]
    );
    if (bookings.length === 0) {
      req.session.error = "Only entered vehicles from your location can checkout.";
      return res.redirect("/parking/exit");
    }

    const booking = bookings[0];
    const [receipts] = await db.execute(
      "SELECT * FROM receipts WHERE booking_id = ? AND receipt_type = 'entry' ORDER BY receipt_id DESC LIMIT 1",
      [booking.booking_id]
    );
    if (receipts.length === 0) {
      req.session.error = "Entry receipt not found. Contact admin.";
      return res.redirect("/parking/exit");
    }

    const inTime = new Date(receipts[0].in_time);
    const exitTime = new Date();
    const hours = Math.max(1, Math.ceil((exitTime - inTime) / (1000 * 60 * 60)));
    const rates = { Bike: 20, Car: 50, Truck: 100 };
    const amount = hours * (rates[booking.vehicle_type] || 50);

    await db.execute(
      "UPDATE receipts SET exit_time = NOW(), duration = ?, total_amount = ?, receipt_type = 'exit' WHERE receipt_id = ?",
      [`${hours} hour(s)`, amount, receipts[0].receipt_id]
    );

    await db.execute("UPDATE bookings SET booking_status = 'exited' WHERE booking_id = ?", [booking.booking_id]);

    req.session.success = "Exit approved and bill generated. Customer can now download the bill and pay.";
    res.redirect("/admin/bills");
  } catch (err) {
    next(err);
  }
};
