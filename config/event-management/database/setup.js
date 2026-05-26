require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

async function setup() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true
  });

  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await connection.query(schema);
  await connection.changeUser({ database: process.env.DB_NAME || "eventpro_db" });

  const adminPassword = await bcrypt.hash("admin123", 12);
  await connection.execute(
    `INSERT INTO admins (name, email, password)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    ["EventPro Admin", "admin@eventpro.com", adminPassword]
  );

  const events = [
    [
      "Founder Summit 2026",
      "A premium conference for startup builders, investors, and operators with live panels and curated networking.",
      "Business",
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
      "Grand Meridian Hall",
      "Bengaluru",
      "2026-06-18",
      "10:00:00",
      2499,
      300,
      300,
      1
    ],
    [
      "Noir Music Fest",
      "An immersive black-and-gold live music experience featuring indie, electronic, and fusion artists.",
      "Music",
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80",
      "Skyline Arena",
      "Mumbai",
      "2026-07-04",
      "18:30:00",
      1799,
      800,
      800,
      1
    ],
    [
      "Design After Dark",
      "A hands-on creative workshop for UI designers, brand strategists, and product teams.",
      "Workshop",
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
      "Atelier One",
      "Delhi",
      "2026-06-29",
      "14:00:00",
      999,
      120,
      120,
      1
    ],
    [
      "Tech Leaders Night",
      "A focused evening of demos, fireside chats, and networking for engineering leaders.",
      "Technology",
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
      "Orbit Convention Center",
      "Hyderabad",
      "2026-08-12",
      "17:00:00",
      1499,
      220,
      220,
      0
    ]
  ];

  for (const event of events) {
    await connection.execute(
      `INSERT INTO events
       (title, description, category, image_url, venue, location, event_date, event_time, price, total_seats, available_seats, is_featured)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
       WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = ?)`,
      [...event, event[0]]
    );
  }

  await connection.end();
  console.log("EventPro database is ready.");
  console.log("Admin login: admin@eventpro.com / admin123");
}

setup().catch((error) => {
  console.error("Database setup failed:", error.message);
  process.exit(1);
});
