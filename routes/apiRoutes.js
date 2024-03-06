const express = require("express");
const router = express.Router();
const apiController = require("../controllers/apiController");

router.route("/emergencyRequests").get(apiController.emergencyRequests);

router.route("/assignments").get(apiController.assignments);
// router.route("/assignments").get(apiController.assignmentById);

router.route("/riderLocation").get(apiController.riderLocation);
router.route("/tripStatus").get(apiController.tripStatus);
module.exports = router;
