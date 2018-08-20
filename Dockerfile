# specify the node base image with your desired version node:<version>
FROM node:10

# Make port available to the world outside this container
# replace this with your application's default port
EXPOSE 8080

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
ADD . /app

# Define any environment variable
ENV NAME t2j

RUN npm install

# Run this when the container launches
# CMD ["npm", "start"]
CMD npm start