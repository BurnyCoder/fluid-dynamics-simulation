#!/bin/bash

# If Node.js is not installed, display an error message
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js to run this simulation."
    echo "Visit https://nodejs.org/ to download and install Node.js."
    exit 1
fi

# Run the server
echo "Starting Fluid Dynamics Simulation..."
node server.js 