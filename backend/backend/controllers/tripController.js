const Trip = require("../models/trip");
const fs = require("fs");
const csv = require("csv-parser");
const { spawn } = require("child_process");
const path = require("path");
const { sendCustomerEmail, sendRiderEmail } = require("../utilities/nodemail");
const { getAllDocuments } = require("../firebase/firebaseUtilities");
const { getDistanceTimeMatrices } = require("../utilities/mapbox");
const { insert, db } = require("../firebase/firebaseUtilities");
const { array } = require("joi");
const { response } = require("express");

// TODO --> Send the Email to the customer, riders.
module.exports.renderOptimizeRoutesForm = (req, res) => {
  res.render("optimizeRoutes.ejs");
};

module.exports.assignRiders = async (req, res) => {
  try {
    const resultsJSON = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../../results/results.json"),
        "utf8"
      )
    );

    const subroutesIDs = [];
    const riderIDs = [];
    // store all the keys of the req.body in the subroutes array and all the values in the riders array
    for (const [key, value] of Object.entries(req.body)) {
      subroutesIDs.push(key);
      riderIDs.push(value);
      console.log(`${key}: ${value}`);
    }
    // Making a Trip Object and inserting it into the DB
    const trip = new Trip(
      resultsJSON["nRiders"],
      resultsJSON["nParcels"],
      resultsJSON["nTWV"],
      resultsJSON["totalDistance"],
      new Date().toLocaleDateString()
    ).toObject();
    const tripRef = await insert("trip", trip); // * DB Operation

    const subroutes = resultsJSON["subroutes"];

    //For each subroute, create a batch and add all the documents to it
    for (let i = 0; i < subroutes.length; i++) {
      const batch = db.batch(); // * DB Operation --> Creating a batch

      const parcelRefs = [];
      //For each each parcel in the subroute, create the customer, location and parcel documents and add them to the batch
      for (let j = 0; j < subroutes[i]["customer_stats"].length; j++) {
        const customer_stat = subroutes[i]["customer_stats"][j];

        const location = customer_stat["coordinates"];
        const customer = {
          address: customer_stat["customer_info"]["address"],
          cnic: customer_stat["customer_info"]["cnic"],
          email: customer_stat["customer_info"]["email"],
          name: customer_stat["customer_info"]["name"],
          phone: customer_stat["customer_info"]["phone"],
        };

        const locationRef = db.collection("location").doc();
        const customerRef = db.collection("customer").doc();

        batch.set(locationRef, location); // * DB Operation
        batch.set(customerRef, customer); // * DB Operation

        const parcel = {
          locationRef: locationRef,
          receiverRef: customerRef,
          ready_time: fixTime(customer_stat["ready_time"]),
          due_time: fixTime(customer_stat["due_time"]),
          arrival_time: fixTime(customer_stat["arrival_time"]),
          weight: customer_stat["demand"],
          service_time: customer_stat["service_time"],
        };

        // ! EMAILS ARE BEING SENT HERE, COMMENTING IT TEMPORARILY.
        // sendCustomerEmail(
        //   customer.email,
        //   customer.name,
        //   trip.date,
        //   parcel.arrival_time
        // );

        const parcelRef = db.collection("parcel").doc();
        batch.set(parcelRef, parcel); // * DB Operation
        parcelRefs.push(parcelRef);
      }
      // Subroute document is created and added to the batch
      const riderRef = db.collection("rider").doc(riderIDs[i]);
      console.log(riderIDs[i]);
      const subroute = {
        endTime: fixTime(subroutes[i]["subroute_endTime"]),
        startTime: fixTime(subroutes[i]["subroute_startTime"]),
        tripRef: tripRef,
        riderRef: riderRef,
        parcels: parcelRefs,
      };
      const subrouteRef = db.collection("subroute").doc();
      batch.set(subrouteRef, subroute); // * DB Operation

      //! Send Rider Email here.

      await batch.commit(); // * DB Operation --> Commiting the batch
      console.log("Rider's Assignment Completed");
    }

    res.status(200).send("Rider's Assignment Completed");
  } catch (error) {
    console.error("Error assigning riders:", error);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports.optimizeRoutes = async (req, res) => {
  // Write preprocessed data to a file which will be fed to the python script

  try {
    const { nRiders } = req.body;
    const csvFilePath = req.file.path;

    const data = await readCSVFile(csvFilePath, nRiders);
    // console.log(data);

    //send a post request to localhost:5000/optimizeRoute sending the data and get the response
    const response = await fetch("http://fyp-algorithm:5000/optimizeRoute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const algoResponse = await response.json();
    
    const riders = await getAllDocuments("rider"); // & Added the riders data to the resultsJson.
    algoResponse["riders"] = riders;

    res.send(algoResponse);
  } catch (error) {
    console.error("Error optimizing routes:", error);
    return res.status(500).send("Internal Server Error");
    //   console.error("Error optimizing routes:", error);
    //   return res.status(500).send("Internal Server Error");
  }
};

const readCSVFile = (csvFilePath, nRiders) => {
  return new Promise((resolve, reject) => {
    const csvResults = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv({ encoding: "utf-8" }))
      .on("data", (data) => csvResults.push(data))
      .on("end", async () => {
        try {
          const processedData = await preprocessData(csvResults, nRiders);
          fs.unlinkSync(csvFilePath);
          resolve(processedData);
        } catch (error) {
          reject(error);
        }
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

const preprocessData = async (csvResults, nRiders) => {
  const Number_of_customers = csvResults.length - 1;
  const max_vehicle_number = nRiders;
  const vehicle_capacity = 200;
  const instance_name = "test";

  const data = {
    Number_of_customers: Number_of_customers,
    instance_name: instance_name,
    max_vehicle_number: max_vehicle_number,
    vehicle_capacity: vehicle_capacity,
  };

  csvResults.forEach((element, index) => {
    const key = index === 0 ? "depart" : `customer_${index}`;

    const opening_time = new Date(`2000-01-01 08:00:00 AM`);
    var due_time = new Date(`2000-01-01 ${element["due_time"]}`);
    var ready_time = new Date(`2000-01-01 ${element["ready_time"]}`);

    due_time = (due_time - opening_time) / (1000 * 60);
    ready_time = (ready_time - opening_time) / (1000 * 60);

    data[key] = {
      customer_info: {
        parcel_id: element["parcel_id"],
        name: element["name"],
        cnic: element["cnic"],
        phone: element["phone"],
        email: element["email"],
        address: element["address"],
      },
      coordincates: { lat: "31.5204", lng: "74.3587" },
      demand: parseInt(element["demand"]),
      ready_time: ready_time,
      due_time: due_time,
      service_time: parseInt(element["service_time"]),
    };
  });
  // extract all the addresses from the csvResults
  const locations = csvResults.map((element) => element["address"]);
  // const [distanceMatrix, timeMatrix] = syntheticMatrices(Number_of_customers);
  const [distanceMatrix, timeMatrix] = await getDistanceTimeMatrices(locations);

  data["distance_matrix"] = distanceMatrix;
  data["time_matrix"] = timeMatrix;

  return data;
};

// TODO : The function below needs to be removed after testing.
const syntheticMatrices = (Number_of_customers) => {
  const distanceMatrix = [];

  for (let i = 0; i < Number_of_customers + 1; i++) {
    const row = [];
    for (let j = 0; j < Number_of_customers + 1; j++) {
      if (i === j) {
        row.push(0);
      } else {
        row.push(Math.floor(Math.random() * 10) + 1);
      }
    }
    distanceMatrix.push(row);
  }

  //Make the array symmetric
  for (let i = 0; i < Number_of_customers + 1; i++) {
    for (let j = i + 1; j < Number_of_customers + 1; j++) {
      distanceMatrix[j][i] = distanceMatrix[i][j];
    }
  }

  return [distanceMatrix, distanceMatrix];
};

const fixTime = (time) => {
  const arrival_time = new Date();
  arrival_time.setHours(8, 0, 0, 0);
  arrival_time.setMinutes(arrival_time.getMinutes() + time);
  return arrival_time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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

        return emergencyRequestJson;
      })
    );

    console.log(response);
    res.send(response);
  } catch (error) {
    console.error("Error fetching and populating data:", error);
    res.status(500).send("Internal Server Error");
  }
};

