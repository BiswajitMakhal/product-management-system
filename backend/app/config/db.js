const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const Role = require("../models/Role");
const User = require("../models/User");

const seedInitialData = async () => {
  try {
    const roles = ["Super Admin", "Admin", "User"];
    for (const roleName of roles) {
      await Role.findOneAndUpdate(
        { name: roleName },
        { name: roleName },
        { upsert: true, new: true },
      );
    }

    const superAdminRole = await Role.findOne({ name: "Super Admin" });
    const superAdminExists = await User.findOne({ role: superAdminRole._id });

    if (!superAdminExists) {
      const hashedPassword = await bcryptjs.hash("SuperAdmin@123", 10);
      await User.create({
        name: "System Super Admin",
        email: "superadmin@system.com",
        password: hashedPassword,
        role: superAdminRole._id,
        isActive: true,
      });
      console.log(
        "✅ Default Super Admin seeded -> Email: superadmin@system.com | Pass: SuperAdmin@123",
      );
    }
  } catch (error) {
    console.error("Seeder error:", error.message);
  }
};

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Database connected successfully");
    await seedInitialData();
  } catch (err) {
    console.log("Database connection failed:", err);
  }
};

module.exports = dbConnection;
