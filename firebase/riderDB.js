const { auth, firestore } = require("./firebaseConfig");
const Rider = require("../models/rider");
const sha256 = require('sha256');

module.exports.register = async (name,cnic,phone,address,email, password) => {

    password = sha256(password);
    const rider = new Rider(
        name,
        cnic,
        phone,
        address,
        email,
        password
    );
    const riderObj = rider.toObject();

    var querySnapShot = await firestore.collection("rider").where("cnic", "==", cnic).get();
    if (!querySnapShot.empty) {
        return {
            status: false,
            message: "Rider with this cnic already exists",
            uid: null,
        }
    }

    querySnapShot = await firestore.collection("rider").where("phone", "==", phone).get();
    if (!querySnapShot.empty) {
        return {
            status: false,
            message: "Rider with this phone already exists",
            uid: null,
        }
    }

  try {
    const userRecord = await auth.createUser({
      email: email,
      password: password,
    });
    
    const riderRef = await firestore.collection("rider").add(riderObj);

    return {
        status: true,
        message: "Successfully created new user",
        // uid: userRecord.uid,
    }
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;

    return {
        status: false,
        message: `Registration failed: ${errorCode} ${errorMessage}`,
        uid: null,
    }
  }
};
