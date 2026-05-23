const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

async function setupDatabase() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  let connection;

  try {
    // Connect without selecting a database first because schema.sql creates it.
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "Nandan@123",
      multipleStatements: true
    });

    await connection.query(schemaSql);

    console.log("Database setup completed successfully.");
    console.log(`Database name: ${process.env.DB_NAME || "parking"}`);
    console.log("You can now run: npm start");
  } catch (err) {
    console.log("Database setup failed.");
    console.log("Error code:", err.code);
    console.log("Message:", err.message);

    if (err.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("Check DB_USER and DB_PASSWORD in .env.");
    }

    if (err.code === "ECONNREFUSED") {
      console.log("Start MySQL server and try again.");
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
