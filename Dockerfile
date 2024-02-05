# Use a specific Node.js version as a parent image
FROM node:20.11.0

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY . /app/

# Install app dependencies
RUN npm install

# Expose the port on which the application will run
EXPOSE 9000

# Command to run the application
CMD ["npm", "start"]
