const Admin = require("../models/admin");
const { auth, firestore } = require("./firebaseConfig");
const sha256 = require("sha256");

module.exports.register = async (
  name,
  cnic,
  phone,
  address,
  email,
  password
) => {
  password = sha256(password);
  const admin = new Admin(name, cnic, phone, address, email, password);
  const adminObj = admin.toObject();

  var querySnapShot = await firestore
    .collection("admin")
    .where("cnic", "==", cnic)
    .get();
  if (!querySnapShot.empty) {
    return {
      status: false,
      message: "Admin with this cnic already exists",
      uid: null,
    };
  }

  querySnapShot = await firestore
    .collection("admin")
    .where("phone", "==", phone)
    .get();
  if (!querySnapShot.empty) {
    return {
      status: false,
      message: "Admin with this phone already exists",
      uid: null,
    };
  }

  try {
    const userRecord = await auth.createUser({
      email: email,
      password: password,
    });
    const user = userRecord.user;

    const adminRef = await firestore.collection("admin").doc(userRecord.uid)
    await adminRef.set(adminObj);

    return {
      status: true,
      message: "Successfully created new admin",
      uid: userRecord.uid,
    };
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;

    return {
      status: false,
      message: `Registration failed: ${errorCode} ${errorMessage}`,
      uid: null,
    };
  }
};

module.exports.authenticate = async (email, password) => {
  try {
    // Hash the password using the same algorithm you used during registration
    const hashedPassword = sha256(password);

    // Sign in the user using Firebase Authentication
    const userCredential = await auth.getUserByEmail(email);

    // Return the user's UID or any other relevant information
    return {
      status: true,
      message: "Authentication successful",
      uid: userCredential.user.uid,
    };
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;

    return {
      status: false,
      message: `Authentication failed: ${errorCode} ${errorMessage}`,
      uid: null,
    };
  }
};
