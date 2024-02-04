const Admin = require("../models/admin");
const adminDB = require("../firebase/adminDB");
const {adminSchema} = require("../schemas");

module.exports.renderSingupForm = (req, res) => {
  res.send("Signup form");
};

module.exports.signup = async (req, res) => {
  // TODO -> Validate the data, Error Handling
  const {name,cnic,phone,address ,email, password } = req.body;
  // const validationResult  = await adminSchema.validateAsync({name,cnic,phone,address ,email, password });
  const result = await adminDB.register(name,cnic,phone,address ,email, password);
  console.log(result);
  res.send(result);
};

module.exports.renderLoginForm = (req, res) => {
  res.send("Login form");
};

module.exports.login = async (req, res) => {
  const { email, password } = req.body;
  //TODO -> Validate the data, Error Handling
  const result = await adminDB.authenticate(email, password);
  //TODO -> initialize the session
  //TODO -> redirect to the dashboard
  res.send(result);
};

module.exports.logout = (req, res) => {
  res.send("Logout successful");
};
