const polyline = require('@mapbox/polyline');
const axios = require('axios');

require('dotenv').config({ path: 'secrets/.env' });

module.exports.getPolyline = async (origin, destination, waypoints) => {
    const axios = require('axios');
    const polyline = require('@mapbox/polyline');
    
    const API_KEY = process.env.GOOGLE_CLOUD_API_KEY;
    // Construct the request URL
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&waypoints=${waypoints.map(wp => encodeURIComponent(wp)).join('|')}&key=${API_KEY}`;
    
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
                const formattedPolyline = decodedPolyline.map(point => {
                    return { lat: point[0], long: point[1] };
                });
                
                return formattedPolyline;
            }
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
