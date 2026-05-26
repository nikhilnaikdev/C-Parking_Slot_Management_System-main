const db = require("../config/db");

class Booking {
  static async create({ userId, eventId, tickets, totalPrice }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [events] = await connection.execute(
        "SELECT available_seats FROM events WHERE id = ? FOR UPDATE",
        [eventId]
      );

      if (!events[0]) {
        throw new Error("Event not found");
      }

      if (events[0].available_seats < tickets) {
        throw new Error("Not enough seats available");
      }

      const confirmationCode = `EVP-${Date.now().toString(36).toUpperCase()}`;
      const [result] = await connection.execute(
        `INSERT INTO bookings (user_id, event_id, tickets, total_price, confirmation_code)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, eventId, tickets, totalPrice, confirmationCode]
      );

      await connection.execute(
        "UPDATE events SET available_seats = available_seats - ? WHERE id = ?",
        [tickets, eventId]
      );

      await connection.commit();
      return this.findById(result.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT b.*, e.title, e.image_url, e.venue, e.location, e.event_date, e.event_time
       FROM bookings b JOIN events e ON b.event_id = e.id WHERE b.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async byUser(userId) {
    const [rows] = await db.execute(
      `SELECT b.*, e.title, e.image_url, e.venue, e.location, e.event_date, e.event_time
       FROM bookings b JOIN events e ON b.event_id = e.id
       WHERE b.user_id = ? ORDER BY b.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async all() {
    const [rows] = await db.execute(
      `SELECT b.*, u.name AS user_name, u.email AS user_email, e.title AS event_title
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN events e ON b.event_id = e.id
       ORDER BY b.created_at DESC`
    );
    return rows;
  }

  static async cancel(id, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [rows] = await connection.execute(
        "SELECT * FROM bookings WHERE id = ? AND user_id = ? FOR UPDATE",
        [id, userId]
      );
      const booking = rows[0];

      if (!booking) {
        throw new Error("Booking not found");
      }

      if (booking.status === "cancelled") {
        throw new Error("Booking is already cancelled");
      }

      await connection.execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [id]);
      await connection.execute(
        "UPDATE events SET available_seats = available_seats + ? WHERE id = ?",
        [booking.tickets, booking.event_id]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Booking;
