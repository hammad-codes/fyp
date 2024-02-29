const express = require("express");
const router = express.Router();
const apiController = require("../controllers/apiController");

router.route("/emergencyRequests")
    .get(apiController.emergencyRequests);

router.route("/assignments")
    .get(apiController.assignments);

router.route("/riderLocation")
    .get(apiController.riderLocation);

module.exports = router;