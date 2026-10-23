const authController = require("../controllers/Auth/auth.controller");
const authCheck = require("../middleware/authCheck.middleware");
const validate = require("../middleware/validate.middleware");
const { authSchemas } = require("../utils/validation.schemas");
const rateLimit = require("express-rate-limit");
const express = require("express");
const Router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: "Too many attempts, try again later",
  },
});

Router.post(
  "/register",
  authLimiter,
  validate(authSchemas.register),
  authController.register,
);
Router.post(
  "/login",
  authLimiter,
  validate(authSchemas.login),
  authController.login,
);
Router.post("/refresh-token", authLimiter, authController.handleRefreshToken);
Router.post("/logout", authController.logout);

// Password management routes
Router.post(
  "/change-password",
  authCheck,
  validate(authSchemas.changePassword),
  authController.changePassword,
);
Router.post(
  "/forgot-password",
  authLimiter,
  validate(authSchemas.forgotPassword),
  authController.forgotPassword,
);
Router.post(
  "/reset-password/:token",
  authLimiter,
  validate(authSchemas.resetPassword),
  authController.resetPassword,
);

module.exports = Router;
