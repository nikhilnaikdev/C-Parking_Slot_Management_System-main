const db = require("../config/db");

class User {
  static async create({ name, email, passwordHash, phone }) {
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)",
      [name, email, passwordHash, phone || null]
    );
    return this.findById(result.insertId);
  }

  static async findByEmail(email) {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute(
      "SELECT id, name, email, phone, created_at FROM users WHERE id = ?",
      [id]
    );
    return rows[0];
  }

  static async all() {
    const [rows] = await db.execute(
      "SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC"
    );
    return rows;
  }
}

module.exports = User;
