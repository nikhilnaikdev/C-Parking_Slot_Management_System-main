const Booking = require("../models/Booking");
const Event = require("../models/Event");

exports.createBooking = async (req, res, next) => {
  try {
    const { eventId, tickets } = req.body;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const ticketCount = Number(tickets || 1);
    if (ticketCount < 1) {
      return res.status(400).json({ message: "At least one ticket is required" });
    }

    const booking = await Booking.create({
      userId: req.user.id,
      eventId,
      tickets: ticketCount,
      totalPrice: Number(event.price) * ticketCount
    });

    res.status(201).json({
      message: "Booking confirmed",
      booking
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.myBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.byUser(req.user.id);
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    await Booking.cancel(req.params.id, req.user.id);
    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(400);
    next(error);
  }
};
