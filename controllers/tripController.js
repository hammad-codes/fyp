const Trip = require("../models/trip");
const fs = require("fs");
const csv = require("csv-parser");
const { spawn } = require("child_process");
const path = require("path");
const crypto = require('crypto');
const { sendCustomerEmail, sendRiderEmail } = require("../utilities/nodemail");
const {
  getAllDocuments,
  getDocumentById,
} = require("../firebase/firebaseUtilities");
const { getDistanceTimeMatrices } = require("../utilities/mapbox");
const {
  getPolylines: getPolylines,
  getPolyline: getPolyline,
  geoCode: geoCode,
} = require("../utilities/googlemaps");
const {
  getGoogleDistanceTimeMatrices,
} = require("../utilities/distancematrix");
const {
  insert,
  db,
  deleteCollection,
  updateAllAssignments,
} = require("../firebase/firebaseUtilities");
const { array, exist } = require("joi");
const { response, json } = require("express");
const algoAPI = process.env.ALGO_API;

// TODO --> Send the Email to the customer, riders.

module.exports.assignRiders = async (req, res) => {
  try {
    //Read the results.json file
    const resultsJSON = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../results/results.json"), "utf8")
    );
    const subroutesIDs = [];
    const riderIDs = [];

    // Delete  the assignments and riderLocation collection
    await updateAllAssignments();
    await deleteCollection("assignments");
    await deleteCollection("riderLocation");
    //--------------------------------------------------------------------------------

    // store all the keys of the req.body in the subroutes array and all the values in the riders array
    const Assignments = db.collection("assignments");
    for (const [key, value] of Object.entries(req.body)) {
      subroutesIDs.push(key);
      riderIDs.push(value);
      console.log(`${key}: ${value}`);

      const assignmentDocRef = Assignments.doc(`${value}`);

      const subroute_id = parseInt(key.match(/\d+/)[0]);
      // console.log(resultsJSON["subroutes"][subroute_id]);
      await assignmentDocRef.set(resultsJSON["subroutes"][subroute_id]); // * DB Operation
    }
    //--------------------------------------------------------------------------------

    // Making a Trip Object and inserting it into the DB
    const trip = new Trip(
      resultsJSON["nRiders"],
      resultsJSON["nParcels"],
      resultsJSON["nTWV"],
      resultsJSON["totalDistance"],
      new Date().toLocaleDateString()
    ).toObject();
    const tripRef = await insert("trip", trip); // * DB Operation
    //--------------------------------------------------------------------------------
    //For each subroute, create a batch and add all the documents to it
    const subroutes = resultsJSON["subroutes"];
    for (let i = 0; i < subroutes.length; i++) {
      var polylineSource = "Centaurus, Islamabad"; // * For Polyline
      var polylineDestination = ""; // * For Polyline
      var polylineWaypoints = []; // * For Polyline

      const riderAssignment = {
        //get the current timestamp
        date: new Date().toLocaleDateString(),
        endTime: null,
        startTime: null,
        tripRef: null,
        parcels: [],
        //additional Information
        actualStartTime: "null",
        actualEndTime: "null",
        status: "assigned",
        totalParcels: subroutes[i]["customer_stats"].length,
        parcelsDelivered: 0,
        parcelsRemaining: subroutes[i]["customer_stats"].length,
        unableToDeliver: 0,
        alertsGenerated: 0,
        distanceCovered: 0,
        totalDistance: subroutes[i]["subroute_cost"],
        riderInfo: resultsJSON["riders"].find(
          (rider) => rider.id === riderIDs[i]
        ).data,
      };

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
        polylineWaypoints.push(customer.address); // * For Polyline
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
        //for assignments collection
        const raParcel = {
          parcelId: addTimestampAndHash(customer.cnic),
          location: location,
          receiver: customer,
          ready_time: parcel.ready_time,
          due_time: parcel.due_time,
          arrival_time: parcel.arrival_time,
          weight: parcel.weight,
          service_time: parcel.service_time,
          //additional Information
          status: "pending",
          receiverName: "null",
          deliveryProofLink: "null",
          actualStartTime: "null",
          actualEndTime: "null",
          nItems: 1,
        };
        riderAssignment.parcels.push(raParcel);
        // for assignments collection
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
      polylineDestination = polylineWaypoints.pop(); // * For Polyline
      // const polyline = await getPolylines(
      //   polylineSource,
      //   polylineDestination,
      //   polylineWaypoints
      // ); // * For Polyline

      const polylines = subroutes[i]["polylines"];
      const polyline = subroutes[i]["polyline"];
      const riderLocation = {
        polylineId: 0,
        riderLocation: polylines[0].source,
        riderCoordinates: {
          lat: polylines[0].sourceCoordinates.lat,
          long: polylines[0].sourceCoordinates.long,
        },
        polylines: polylines,
        polyline: polyline,
      };
      const riderLocationRef = db.collection("riderLocation").doc(riderIDs[i]);
      batch.set(riderLocationRef, riderLocation); // * DB Operation
      const riderRef = db.collection("rider").doc(riderIDs[i]);
      // console.log(riderIDs[i]);
      const subroute = {
        endTime: fixTime(subroutes[i]["subroute_endTime"]),
        startTime: fixTime(subroutes[i]["subroute_startTime"]),
        tripRef: tripRef,
        riderRef: riderRef,
        parcels: parcelRefs,
      };
      // for assignments collection
      riderAssignment.endTime = subroute.endTime;
      riderAssignment.startTime = subroute.startTime;
      riderAssignment.tripRef = subroute.tripRef;

      const assignmentsRef = db.collection("assignments").doc(riderIDs[i]);
      batch.set(assignmentsRef, riderAssignment);
      // for assignments collection
      const subrouteRef = db.collection("subroute").doc();
      batch.set(subrouteRef, subroute); // * DB Operation
      //! Send Rider Email here.

      await batch.commit(); // * DB Operation --> Commiting the batch
      console.log("Rider's Assignment Completed");
    }

    fs.unlinkSync(path.join(__dirname, "../results/results.json")); // * Deleting the results.json file

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
    //write this to a file
    // fs.writeFileSync(
    //   path.join(__dirname, "./tempdata.json"),
    //   JSON.stringify(data)
    // );
    // console.log(JSON.stringify(data));

    // res.send("Data Preprocessing Completed");

    // console.log(data);

    //send a post request to localhost:5000/optimizeRoute sending the data and get the response
    const response = await fetch(`http://${algoAPI}/optimizeRoute`, {
      // ! Change it back to http://fyp-algorithm:5000/optimizeRoute before pushing
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const algoResponse = await response.json();
    // console.log("Algo Response is -->",algoResponse);

    const polylinePromises = []; //To store all the promises for the polyline function calls
    const polylinesPromises = []; //To store all the promises for the polylines function calls

    //** For each subroute, get the polyline and polylines and add them to the subroute object **
    for (i = 0; i < algoResponse["subroutes"].length; i++) {
      const subroute = algoResponse["subroutes"][i];
      var polylineSource = "Centaurus, Islamabad"; // * For Polyline
      var polylineDestination = ""; // * For Polyline
      var polylineWaypoints = []; // * For Polyline
      var polylineWaypointCoordinates = []; // ! Can cause error Look at it
      33.707852313006086, 73.05026456749465; //Coordinates for Centaurus, Islamabad
      polylineWaypointCoordinates.push({
        lat: 33.707852313006086,
        long: 73.05026456749465,
      }); // * For Polylines
      for (const customer of subroute["customer_stats"]) {
        polylineWaypoints.push(customer["customer_info"]["address"]); // * For Polyline
        polylineWaypointCoordinates.push(customer["coordinates"]); // * For Polylines
      }
      polylineDestination = polylineWaypoints.pop(); // * For Polyline

      polylinePromises.push(
        getPolyline(
          polylineSource,
          polylineDestination,
          polylineWaypoints,
          polylineWaypointCoordinates
        ).then((polyline) => {
          subroute["polyline"] = {
            source: polylineSource,
            destination: polylineDestination,
            sourceCoordinates: polyline[0],
            destinationCoordinates:
              polylineWaypointCoordinates[
                polylineWaypointCoordinates.length - 1
              ],
            polyline: polyline,
          };
        })
      );

      polylinesPromises.push(
        getPolylines(
          polylineSource,
          polylineDestination,
          polylineWaypoints,
          polylineWaypointCoordinates
        ).then((polylines) => {
          subroute["polylines"] = polylines;
        })
      );
    }
    // for (const subroute of algoResponse["subroutes"]) {
    // }
    await Promise.all(polylinePromises);
    await Promise.all(polylinesPromises);

    const riders = await getAllDocuments("rider"); // & Added the riders data to the resultsJson.
    algoResponse["riders"] = riders;

    fs.writeFileSync(
      path.join(__dirname, "../results/results.json"),
      JSON.stringify(algoResponse)
    );

    res.send(algoResponse);
  } catch (error) {
    console.error("Error optimizing routes:", error);
    return res.status(500).send("Internal Server Error");
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

  const locations = csvResults.map((element) => element["address"]);
  const geoCodes = await geoCode(locations);
  console.log(locations);
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
      coordinates: geoCodes[index],
      demand: parseInt(element["demand"]),
      ready_time: ready_time,
      due_time: due_time,
      service_time: parseInt(element["service_time"]),
    };
  });

  // extract all the addresses from the csvResults
  // const [distanceMatrix, timeMatrix] = syntheticMatrices(Number_of_customers);

  const [distanceMatrix, timeMatrix] = await getGoogleDistanceTimeMatrices(
    locations
  );

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
function addTimestampAndHash(input) {
  // Generate a timestamp
  const timestamp = Date.now().toString();

  // Concatenate input and timestamp
  const dataToHash = input + timestamp;

  // Hash the data
  const hash = crypto.createHash("sha256").update(dataToHash).digest("hex");

  return hash;
}
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
