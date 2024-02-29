//-------------------------------------------------------------------------------------------------------------------------------------------------
const express = require("express"); // To create the express app
const cors = require("cors");
const app = express(); // Create an express app
const path = require("path"); // To construct absolute paths
const ejsMate = require("ejs-mate"); // To use ejs partials
// const multer = require("multer"); // To handle file uploads
//FIREBASE CONFIG
const adminDB = require("./firebase/adminDB");
//-----------------
//Routes
const adminRoutes = require('./routes/adminRoutes');
const riderRoutes = require('./routes/riderRoutes');
const tripRoutes = require('./routes/tripRoutes');
const apiRoutes = require('./routes/apiRoutes');
//-------------------------------------------------------------------------------------------------------------------------------------------------
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));
//-------------------------------------------------------------------------------------------------------------------------------------------------
// Middlewares
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from the public folder
app.use(express.urlencoded({ extended: true })); // To parse the form data

// Use CORS middleware
app.use(cors());

//Route Middlewares
app.use('/', adminRoutes);
app.use('/rider', riderRoutes);
app.use('/trip', tripRoutes);
app.use('/api', apiRoutes);
//-------------------------------------------------------------------------------------------------------------------------------------------------
app.get("*", (req, res) => {
  res.send("404 Not Found, Please follow correct routes. Thanks !");
});

app.listen(9000, () => {
  console.log("Server is running on port 9000");
});
//-------------------------------------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------------
