// ----------------- Distance Time Matrices -----------------
const https = require('https');

function getDistanceMatrix(origins, destinations, apiKey) {
    const baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json?';

    const originStr = origins.join('|');
    const destinationStr = destinations.join('|');

    const url = `${baseUrl}origins=${originStr}&destinations=${destinationStr}&key=${apiKey}`;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            });

            res.on('error', (error) => {
                reject(error);
            });
        });
    });
}

function processDistanceMatrix(response) {
    const numRows = response.rows.length;
    const distanceMatrix = new Array(numRows).fill(null).map(() => new Array(numRows).fill(-1)); // Initialize with -1 (error indicator)
    const timeMatrix = new Array(numRows).fill(null).map(() => new Array(numRows).fill(-1)); // Initialize with -1 (error indicator)

    for (let i = 0; i < numRows; i++) {
        const row = response.rows[i];

        for (let j = 0; j < row.elements.length; j++) {
            const element = row.elements[j];

            // Handle missing data (replace with appropriate logic for your application)
            if (element.status === 'NOT_FOUND') {
                distanceMatrix[i][j] = 'Not Found';
                timeMatrix[i][j] = 'Not Found';
                continue;
            }

            try {
                const distance = parseInt(element.distance.value); // Convert to integer (meters)
                distanceMatrix[i][j] = distance;

                // Extract time in minutes (assuming time format includes minutes)
                const timeInMinutes = element.duration.value / 60; // Convert to minutes
                timeMatrix[i][j] = timeInMinutes;
            } catch (error) {
                console.error(`Error processing element at row ${i}, column ${j}:`, error);
                distanceMatrix[i][j] = -1; // Indicate error
                timeMatrix[i][j] = -1; // Indicate error
            }
        }
    }

    return { distanceMatrix, timeMatrix };
}

async function getGoogleDistanceTimeMatrices(locations) {
    console.log('Locations aa gain ')
    console.log(locations)
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    try {

        const response = await getDistanceMatrix(locations, locations, apiKey);
        console.log('Response', response)
        const { distanceMatrix, timeMatrix } = processDistanceMatrix(response);
        return [distanceMatrix, timeMatrix ];
    } catch (error) {
        console.error('Error:', error);
        return [ [], [] ]; // Return empty matrices in case of error
    }
}

module.exports = {
  getGoogleDistanceTimeMatrices: getGoogleDistanceTimeMatrices
};