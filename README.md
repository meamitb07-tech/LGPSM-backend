# Event Management Backend

## Purpose
This is the backend for the Event Management website and mobile application. It serves as the foundation for the REST API.

## Technology Stack
- Node.js
- Express.js
- JavaScript
- dotenv for environment variables
- CORS
- nodemon (development)

## Setup Instructions
1. Clone the repository and navigate to this backend directory.
2. Run `npm install` to install dependencies.
3. Copy `.env.example` to `.env` and configure your environment variables.

## Development Command
To start the server in development mode with live reloading:
```bash
npm run dev
```

## Production Command
To start the server for production:
```bash
npm start
```

## Folder Structure
- `src/config/`: Configuration files (Database, Environment, External services)
- `src/controllers/`: Handle HTTP requests and responses
- `src/services/`: Business logic and application operations
- `src/repositories/`: Database access layer (CRUD)
- `src/models/`: Database schemas/models
- `src/routes/`: API route definitions
- `src/middlewares/`: Express middlewares (Auth, Validation, Error handling, etc.)
- `src/validators/`: Request validation schemas
- `src/utils/`: Common helper functions and utilities
- `src/sockets/`: WebSocket/Socket.IO functionality

## Basic API Health-Check
- **GET /api/health**: Confirms that the backend server is running.
