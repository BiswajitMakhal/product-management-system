const express = require("express");
const Router = express.Router();
const dashboardController = require("../controllers/Dashboard/dashboard.controller");
const authCheck = require("../middleware/authCheck.middleware");
const authorize = require("../middleware/role.middleware");

Router.get(
  "/stats",
  authCheck,
  authorize("Super Admin", "Admin"),
  dashboardController.getDashboardStats,
);

module.exports = Router;
