const db = require("../config/db");

async function testDatabase() {
  try {
    const [columns] = await db.execute("DESCRIBE customers");
    const columnNames = columns.map((column) => column.Field);
    const requiredColumns = ["customer_id", "full_name", "email", "password", "address", "mobile_no", "created_at"];
    const missingColumns = requiredColumns.filter((column) => !columnNames.includes(column));

    if (missingColumns.length > 0) {
      console.log("Database connected, but customers table has the wrong structure.");
      console.log("Missing columns:", missingColumns.join(", "));
      console.log("Fix: Run database/schema.sql to recreate the correct project tables.");
      process.exit(1);
    }

    const [rows] = await db.execute("SELECT COUNT(*) AS total_customers FROM customers");
    console.log("Database connected successfully.");
    console.log("Customers table found with correct columns.");
    console.log("Total customers:", rows[0].total_customers);
    process.exit(0);
  } catch (err) {
    console.log("Database check failed.");
    console.log("Error code:", err.code);
    console.log("Message:", err.message);

    if (err.code === "ER_BAD_DB_ERROR" || err.code === "ER_NO_SUCH_TABLE") {
      console.log("Fix: Run database/schema.sql in MySQL, then try again.");
    }

    if (err.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("Fix: Check DB_USER and DB_PASSWORD in .env.");
    }

    if (err.code === "ECONNREFUSED") {
      console.log("Fix: Start MySQL server.");
    }

    process.exit(1);
  }
}

testDatabase();
