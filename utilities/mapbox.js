const axios = require("axios");
require("dotenv").config({ path: "secrets/.env" });
const mapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN;
const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;


module.exports.getDistanceTimeMatrices = async (locations) => {
  const coordinatesString = await geocodeLocations(
    locations,
    mapboxAccessToken
  );

  if (coordinatesString !== null) {
    const [distanceMatrix,timeMatrix] = await getDistanceMatrix(coordinatesString);

    return [distanceMatrix,timeMatrix];

  } else {
    return null;
  }
};

async function geocodeLocations(locations, mapboxAccessToken) {
  // Function to geocode a location
  async function geocodeLocation(location) {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          location
        )}.json?access_token=${mapboxAccessToken}`
      );
      const coordinates = response.data.features[0]?.geometry?.coordinates;
      return coordinates ? `${coordinates[1]},${coordinates[0]}` : null;
    } catch (error) {
      console.error("Error during geocoding:", error.message);
      console.error("Response data:", error.response.data);
      return null;
    }
  }

  // Perform geocoding for each location
  const geocodingPromises = locations.map((location) =>
    geocodeLocation(location)
  );

  try {
    // Wait for all geocoding requests to complete
    const coordinatesArray = await Promise.all(geocodingPromises);

    //swap lat and long
    for (let i = 0; i < coordinatesArray.length; i++) {
      let temp = coordinatesArray[i].split(",");
      coordinatesArray[i] = temp[1] + "," + temp[0];
    }
    // Filter out null values (failed geocoding)
    const validCoordinates = coordinatesArray.filter((coord) => coord !== null);

    // Join the valid coordinates into a string
    const coordinatesString = validCoordinates.join(";");

    return coordinatesString;
  } catch (error) {
    console.error("Error:", error.message);
    return null;
  }
}

// ------------------------------ Distance Matrix ------------------------------
async function getDistanceMatrix(coordinates) {
  const mapboxApiBaseUrl =
    "https://api.mapbox.com/directions-matrix/v1/mapbox/driving";
  try {
    // Convert the array of coordinates to a string

    // const coordinatesString = coordinates.map(coord => coord.join(',')).join(';');
    const numLocations = coordinates.split(";").length;

    // Construct the request URL
    const requestUrl = `${mapboxApiBaseUrl}/${coordinates}?approaches=${"curb;".repeat(
      numLocations - 1
    )}curb&annotations=distance,duration&access_token=${mapboxAccessToken}`;

    // Make the API request
    const response = await axios.get(requestUrl);

    // Access the distance matrix from the response
    const responseData = response.data;
    const timeMatrix = responseData.durations;
    const distanceMatrix = responseData.distances;

    // divide all of the values by 60 to convert them from seconds to minutes
    for (let i = 0; i < timeMatrix.length; i++) {
      for (let j = 0; j < timeMatrix[i].length; j++) {
        timeMatrix[i][j] = Math.ceil(timeMatrix[i][j] / 60);
        distanceMatrix[i][j] = Math.ceil(distanceMatrix[i][j] / 1000);
      }
    }

    return[distanceMatrix,timeMatrix];
    // Log the distance matrix to the console
  } catch (error) {
    console.error("Error fetching distance matrix:", error.message);
  }
}
