const Joi = require("joi");

// Reusable 24-character hex MongoDB ObjectId validator
const objectIdRule = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({
    "string.pattern.base": "Invalid MongoDB ObjectId format",
  });

// Params ID Schema
const idParamSchema = Joi.object({
  id: objectIdRule.required().messages({
    "any.required": "ID parameter is required",
  }),
});

// Auth Validation Schemas
const authSchemas = {
  register: Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().trim().email().lowercase().required(),
    password: Joi.string().min(6).max(32).required(),
  }),

  login: Joi.object({
    email: Joi.string().trim().email().lowercase().required(),
    password: Joi.string().required(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
      .min(6)
      .max(32)
      .invalid(Joi.ref("currentPassword"))
      .required()
      .messages({
        "any.invalid": "New password cannot be the same as current password",
      }),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().trim().email().lowercase().required(),
  }),

  resetPassword: Joi.object({
    newPassword: Joi.string().min(6).max(32).required(),
  }),
};

//User Management Schemas (Super Admin & Admin)
const userSchemas = {
  listUsersQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().allow("").optional(),
    role: Joi.string().valid("Super Admin", "Admin", "User").optional(),
  }),
  createUser: Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().trim().email().lowercase().required(),
    roleName: Joi.string().valid("Admin", "User").default("User"),
  }),

  updateUser: Joi.object({
    name: Joi.string().trim().min(2).max(50).optional(),
    email: Joi.string().trim().email().lowercase().optional(),
    roleName: Joi.string().valid("Admin", "User").optional(),
  })
    .min(1)
    .messages({
      "object.min":
        "Provide at least one field (name, email, or roleName) to update",
    }),

  toggleStatus: Joi.object({
    isActive: Joi.boolean().optional(),
  }),
};

// Category & Subcategory Schemas
const categorySchemas = {
  createCategory: Joi.object({
    name: Joi.string().trim().min(2).max(60).required(),
  }),

  updateCategory: Joi.object({
    name: Joi.string().trim().min(2).max(60).required(),
  }),

  createSubCategory: Joi.object({
    name: Joi.string().trim().min(2).max(60).required(),
    parentCategory: objectIdRule.required().messages({
      "string.pattern.base": "Invalid parentCategory ID format",
    }),
  }),

  updateSubCategory: Joi.object({
    name: Joi.string().trim().min(2).max(60).optional(),
    parentCategory: objectIdRule.optional().messages({
      "string.pattern.base": "Invalid parentCategory ID format",
    }),
  })
    .min(1)
    .messages({
      "object.min": "Provide at least name or parentCategory to update",
    }),
};

// Product Schemas
const productSchemas = {
  addProduct: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    description: Joi.string().trim().min(5).max(1000).required(),
    price: Joi.number().positive().precision(2).required().messages({
      "number.positive": "Price must be greater than 0",
    }),
    category: objectIdRule.required().messages({
      "string.pattern.base": "Invalid category ID format",
    }),
    subCategory: objectIdRule.required().messages({
      "string.pattern.base": "Invalid subCategory ID format",
    }),
  }),

  updateProduct: Joi.object({
    name: Joi.string().trim().min(2).max(120).optional(),
    description: Joi.string().trim().min(5).max(1000).optional(),
    price: Joi.number().positive().precision(2).optional().messages({
      "number.positive": "Price must be greater than 0",
    }),
    category: objectIdRule.optional().messages({
      "string.pattern.base": "Invalid category ID format",
    }),
    subCategory: objectIdRule.optional().messages({
      "string.pattern.base": "Invalid subCategory ID format",
    }),
  })
    .min(1)
    .messages({
      "object.min": "Provide at least one field to update the product",
    }),

  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().allow("").optional(),
    category: objectIdRule.optional(),
    subcategory: objectIdRule.optional(),
    subCategory: objectIdRule.optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    sort: Joi.string()
      .valid("name", "price", "createdAt", "updatedAt")
      .default("createdAt"),
    order: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

module.exports = {
  idParamSchema,
  authSchemas,
  userSchemas,
  categorySchemas,
  productSchemas,
};
