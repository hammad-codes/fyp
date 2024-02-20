const express = require("express");
const router = express.Router();
const tripController = require("../controllers/tripController");

const multer = require("multer"); // To handle file uploads
const upload = multer({ dest: "uploads/" }); // Define the destination folder for uploaded files

router.route("/optimizeRoutes")
    .get(tripController.renderOptimizeRoutesForm)
    .post(upload.single("csvFile"), tripController.optimizeRoutes);

router.route("/assignRiders")
    .post(tripController.assignRiders);

router.route("/EmergencyRequests")
    .get(tripController.emergencyRequests);

router.route("/getAssignments")
    .get(tripController.getAssignments);
    
module.exports = router;