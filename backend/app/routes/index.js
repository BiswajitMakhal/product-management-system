const express = require("express");
const Router = express.Router();

Router.use("/auth", require("./auth.routes"));
Router.use("/users", require("./user.routes"));
Router.use("/dashboard", require("./dashboard.routes"));
Router.use("/", require("./category.routes"));
Router.use("/products", require("./product.route"));

module.exports = Router;