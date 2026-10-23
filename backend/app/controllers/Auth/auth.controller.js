const User = require("../../models/User");
const Role = require("../../models/Role");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const crypto = require("crypto");
const mongoose = require("mongoose");
const sendEmail = require("../../utils/email.util");

class userAuthController {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }

      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User already exists",
        });
      }

      const defaultRole = await Role.findOne({ name: "User" });
      if (!defaultRole) {
        return res.status(404).json({
          success: false,
          message: "Default role not found",
        });
      }

      const salt = await bcryptjs.genSalt(10);
      const hashPassword = await bcryptjs.hash(password, salt);

      const user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashPassword,
        role: defaultRole._id,
      });

      await user.save();
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and Password required",
        });
      }

      const userAgg = await User.aggregate([
        { $match: { email: email.toLowerCase().trim() } },
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

      if (!userAgg || userAgg.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const user = userAgg[0];

      if (user.isActive === false) {
        return res.status(403).json({
          success: false,
          message: "Account is deactivated. Please contact Admin.",
        });
      }

      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const accessToken = jwt.sign(
        {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.roleData.name,
        },
        process.env.JWT_ACCESS_SECRET_KEY,
        { expiresIn: "15m" },
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET_KEY,
        { expiresIn: "7d" },
      );

      const hashRefreshToken = await bcryptjs.hash(refreshToken, 10);
      await User.findByIdAndUpdate(user._id, {
        $push: {
          refreshToken: {
            $each: [hashRefreshToken],
            $slice: -5,
          },
        },
      });
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      };
      res.cookie("accessToken", accessToken, cookieOptions);
      res.cookie("refreshToken", refreshToken, cookieOptions);

      return res.status(200).json({
        success: true,
        message: "Logged in successfully",
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.roleData.name,
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

  async handleRefreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Refresh token missing",
        });
      }

      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY);
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired refresh token",
        });
      }

      const userAgg = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(decoded.id) } },
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

      if (!userAgg || userAgg.length === 0) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      const user = userAgg[0];
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      if (!user.refreshToken || user.refreshToken.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token",
        });
      }

      let isValidToken = false;
      for (let hashToken of user.refreshToken) {
        const isMatch = await bcryptjs.compare(refreshToken, hashToken);
        if (isMatch) {
          isValidToken = true;
          break;
        }
      }

      if (!isValidToken) {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token",
        });
      }

      const newAccessToken = jwt.sign(
        {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.roleData.name,
        },
        process.env.JWT_ACCESS_SECRET_KEY,
        { expiresIn: "15m" },
      );
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      };
      res.cookie("accessToken", accessToken, cookieOptions);
      return res.status(200).json({
        success: true,
        message: "Token refreshed",
        accessToken: newAccessToken,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async logout(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        try {
          const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET_KEY,
          );
          const user = await User.findById(decoded.id);
          if (user && user.refreshToken?.length > 0) {
            for (let hashToken of user.refreshToken) {
              const isMatch = await bcryptjs.compare(refreshToken, hashToken);
              if (isMatch) {
                await User.findByIdAndUpdate(decoded.id, {
                  $pull: { refreshToken: hashToken },
                });
                break;
              }
            }
          }
        } catch (err) {}
      }

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.status(200).json({
        success: false,
        message: "Logged out successfully",
      });
    } catch (err) {
      console.error(err);
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password and new password are required",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long",
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const isMatch = await bcryptjs.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Incorrect current password",
        });
      }

      const salt = await bcryptjs.genSalt(10);
      user.password = await bcryptjs.hash(newPassword, salt);
      user.refreshToken = [];
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No account found with this email",
        });
      }

      const rawResetToken = crypto.randomBytes(32).toString("hex");
      const hashedResetToken = crypto
        .createHash("sha256")
        .update(rawResetToken)
        .digest("hex");

      user.resetPasswordToken = hashedResetToken;
      user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; //15min
      await user.save();

      const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${rawResetToken}`;

      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        html: `
          <h3>Password Reset Request</h3>
          <p>Hi ${user.name},</p>
          <p>You requested to reset your password. Use the link or token below within 15 minutes:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p><strong>Reset Token:</strong> ${rawResetToken}</p>
        `,
      });

      return res.status(200).json({
        success: true,
        message: "Password reset link sent to your email",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Reset token and new password are required",
        });
      }

      const hashedResetToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        resetPasswordToken: hashedResetToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token",
        });
      }

      const salt = await bcryptjs.genSalt(10);
      user.password = await bcryptjs.hash(newPassword, salt);
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      user.refreshToken = [];
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Password has been reset successfully. You can now log in.",
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

module.exports = new userAuthController();
