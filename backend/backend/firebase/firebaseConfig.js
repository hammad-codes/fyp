const admin = require('firebase-admin');
const serviceAccount = require('../secrets/route-optima-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  ignoreUndefinedProperties: true,
});

const auth = admin.auth();
const firestore = admin.firestore();

module.exports = {
  auth,
  firestore,
};