const Product = require("../../models/Product");
const Category = require("../../models/Category");
const mongoose = require("mongoose");

class productController {
  //(Pagination, Search, Filtering, Sorting & $lookup)
  async listProducts(req, res) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.max(1, Number(req.query.limit) || 10);
      const skip = (page - 1) * limit;
      const search = req.query.search || "";
      const category = req.query.category;
      const subcategory = req.query.subcategory || req.query.subCategory;
      const minPrice = req.query.minPrice;
      const maxPrice = req.query.maxPrice;
      const sortField = req.query.sort || "createdAt";
      const sortOrder = req.query.order === "asc" ? 1 : -1;

      const matchStage = {};

      if (search) {
        matchStage.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      if (category) {
        if (!mongoose.Types.ObjectId.isValid(category)) {
          return res.status(400).json({
            success: false,
            message: "Invalid category ID",
          });
        }
        matchStage.category = new mongoose.Types.ObjectId(category);
      }

      if (subcategory) {
        if (!mongoose.Types.ObjectId.isValid(subcategory)) {
          return res.status(400).json({
            success: false,
            message: "Invalid subcategory ID",
          });
        }
        matchStage.subCategory = new mongoose.Types.ObjectId(subcategory);
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        matchStage.price = {};
        if (minPrice !== undefined) matchStage.price.$gte = Number(minPrice);
        if (maxPrice !== undefined) matchStage.price.$lte = Number(maxPrice);
      }

      const result = await Product.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryData",
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "subCategory",
            foreignField: "_id",
            as: "subcategoryData",
          },
        },
        {
          $unwind: {
            path: "$categoryData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$subcategoryData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: 1,
            description: 1,
            price: 1,
            category: 1,
            subCategory: 1,
            categoryName: "$categoryData.name",
            subcategoryName: "$subcategoryData.name",
            createdAt: 1,
            updatedAt: 1,
          },
        },
        {
          $sort: {
            [sortField]: sortOrder,
          },
        },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            totalCount: [{ $count: "count" }],
          },
        },
      ]);

      const products = result[0]?.data || [];
      const totalProducts = result[0]?.totalCount[0]?.count || 0;

      return res.status(200).json({
        success: true,
        data: products,
        pagination: {
          total: totalProducts,
          page,
          limit,
          totalPages: Math.ceil(totalProducts / limit),
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getProductById(req, res) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      const productAgg = await Product.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryData",
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "subCategory",
            foreignField: "_id",
            as: "subcategoryData",
          },
        },
        {
          $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: true },
        },
        {
          $unwind: {
            path: "$subcategoryData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: 1,
            description: 1,
            price: 1,
            category: 1,
            subCategory: 1,
            categoryName: "$categoryData.name",
            subcategoryName: "$subcategoryData.name",
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

      if (!productAgg.length) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: productAgg[0],
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async addProduct(req, res) {
    try {
      const { name, description, price, category, subCategory } = req.body;
      if (
        !name ||
        !description ||
        price === undefined ||
        !category ||
        !subCategory
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All fields (name, description, price, category, subCategory) are required",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(category) ||
        !mongoose.Types.ObjectId.isValid(subCategory)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid category or subcategory ID",
        });
      }

      if (Number(price) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be greater than 0",
        });
      }

      const categoryExist = await Category.findOne({
        _id: category,
        type: "category",
      });
      if (!categoryExist) {
        return res.status(404).json({
          success: false,
          message: "Valid parent category not found",
        });
      }

      const subcategoryExist = await Category.findOne({
        _id: subCategory,
        type: "subcategory",
        parentCategory: category,
      });
      if (!subcategoryExist) {
        return res.status(400).json({
          success: false,
          message:
            "Selected subcategory does not belong to the selected category",
        });
      }

      const existProduct = await Product.findOne({
        name: { $regex: `^${name.trim()}$`, $options: "i" },
      });
      if (existProduct) {
        return res.status(409).json({
          success: false,
          message: "Product with this name already exists",
        });
      }

      const product = await Product.create({
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        subCategory,
      });

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { name, description, price, category, subCategory } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const targetCategory = category || product.category;
      const targetSubCategory = subCategory || product.subCategory;

      if (category || subCategory) {
        if (
          !mongoose.Types.ObjectId.isValid(targetCategory) ||
          !mongoose.Types.ObjectId.isValid(targetSubCategory)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid category or subcategory ID",
          });
        }

        const validCat = await Category.findOne({
          _id: targetCategory,
          type: "category",
        });
        if (!validCat) {
          return res.status(404).json({
            success: false,
            message: "Valid category not found",
          });
        }

        const validSubCat = await Category.findOne({
          _id: targetSubCategory,
          type: "subcategory",
          parentCategory: targetCategory,
        });
        if (!validSubCat) {
          return res.status(400).json({
            success: false,
            message:
              "Selected subcategory does not belong to the selected category",
          });
        }

        product.category = targetCategory;
        product.subCategory = targetSubCategory;
      }

      if (name && name.trim()) {
        const duplicate = await Product.findOne({
          name: { $regex: `^${name.trim()}$`, $options: "i" },
          _id: { $ne: id },
        });
        if (duplicate) {
          return res.status(409).json({
            success: false,
            message: "Another product with this name already exists",
          });
        }
        product.name = name.trim();
      }

      if (description && description.trim()) {
        product.description = description.trim();
      }

      if (price !== undefined) {
        if (Number(price) <= 0) {
          return res.status(400).json({
            success: false,
            message: "Price must be greater than 0",
          });
        }
        product.price = Number(price);
      }

      await product.save();

      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: product,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      const deleted = await Product.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Product deleted successfully",
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

module.exports = new productController();
