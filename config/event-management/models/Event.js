const db = require("../config/db");

class Event {
  static async all({ search, category, featured, limit } = {}) {
    const values = [];
    let sql = "SELECT * FROM events WHERE 1 = 1";

    if (search) {
      sql += " AND (title LIKE ? OR venue LIKE ? OR location LIKE ? OR category LIKE ?)";
      const term = `%${search}%`;
      values.push(term, term, term, term);
    }

    if (category && category !== "all") {
      sql += " AND category = ?";
      values.push(category);
    }

    if (featured) {
      sql += " AND is_featured = 1";
    }

    sql += " ORDER BY event_date ASC";

    if (limit) {
      sql += " LIMIT ?";
      values.push(Number(limit));
    }

    const [rows] = await db.execute(sql, values);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute("SELECT * FROM events WHERE id = ?", [id]);
    return rows[0];
  }

  static async create(data) {
    const [result] = await db.execute(
      `INSERT INTO events
       (title, description, category, image_url, venue, location, event_date, event_time, price, total_seats, available_seats, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.description,
        data.category,
        data.image_url,
        data.venue,
        data.location,
        data.event_date,
        data.event_time,
        data.price,
        data.total_seats,
        data.available_seats ?? data.total_seats,
        data.is_featured ? 1 : 0
      ]
    );
    return this.findById(result.insertId);
  }

  static async update(id, data) {
    await db.execute(
      `UPDATE events SET title = ?, description = ?, category = ?, image_url = ?, venue = ?,
       location = ?, event_date = ?, event_time = ?, price = ?, total_seats = ?,
       available_seats = ?, is_featured = ? WHERE id = ?`,
      [
        data.title,
        data.description,
        data.category,
        data.image_url,
        data.venue,
        data.location,
        data.event_date,
        data.event_time,
        data.price,
        data.total_seats,
        data.available_seats,
        data.is_featured ? 1 : 0,
        id
      ]
    );
    return this.findById(id);
  }

  static async remove(id) {
    const [result] = await db.execute("DELETE FROM events WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Event;
