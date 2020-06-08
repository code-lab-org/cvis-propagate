# Constellation Visualization and Propagation (cvis-propagate)

This application propagates and visualizes the orbits of satellites in a constellation. It uses the [Orekit](https://www.orekit.org/) flight dynamics library to perform orbital propagation and the [CesiumJS](https://cesium.com/cesiumjs/) library to provide visualization.

CVIS is structured as a service-oriented architecture with frontend and backend components. The frontend component is a HTML/JavaScript webpage that provides a browser-based Graphical User Interface (GUI). It interacts with the backend component via RESTful HTTP requests. The backend component is a Python web server that serves the frontend component and performs the orbital propagation calculations.

## Getting Started

CVIS visualization capabilities require a personal Cesium ion API key specified in the environment variable `CESIUM_API_KEY`, conveniently included as a line in the `.env` configuration file. You can register to receive a free API token at [Cesium ion](https://cesium.com/ion).

Additionally, the application is configured to use the free "Blue Marble Next Generation July, 2004" imagery, rather than the default Bing Maps imagery, which has severe access restrictions without a Bing maps API key. To enable this imagery:
 * Sign in to your [Cesium](https://cesium.com/ion) account
 * Navigate to the "Asset Depot" tab
 * Search for "Blue Marble Next Generation July, 2004"
 * Click the "+" icon to add it to your Asset Depot

## Running as a Standalone Application

To run CVIS as a standalone application you will need a compatible environment with Python (to run the application) and Node.js (to build the application). Python bindings for Orekit are distributed via `conda` which is the preferred package management system. An `environment.yml` file has been provided and can be activated from the project root as follows:
```shell
conda env create -f environment.yml
conda activate cvis-propagate
```

To install NPM dependencies and build the frontend application, run:
```shell
npm install
npm run build
```

To start the application, launch the Python server from the project root as follows:
```shell
npm start
```
the resulting service will be accessible at [http://localhost:5001](). Application configuration options are available in the `.env` file:
```shell
CVIS_HOST=0.0.0.0
CVIS_PORT=5001
CESIUM_API_KEY=your_cesium_api_key_here
```

## Running as a Docker Container

To facilitate the deployment, a Dockerfile has also been provided, and can be run from the project root as follows:
```shell
docker build --tag cvis-propagate .
docker run --publish 80:5001 cvis-propagate
```
where the flag `--publish 80:5001` redirects traffic on port 80 to the container's port 5001. The resulting service will be accessible at [http://localhost:80](). Application configuration options are available in the `.env` file:
```shell
CVIS_HOST=0.0.0.0
CVIS_PORT=5001
CESIUM_API_KEY=your_cesium_api_key_here
```
