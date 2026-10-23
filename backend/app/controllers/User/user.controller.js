const User = require("../../models/User");
const Role = require("../../models/Role");
const bcryptjs = require("bcryptjs");
const crypto = require("crypto");
const mongoose = require("mongoose");
const sendEmail = require("../../utils/email.util");

class UserController {
  async createUser(req, res) {
    try {
      const { name, email, roleName = "User" } = req.body;
      const requesterRole = req.user.role; // 'Super Admin' or 'Admin'

      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: "Name and email are required",
        });
      }

      // Privilege Escalation Check:
      if (roleName === "Super Admin") {
        return res.status(403).json({
          success: false,
          message: "Cannot create another Super Admin account",
        });
      }

      if (requesterRole === "Admin" && roleName !== "User") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admins can only create User accounts.",
        });
      }

      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      const targetRole = await Role.findOne({ name: roleName });
      if (!targetRole) {
        return res.status(404).json({
          success: false,
          message: "Invalid role specified",
        });
      }

      const tempPassword = crypto.randomBytes(4).toString("hex") + "@A1";
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(tempPassword, salt);

      const newUser = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: targetRole._id,
        isActive: true,
      });

      await sendEmail({
        to: newUser.email,
        subject: "Your Account Has Been Created",
        html: `
          <h3>Welcome to the Product Management System, ${newUser.name}!</h3>
          <p>An account has been created for you with the role: <strong>${targetRole.name}</strong>.</p>
          <p><strong>Login Email:</strong> ${newUser.email}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p>Please log in and change your password immediately.</p>
        `,
      });

      return res.status(201).json({
        success: true,
        message: `${targetRole.name} account created and confirmation email sent`,
        data: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: targetRole.name,
          isActive: newUser.isActive,
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

  async listUsers(req, res) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.max(1, Number(req.query.limit) || 10);
      const skip = (page - 1) * limit;
      const search = req.query.search || "";
      const roleFilter = req.query.role; // 'Admin' or 'User'

      const matchStage = {};
      if (search) {
        matchStage.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const pipeline = [
        { $match: matchStage },
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "roleData",
          },
        },
        { $unwind: "$roleData" },
      ];

      if (roleFilter) {
        pipeline.push({ $match: { "roleData.name": roleFilter } });
      }

      pipeline.push(
        {
          $project: {
            name: 1,
            email: 1,
            isActive: 1,
            role: "$roleData.name",
            createdAt: 1,
            updatedAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            totalCount: [{ $count: "count" }],
          },
        },
      );

      const result = await User.aggregate(pipeline);
      const users = result[0]?.data || [];
      const total = result[0]?.totalCount[0]?.count || 0;

      return res.status(200).json({
        success: true,
        data: users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
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

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      const userAgg = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
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
          $project: {
            name: 1,
            email: 1,
            isActive: 1,
            role: "$roleData.name",
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

      if (!userAgg.length) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: userAgg[0],
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, roleName } = req.body;
      const requesterRole = req.user.role;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      const targetUserAgg = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "roleData",
          },
        },
        { $unwind: "$roleData" },
      ]);

      if (!targetUserAgg.length) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const targetUser = targetUserAgg[0];
      const targetCurrentRole = targetUser.roleData.name;

      if (
        targetCurrentRole === "Super Admin" &&
        req.user.id !== String(targetUser._id)
      ) {
        return res.status(403).json({
          success: false,
          message: "Cannot modify Super Admin account",
        });
      }

      if (requesterRole === "Admin" && targetCurrentRole !== "User") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admins can only modify User accounts.",
        });
      }

      const updateFields = {};
      if (name) updateFields.name = name.trim();
      if (email) {
        const emailExists = await User.findOne({
          email: email.toLowerCase().trim(),
          _id: { $ne: id },
        });
        if (emailExists) {
          return res.status(409).json({
            success: false,
            message: "Email already in use by another account",
          });
        }
        updateFields.email = email.toLowerCase().trim();
      }

      if (roleName) {
        if (requesterRole !== "Super Admin") {
          return res.status(403).json({
            success: false,
            message: "Only Super Admin can change user roles",
          });
        }
        if (roleName === "Super Admin") {
          return res.status(403).json({
            success: false,
            message: "Cannot escalate privilege to Super Admin",
          });
        }
        const roleDoc = await Role.findOne({ name: roleName });
        if (!roleDoc) {
          return res.status(400).json({
            success: false,
            message: "Invalid role name",
          });
        }
        updateFields.role = roleDoc._id;
      }

      const updatedUser = await User.findByIdAndUpdate(id, updateFields, {
        new: true,
      }).select(
        "-password -refreshToken -resetPasswordToken -resetPasswordExpire",
      );

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body; // boolean (true/false)
      const requesterRole = req.user.role;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      const targetUserAgg = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "roleData",
          },
        },
        { $unwind: "$roleData" },
      ]);

      if (!targetUserAgg.length) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const targetUser = targetUserAgg[0];
      const targetRole = targetUser.roleData.name;

      if (targetRole === "Super Admin") {
        return res.status(403).json({
          success: false,
          message: "Super Admin account cannot be deactivated",
        });
      }

      if (requesterRole === "Admin" && targetRole !== "User") {
        return res.status(403).json({
          success: false,
          message: "Admins can only activate/deactivate User accounts",
        });
      }

      const newStatus =
        typeof isActive === "boolean" ? isActive : !targetUser.isActive;

      await User.findByIdAndUpdate(id, {
        isActive: newStatus,
        ...(newStatus === false ? { refreshToken: [] } : {}),
      });

      return res.status(200).json({
        success: true,
        message: `User account ${newStatus ? "activated" : "deactivated"} successfully`,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const requesterRole = req.user.role;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      const targetUserAgg = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "roleData",
          },
        },
        { $unwind: "$roleData" },
      ]);

      if (!targetUserAgg.length) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const targetRole = targetUserAgg[0].roleData.name;

      if (targetRole === "Super Admin") {
        return res.status(403).json({
          success: false,
          message: "Super Admin account cannot be deleted",
        });
      }

      if (requesterRole === "Admin" && targetRole !== "User") {
        return res.status(403).json({
          success: false,
          message: "Admins can only delete User accounts",
        });
      }

      await User.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: "User account deleted successfully",
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

module.exports = new UserController();
