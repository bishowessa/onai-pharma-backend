# Onai Pharma Backend

This is the backend for the Onai Pharma application. It provides a RESTful API for managing products, orders, and users.

## Features

*   User authentication and authorization using JSON Web Tokens (JWT).
*   Product management (CRUD operations).
*   Order processing and management.
*   Image uploads for products to Cloudinary.

## Technologies Used

*   **Backend**: Node.js, Express.js
*   **Database**: MongoDB with Mongoose
*   **Containerization**: Docker, Docker Compose
*   **File Storage**: Cloudinary for image hosting
*   **Middleware**: Multer for handling file uploads

## Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/)
*   [Docker](https://www.docker.com/get-started)
*   [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/bishowessa/onai-pharma-backend.git
cd onai-pharma-backend
```

### 2. Environment Variables

Create a `.env` file in the root of the project and add the following environment variables. You will need to provide your own values for the MongoDB connection and Cloudinary credentials.

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PORT=3000
```

## Running the Application with Docker

This project is configured to run in Docker containers.

To build and start the services, run the following command:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

This will start the Node.js application and a MongoDB service. The application will be available at `http://localhost:3000`.

## API Endpoints

The following are the base routes for the API:

*   `/api/users` - User related endpoints
*   `/api/products` - Product related endpoints
*   `/api/orders` - Order related endpoints

For detailed information about the endpoints, please refer to the route definitions in the `Routes/` directory.
