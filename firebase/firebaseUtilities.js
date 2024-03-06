const Admin = require("../models/admin");
const { auth, firestore, FieldValue } = require("./firebaseConfig");

const batch = firestore.batch();
const db = firestore;

const insert = async (collection, document) => {
  try {
    const docRef = await firestore.collection(collection).add(document);
    console.log("Document written with ID: ", docRef.id);
    return docRef;
  } catch (error) {
    console.error("Error adding document: ", error);
  }
};

const getAllDocuments = async (collection) => {
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
    throw error;
  }
};

const getDocumentById = async (collection, documentId) => {
  try {
    const docRef = firestore.collection(collection).doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log("Document not found:", documentId);
      return null;
    }

    return {
      id: doc.id,
      data: doc.data(),
    };
  } catch (error) {
    console.error("Error getting document:", error);
    throw error;
  }
};

const deleteCollection = async (collection) => {
  try {
    const snapshot = await firestore.collection(collection).get();

    if (snapshot.empty) {
      console.log("No documents found in the collection:", collection);
      return;
    }

    const batch = firestore.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log("Collection deleted:", collection);
  } catch (error) {
    console.error("Error deleting collection:", error);
    throw error;
  }
};

const updateAllAssignments = async () => {
    try {
      const assignmentsResponse = await getAllDocuments("assignments");
  
      if (!assignmentsResponse || assignmentsResponse.length === 0) {
        console.log("No assignments found to update");
        return;
      }
  
      const batch = firestore.batch();
      const promises = []; // Store promises for existence checks
  
      assignmentsResponse.forEach((assignment) => {
        const assignmentRef = firestore.collection("allAssignments").doc(assignment.id);
  
        // Create promise for each document existence check and update
        const promise = assignmentRef.get().then((doc) => {
          if (doc.exists) {
            // Document exists, update it
            const docData = doc.data();
            docData.assignments.push(assignment.data);
            batch.update(assignmentRef, docData);
          } else {
            // Document doesn't exist, set it
            batch.set(assignmentRef, { assignments: [assignment.data] });
          }
        });
  
        promises.push(promise); // Add promise to array
      });
  
      // Wait for all promises to resolve
      await Promise.all(promises);
  
      // Commit the batch after all checks and updates are done
      await batch.commit();
      console.log("Batch committed successfully");
    } catch (error) {
      console.error("Error updating assignments:", error);
    }
  };
  

module.exports = {
  batch,
  db,
  insert,
  getAllDocuments,
  getDocumentById,
  deleteCollection,
  updateAllAssignments,
};
