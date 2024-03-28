const { string } = require("joi");
const {
  getAllDocuments,
  getDocumentById,
} = require("../firebase/firebaseUtilities");
const { get } = require("../routes/tripRoutes");

module.exports.tripStatus = async (req, res) => {
  try {
    const assinmentsResponse = await getAllDocuments("assignments");
    const tripStatus = []
    for(let i = 0; i < assinmentsResponse.length; i++){
      assignment = assinmentsResponse[i];
      tripStatus.push(
        {
          id: assignment.id,
          parcelsRemaining: assignment.data.parcelsRemaining,
          parcelsDelivered: assignment.data.parcelsDelivered,
          totalParcels : assignment.data.totalParcels,
          unableToDeliver: assignment.data.unableToDeliver
        }
      )
    }
    res.send(tripStatus);
  } catch (error) {
    console.error("Error fetching the trip Status:", error);
    res.status(500).send("Internal Server Error");
  }
}

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
          riderId: emergencyRequest.data.riderId,
        };

        if (emergencyRequest.data.locationRef != null) {
          const location = await emergencyRequest.data.locationRef.get();
          emergencyRequestJson.location = location.data();
        }

        if (emergencyRequestJson.riderId != null) {
          const response = await getDocumentById('rider',emergencyRequestJson.riderId);
          emergencyRequestJson.rider = response.data;
        }

        try {
          emergencyRequestJson.timestamp = emergencyRequest.data.timestamp
            .toDate()
        } catch (error) {
          console.error("Error converting timestamp:", error);
          // Handle the error here, such as setting a default value or sending an error response
        }

        return emergencyRequestJson;
      })
    );

    // Sort the response array by timestamp in descending order
    response.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    response.forEach((element) => {
      const originalDate = new Date(element.timestamp);
      element.timestamp = new Date(element.timestamp * 1000).toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle:'h24'
      });
      element.date = originalDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } );
    

    res.send(response);
  } catch (error) {
    console.error("Error fetching and populating data:", error);
    res.status(500).send("Internal Server Error");
  }
};