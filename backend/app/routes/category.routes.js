const categoryController = require("../controllers/Category/category.controller");
const authCheck = require("../middleware/authCheck.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const {
  idParamSchema,
  categorySchemas,
} = require("../utils/validation.schemas");
const express = require("express");
const Router = express.Router();

// Category Routes
Router.get(
  "/category/:id",
  authCheck,
  authorize("Super Admin", "Admin", "User"),
  validate(idParamSchema, "params"),
  categoryController.getCategoryById,
);

Router.get(
  "/subCategory/:id",
  authCheck,
  authorize("Super Admin", "Admin", "User"),
  validate(idParamSchema, "params"),
  categoryController.getSubCategoryById,
);
Router.get(
  "/categories",
  authCheck,
  authorize("Super Admin", "Admin", "User"),
  categoryController.listCategory,
);
Router.post(
  "/category/create",
  authCheck,
  authorize("Super Admin", "Admin", "User"),
  validate(categorySchemas.createCategory),
  categoryController.createCategory,
);
Router.patch(
  "/category/update/:id",
  authCheck,
  authorize("Super Admin", "Admin", "User"),
  validate(idParamSchema, "params"),
  validate(categorySchemas.updateCategory),
  categoryController.categoryUpdate,
);
Router.delete(
  "/category/delete/:id",
  authCheck,
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  categoryController.deleteCategory,
);

// Subcategory Routes
Router.get(
  "/subCategories",
  authCheck,
  authorize("Super Admin", "Admin", "User"),
  categoryController.listSubCategory,
);
Router.post(
  "/subCategory/create",
  authCheck,
  authorize("Super Admin", "Admin", "User"),
  validate(categorySchemas.createSubCategory),
  categoryController.createSubCategory,
);
Router.patch(
  "/subCategory/update/:id",
  authCheck,
  authorize("Super Admin", "Admin", "User"),
  validate(idParamSchema, "params"),
  validate(categorySchemas.updateSubCategory),
  categoryController.subCategoryUpdate,
);
Router.delete(
  "/subCategory/delete/:id",
  authCheck,
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  categoryController.deleteSubCategory,
);

module.exports = Router;
