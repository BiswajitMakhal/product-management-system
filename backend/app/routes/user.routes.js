const express = require("express");
const Router = express.Router();
const userController = require("../controllers/User/user.controller");
const authCheck = require("../middleware/authCheck.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { idParamSchema, userSchemas } = require("../utils/validation.schemas");

Router.use(authCheck, authorize("Super Admin", "Admin"));

Router.post("/", validate(userSchemas.createUser), userController.createUser);
Router.get("/", userController.listUsers);
Router.get(
  "/",
  validate(userSchemas.listUsersQuery, "query"),
  userController.listUsers,
);
Router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(userSchemas.updateUser),
  userController.updateUser,
);
Router.patch(
  "/:id/status",
  validate(idParamSchema, "params"),
  validate(userSchemas.toggleStatus),
  userController.toggleUserStatus,
);
Router.delete(
  "/:id",
  validate(idParamSchema, "params"),
  userController.deleteUser,
);

module.exports = Router;
