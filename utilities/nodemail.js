const nodemailer = require("nodemailer");

require("dotenv").config({ path: "secrets/.env" });

// Create a transporter object
module.exports.sendCustomerEmail = async (to, customerName, date, time) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });
  // Define the email options
  const mailOptions = {
    from: "i200864@nu.edu.pk",
    to: to,
    subject: "Expected delivery time for your order",
    text: `Dear ${customerName}\n\nWe are pleased to inform you that your order is expected to be delivered on ${date} at around ${time}.\n\nThank you for your patience.\n\nSincerely.\nRoute Optima.`,
  };
  const response = await transporter.sendMail(mailOptions);
  return response.response;
};


module.exports.sendRiderEmail = async (to, rider, date, time) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });
  // Define the email options
  const mailOptions = {
    from: "i200864@nu.edu.pk",
    to: to,
    subject: "New Assignment from Route Optima",
    text: `Dear ${rider}\n\nA new Assignment has been added for ${date}\n\n Trip will start at ${time}.\n\nThank you\n\nRegards.\nRoute Optima.`,
  };
  const response = await transporter.sendMail(mailOptions);
  return response.response;
};

