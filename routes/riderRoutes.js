const express = require("express");
const router = express.Router();
const riderController = require("../controllers/riderController");

router
  .route("/signup")
  .get(riderController.renderSingupForm)
  .post(riderController.signup);

module.exports = router;
