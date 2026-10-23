const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["category", "subcategory"],
      required: true,
      index: true,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

categorySchema.index({ name: 1, type: 1, parentCategory: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
