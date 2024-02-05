const Rider = require("../models/rider");
const riderDB = require("../firebase/riderDB");

module.exports.renderSingupForm = (req, res) => {
  res.send("Signup form");
};

module.exports.signup = async (req, res) => {
    // TODO -> Validate the data
    const {name, cnic, phone, address ,email, password } = req.body;
    const result = await riderDB.register(name, cnic, phone, address ,email, password);
    console.log(result);
    res.send(result);
  };