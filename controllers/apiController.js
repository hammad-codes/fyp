const {
  getAllDocuments,
  getDocumentById,
} = require("../firebase/firebaseUtilities");
const { get } = require("../routes/tripRoutes");

module.exports.assignmentById = async (req, res) => {
  const { id } = req.query;
  try {
    const assignments = await getDocumentById("assignments", id);
    res.send(assignments);
  } catch (error) {
    console.error("Error fetching rider's Assignment:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports.assignments = async (req, res) => {
  const { id } = req.query;
  if (id) {
    return this.assignmentById(req, res);
  } else {
    try {
      const assignments = await getAllDocuments("assignments");
      res.send(assignments);
    } catch (error) {
      console.error("Error fetching Assignments:", error);
      res.status(500).send("Internal Server Error");
    }
  }
};

module.exports.riderLocationById = async (req, res) => {
  const { id } = req.query;
  try {
    const riderLocation = await getDocumentById("riderLocation", id);
    res.send(riderLocation);
  } catch (error) {
    console.error("Error fetching rider's Assignment:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports.riderLocation = async (req, res) => {
  const { id } = req.query;
  if (id) {
    return this.riderLocationById(req, res);
  } else {
    try {
      const riderLocation = await getAllDocuments("riderLocation");
      res.send(riderLocation);
    } catch (error) {
      console.error("Error fetching Assignments:", error);
      res.status(500).send("Internal Server Error");
    }
  }
};
module.exports.emergencyRequests = async (req, res) => {
  try {
    // Fetch all the emergency requests from the DB
    const emergencyRequests = await getAllDocuments("emergencyRequest");

    const response = await Promise.all(
      emergencyRequests.map(async (emergencyRequest) => {
        const emergencyRequestJson = {
          id: emergencyRequest.id,
          description: emergencyRequest.data.description,
          type: emergencyRequest.data.type,
        };

        if (emergencyRequest.data.locationRef != null) {
          const location = await emergencyRequest.data.locationRef.get();
          emergencyRequestJson.location = location.data();
        }

        if (emergencyRequest.data.riderRef != null) {
          const rider = await emergencyRequest.data.riderRef.get();
          emergencyRequestJson.rider = rider.data();
        }

        emergencyRequestJson.timestamp = emergencyRequest.data.timestamp
          .toDate()
          .toLocaleTimeString();

        console.log(emergencyRequestJson.timestamp);
        return emergencyRequestJson;
      })
    );

    res.send(response);
  } catch (error) {
    console.error("Error fetching and populating data:", error);
    res.status(500).send("Internal Server Error");
  }
};
