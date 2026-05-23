const bcrypt = require("bcrypt");
const db = require("../config/db");

const admins = [
  ["City Center Admin", "city.admin@parking.com", "City Center Parking - Udupi"],
  ["Manipal Admin", "manipal.admin@parking.com", "Manipal Parking Hub - Manipal"],
  ["Krishna Mall Admin", "krishna.admin@parking.com", "Krishna Mall Parking - Udupi"],
  ["Mangalore Central Admin", "mangalore.admin@parking.com", "Mangalore Central Parking - Mangalore"],
  ["Malpe Beach Admin", "malpe.admin@parking.com", "Malpe Beach Parking - Malpe"]
];

async function resetAdmins() {
  try {
    const hashedPassword = await bcrypt.hash("password", 10);

    for (const [adminName, email, parkingLocation] of admins) {
      await db.execute(
        "INSERT INTO admins (admin_name, email, password, parking_location) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE admin_name = VALUES(admin_name), password = VALUES(password), parking_location = VALUES(parking_location)",
        [adminName, email, hashedPassword, parkingLocation]
      );
    }

    console.log("Admin logins reset successfully.");
    console.log("Password for all admins: password");
    console.log("Emails:");
    admins.forEach((admin) => console.log(`- ${admin[1]} (${admin[2]})`));
    process.exit(0);
  } catch (err) {
    console.log("Admin reset failed.");
    console.log("Error:", err.message);
    process.exit(1);
  }
}

resetAdmins();
