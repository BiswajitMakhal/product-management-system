const productController = require("../controllers/Product/product.controller");
const authCheck = require("../middleware/authCheck.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const {
  idParamSchema,
  productSchemas,
} = require("../utils/validation.schemas");
const express = require("express");
const Router = express.Router();

Router.use(authCheck);

Router.get(
  "/",
  authorize("Super Admin", "Admin", "User"),
  validate(productSchemas.listQuery, "query"),
  productController.listProducts,
);
Router.get(
  "/:id",
  authorize("Super Admin", "Admin", "User"),
  validate(idParamSchema, "params"),
  productController.getProductById,
);
Router.post(
  "/",
  authorize("Super Admin", "Admin", "User"),
  validate(productSchemas.addProduct),
  productController.addProduct,
);
Router.patch(
  "/:id",
  authorize("Super Admin", "Admin", "User"),
  validate(idParamSchema, "params"),
  validate(productSchemas.updateProduct),
  productController.updateProduct,
);
Router.delete(
  "/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  productController.deleteProduct,
);

module.exports = Router;
