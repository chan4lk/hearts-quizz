# Use official Node.js image
FROM node:18

# Install build dependencies
RUN apt-get update && apt-get install -y python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock* ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 5001

# Start development server
CMD ["npm", "start"]
