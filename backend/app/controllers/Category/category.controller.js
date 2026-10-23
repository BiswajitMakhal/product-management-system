const Category = require("../../models/Category");
const Product = require("../../models/Product");
const mongoose = require("mongoose");

class categoryController {
  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const categoryAgg = await Category.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            type: "category",
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "parentCategory",
            as: "subCategories",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "category",
            as: "products",
          },
        },
        {
          $project: {
            name: 1,
            type: 1,
            createdAt: 1,
            updatedAt: 1,
            productCount: { $size: "$products" },
            subCategories: {
              $map: {
                input: "$subCategories",
                as: "sub",
                in: {
                  _id: "$$sub._id",
                  name: "$$sub.name",
                  type: "$$sub.type",
                },
              },
            },
          },
        },
      ]);

      if (!categoryAgg.length) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: categoryAgg[0],
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getSubCategoryById(req, res) {
    try {
      const { id } = req.params;
      const subCategoryAgg = await Category.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            type: "subcategory",
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "parentCategory",
            foreignField: "_id",
            as: "parentCategoryData",
          },
        },
        { $unwind: "$parentCategoryData" },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "subCategory",
            as: "products",
          },
        },
        {
          $project: {
            name: 1,
            type: 1,
            parentCategory: 1,
            categoryName: "$parentCategoryData.name",
            productCount: { $size: "$products" },
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

      if (!subCategoryAgg.length) {
        return res.status(404).json({
          success: false,
          message: "Subcategory not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: subCategoryAgg[0],
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
  async createCategory(req, res) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category name is required",
        });
      }

      const existing = await Category.findOne({
        name: { $regex: `^${name.trim()}$`, $options: "i" },
        type: "category",
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Category already exists",
        });
      }

      const category = await Category.create({
        name: name.trim(),
        type: "category",
        parentCategory: null,
      });

      return res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async listCategory(req, res) {
    try {
      const categories = await Category.aggregate([
        { $match: { type: "category", parentCategory: null } },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "parentCategory",
            as: "subCategories",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "category",
            as: "products",
          },
        },
        {
          $project: {
            name: 1,
            type: 1,
            createdAt: 1,
            updatedAt: 1,
            productCount: { $size: "$products" },
            subCategories: {
              $map: {
                input: "$subCategories",
                as: "sub",
                in: {
                  _id: "$$sub._id",
                  name: "$$sub.name",
                  type: "$$sub.type",
                },
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      return res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Error fetching categories",
      });
    }
  }

  async categoryUpdate(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category name is required",
        });
      }

      const category = await Category.findOne({ _id: id, type: "category" });
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      const duplicate = await Category.findOne({
        name: { $regex: `^${name.trim()}$`, $options: "i" },
        type: "category",
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Another category with this name already exists",
        });
      }

      category.name = name.trim();
      await category.save();

      return res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: category,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }

      const category = await Category.findOne({ _id: id, type: "category" });
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      const dependentSubCategories = await Category.countDocuments({
        parentCategory: id,
        type: "subcategory",
      });

      if (dependentSubCategories > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category. It has ${dependentSubCategories} dependent subcategory(s). Please delete or reassign them first.`,
        });
      }

      const dependentProducts = await Product.countDocuments({ category: id });
      if (dependentProducts > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category. It has ${dependentProducts} associated product(s).`,
        });
      }

      await Category.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async createSubCategory(req, res) {
    try {
      const { name, parentCategory } = req.body;
      if (!name || !name.trim() || !parentCategory) {
        return res.status(400).json({
          success: false,
          message: "Subcategory name and parentCategory ID are required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(parentCategory)) {
        return res.status(400).json({
          success: false,
          message: "Invalid parentCategory ID",
        });
      }

      const parentDoc = await Category.findById(parentCategory);
      if (!parentDoc) {
        return res.status(404).json({
          success: false,
          message: "Parent category not found",
        });
      }

      if (parentDoc.type !== "category" || parentDoc.parentCategory !== null) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid assignment: A subcategory cannot be assigned under another subcategory",
        });
      }

      const duplicate = await Category.findOne({
        name: { $regex: `^${name.trim()}$`, $options: "i" },
        type: "subcategory",
        parentCategory,
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Subcategory already exists under this category",
        });
      }

      const subCategory = await Category.create({
        name: name.trim(),
        type: "subcategory",
        parentCategory,
      });

      return res.status(201).json({
        success: true,
        message: "Subcategory created successfully",
        data: subCategory,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async listSubCategory(req, res) {
    try {
      const subCategories = await Category.aggregate([
        { $match: { type: "subcategory", parentCategory: { $ne: null } } },
        {
          $lookup: {
            from: "categories",
            localField: "parentCategory",
            foreignField: "_id",
            as: "parentCategoryData",
          },
        },
        { $unwind: "$parentCategoryData" },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "subCategory",
            as: "products",
          },
        },
        {
          $project: {
            name: 1,
            type: 1,
            parentCategory: 1,
            categoryName: "$parentCategoryData.name",
            productCount: { $size: "$products" },
            createdAt: 1,
            updatedAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      return res.status(200).json({
        success: true,
        data: subCategories,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Error fetching subcategories",
      });
    }
  }

  async subCategoryUpdate(req, res) {
    try {
      const { id } = req.params;
      const { name, parentCategory } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subcategory ID",
        });
      }

      const subCategory = await Category.findOne({
        _id: id,
        type: "subcategory",
      });
      if (!subCategory) {
        return res.status(404).json({
          success: false,
          message: "Subcategory not found",
        });
      }

      if (parentCategory) {
        if (!mongoose.Types.ObjectId.isValid(parentCategory)) {
          return res.status(400).json({
            success: false,
            message: "Invalid parentCategory ID",
          });
        }
        const parentDoc = await Category.findById(parentCategory);
        if (!parentDoc) {
          return res.status(404).json({
            success: false,
            message: "Parent category not found",
          });
        }
        if (
          parentDoc.type !== "category" ||
          parentDoc.parentCategory !== null
        ) {
          return res.status(400).json({
            success: false,
            message: "A subcategory cannot be assigned to another subcategory",
          });
        }
        subCategory.parentCategory = parentCategory;
      }

      if (name && name.trim()) {
        subCategory.name = name.trim();
      }

      await subCategory.save();

      return res.status(200).json({
        success: true,
        message: "Subcategory updated successfully",
        data: subCategory,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async deleteSubCategory(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subcategory ID",
        });
      }

      const subCategory = await Category.findOne({
        _id: id,
        type: "subcategory",
      });
      if (!subCategory) {
        return res.status(404).json({
          success: false,
          message: "Subcategory not found",
        });
      }

      const dependentProducts = await Product.countDocuments({
        subCategory: id,
      });
      if (dependentProducts > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete subcategory. It has ${dependentProducts} associated product(s).`,
        });
      }

      await Category.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: "Subcategory deleted successfully",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

module.exports = new categoryController();
