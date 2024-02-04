const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.route("/signup")
    .get(adminController.renderSingupForm)
    .post(adminController.signup);

router.route("/login")
    .get(adminController.renderLoginForm)
    .post(adminController.login);

router.get("/logout", adminController.logout);

module.exports = router;