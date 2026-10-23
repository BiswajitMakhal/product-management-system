const User = require("../../models/User");
const Category = require("../../models/Category");
const Product = require("../../models/Product");

class DashboardController {
  async getDashboardStats(req, res) {
    try {
      //(Total Users + Role-wise breakdown)
      const userStats = await User.aggregate([
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "roleData",
          },
        },
        { $unwind: "$roleData" },
        {
          $facet: {
            totalUsers: [{ $count: "count" }],
            roleWiseUsers: [
              {
                $group: {
                  _id: "$roleData.name",
                  count: { $sum: 1 },
                },
              },
              {
                $project: {
                  _id: 0,
                  role: "$_id",
                  count: 1,
                },
              },
            ],
          },
        },
      ]);

      //(Aggregation $count)
      const productCountAgg = await Product.aggregate([
        { $count: "totalProducts" },
      ]);

      const categoryStats = await Category.aggregate([
        {
          $facet: {
            totalCategories: [
              { $match: { type: "category" } },
              { $count: "count" },
            ],
            totalSubCategories: [
              { $match: { type: "subcategory" } },
              { $count: "count" },
            ],
            categoryWiseProducts: [
              { $match: { type: "category" } },
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
                  _id: 0,
                  categoryId: "$_id",
                  categoryName: "$name",
                  productCount: { $size: "$products" },
                },
              },
              { $sort: { productCount: -1, categoryName: 1 } },
            ],
            subCategoryWiseProducts: [
              { $match: { type: "subcategory" } },
              {
                $lookup: {
                  from: "categories",
                  localField: "parentCategory",
                  foreignField: "_id",
                  as: "parentCategoryData",
                },
              },
              {
                $unwind: {
                  path: "$parentCategoryData",
                  preserveNullAndEmptyArrays: true,
                },
              },
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
                  _id: 0,
                  subCategoryId: "$_id",
                  subCategoryName: "$name",
                  parentCategoryName: "$parentCategoryData.name",
                  productCount: { $size: "$products" },
                },
              },
              { $sort: { productCount: -1, subCategoryName: 1 } },
            ],
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        data: {
          totals: {
            totalUsers: userStats[0]?.totalUsers[0]?.count || 0,
            totalProducts: productCountAgg[0]?.totalProducts || 0,
            totalCategories: categoryStats[0]?.totalCategories[0]?.count || 0,
            totalSubCategories:
              categoryStats[0]?.totalSubCategories[0]?.count || 0,
          },
          roleWiseUsers: userStats[0]?.roleWiseUsers || [],
          categoryWiseProducts: categoryStats[0]?.categoryWiseProducts || [],
          subCategoryWiseProducts:
            categoryStats[0]?.subCategoryWiseProducts || [],
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Error fetching dashboard statistics",
      });
    }
  }
}

module.exports = new DashboardController();
