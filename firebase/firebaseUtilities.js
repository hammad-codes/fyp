const Admin = require("../models/admin");
const { auth, firestore } = require("./firebaseConfig");

module.exports.batch = firestore.batch();
module.exports.db=firestore;


module.exports.insert = async (collection, document) => {
    try {
        const docRef = await firestore.collection(collection).add(document);
        console.log("Document written with ID: ", docRef.id);
        return docRef;
    } catch (error) {
        console.error("Error adding document: ", error);
    }
};


module.exports.getAllDocuments = async (collection) => {
    try {
        const snapshot = await firestore.collection(collection).get();

        if (snapshot.empty) {
            console.log("No documents found in the collection:", collection);
            return [];
        }

        const documents = [];
        snapshot.forEach((doc) => {
            documents.push({
                id: doc.id,
                data: doc.data(),
            });
        });

        return documents;
    } catch (error) {
        console.error("Error getting documents: ", error);
        throw error; // You might want to handle or log the error accordingly in your application
    }
};


module.exports.getDocumentById = async (collection, documentId) => {
    try {
        const docRef = firestore.collection(collection).doc(documentId);
        const doc = await docRef.get();

        if (!doc.exists) {
            console.log("Document not found:", documentId);
            return null;
        }

        return {
            id: doc.id,
            data: doc.data()
        };
    } catch (error) {
        console.error("Error getting document:", error);
        throw error;
    }
};
