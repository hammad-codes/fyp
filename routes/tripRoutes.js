const express = require("express");
const router = express.Router();
const tripController = require("../controllers/tripController");

const multer = require("multer"); // To handle file uploads
const upload = multer({ dest: "uploads/" }); // Define the destination folder for uploaded files

router.route("/optimizeRoutes")
    .post(upload.single("csvFile"), tripController.optimizeRoutes);

router.route("/assignRiders")
    .post(tripController.assignRiders);
    
module.exports = router;