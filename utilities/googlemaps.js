const polyline = require("@mapbox/polyline");
const axios = require("axios");
const { response } = require("express");
const API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

require("dotenv").config({ path: "secrets/.env" });

//Function below is used to get multiple polylines for each origin to destination pair
module.exports.getPolylines = async (
  origin,
  destination,
  waypoints,
  polylineWaypointCoordinates
) => {
  waypoints.unshift(origin); // Add the origin to the waypoints array
  waypoints.push(destination);
  // Array to store promises for each leg
  const promises = [];

  // Construct the request URLs and create promises for each leg
  for (let i = 0; i < waypoints.length - 1; i++) {
    // const fromCoordinates = polylineWaypointCoordinates[i];
    // const toCoordinates = polylineWaypointCoordinates[i + 1];
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
      from
    )}&destination=${encodeURIComponent(to)}&key=${API_KEY}`;

    const promise = axios
      .get(url)
      .then((response) => {
        const data = response.data;
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          if (route.overview_polyline && route.overview_polyline.points) {
            const encodedPolyline = route.overview_polyline.points;
            // Decode the polyline
            const decodedPolyline = polyline.decode(encodedPolyline);
            const formattedPolyline = decodedPolyline.map((point) => {
              return { lat: point[0], long: point[1] };
            });
            return {
              source: from,
              destination: to,
              sourceCoordinates: formattedPolyline[0],
              destinationCoordinates:
                formattedPolyline[formattedPolyline.length - 1],
              polyline: formattedPolyline,
            };
          }
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        throw error;
      });

    promises.push(promise);
  }

  // Wait for all promises to resolve
  const results = await Promise.all(promises);

  const response = [];
  results.forEach((polyline, index) => {
    const source = polyline.source;
    const destination = polyline.destination;
    const sourceCoordinates = polyline.sourceCoordinates;
    const destinationCoordinates = polyline.destinationCoordinates;
    polyline = polyline.polyline;
    response.push({
      polylineId: index,
      source: source,
      destination: destination,
      sourceCoordinates: sourceCoordinates,
      destinationCoordinates: destinationCoordinates,
      polyline: polyline,
    });
  });

  return response;
};

//Function below is used to get one polyline from origin to destination passing through waypoints
module.exports.getPolyline = async (
  origin,
  destination,
  waypoints,
  polylineWaypointCoordinates
) => {
  const axios = require("axios");
  const polyline = require("@mapbox/polyline");

  const API_KEY = process.env.GOOGLE_CLOUD_API_KEY;
  // Construct the request URL
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
    origin
  )}&destination=${encodeURIComponent(destination)}&waypoints=${waypoints
    .map((wp) => encodeURIComponent(wp))
    .join("|")}&key=${API_KEY}`;

  try {
    // Make the API request using Axios
    const response = await axios.get(url);
    // Parse the response and get the polyline
    const data = response.data;
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      if (route.overview_polyline && route.overview_polyline.points) {
        const encodedPolyline = route.overview_polyline.points;
        // Decode the polyline
        const decodedPolyline = polyline.decode(encodedPolyline);
        const formattedPolyline = decodedPolyline.map((point) => {
          return { lat: point[0], long: point[1] };
        });

        return formattedPolyline;
      }
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

module.exports.geoCode = async (addresses) => {
  const axios = require("axios");
  const API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

  if (!API_KEY) {
    throw new Error("Google Cloud API key is missing.");
  }

  try {
    // Array to store promises
    const promises = [];

    // Iterate over each address in the input array
    for (const address of addresses) {
      // Construct the request URL
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${API_KEY}`;

      // Push the promise for this address into the promises array
      promises.push(
        new Promise((resolve, reject) => {
          axios
            .get(url)
            .then((response) => {
              if (response.status !== 200) {
                reject(
                  new Error(
                    `Failed to fetch data. Status code: ${response.status}`
                  )
                );
              }

              // Parse the response and get the location
              const data = response.data;

              if (data.results && data.results.length > 0) {
                const result = data.results[0];
                const location = result.geometry.location;

                // Resolve the promise with latitude and longitude
                resolve({ lat: location.lat, long: location.lng });
              } else {
                reject(new Error(`No results found for address: ${address}`));
              }
            })
            .catch((error) => {
              reject(error);
            });
        })
      );
    }
    // Resolve all promises and return the array of results
    return Promise.all(promises);
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};




