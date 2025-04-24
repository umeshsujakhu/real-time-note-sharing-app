# Notes App - Server

Backend implementation for the Notes App, built with Node.js, Express, TypeScript, and TypeORM.

## Features

- RESTful API for note management
- User authentication with JWT
- Social authentication (Google, Facebook)
- Real-time collaboration with Socket.IO
- Note sharing and access control
- Note revision history
- PostgreSQL database with TypeORM

## Project Structure

```
src/
├── config/          # Configuration files and database setup
├── controllers/     # Route controllers
├── middlewares/     # Express middlewares
├── models/          # TypeORM entity models
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript type definitions
└── index.ts         # Application entry point
```

## Setup and Installation

### Prerequisites

- Node.js 14+
- PostgreSQL database

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables:

   - Create a `.env` file with the following variables:

     ```
     # Database Configuration
     DB_HOST=localhost
     DB_PORT=5432
     DB_USERNAME=postgres
     DB_PASSWORD=postgres
     DB_NAME=notes_app

     # JWT Configuration
     JWT_SECRET=your_secret_key
     JWT_EXPIRES_IN=1d

     # Server Configuration
     PORT=3000
     NODE_ENV=development

     # Client URL (for CORS)
     CLIENT_URL=http://localhost:3001

     # OAuth Configuration (Optional)
     GOOGLE_CLIENT_ID=
     GOOGLE_CLIENT_SECRET=
     GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

     FACEBOOK_APP_ID=
     FACEBOOK_APP_SECRET=
     FACEBOOK_CALLBACK_URL=http://localhost:3000/api/auth/facebook/callback
     ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start the development server with hot reloading
- `npm run build` - Build the application for production
- `npm start` - Run the production build
- `npm run lint` - Run ESLint to check for code issues
- `npm run lint:fix` - Fix ESLint issues automatically

## API Documentation

The API documentation is available through Swagger UI at `/api-docs` when the server is running.

### Main API Endpoints

#### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/facebook` - Facebook OAuth login

#### Notes

- `GET /api/notes` - Get all notes for the current user
- `POST /api/notes` - Create a new note
- `GET /api/notes/:id` - Get a note by ID
- `PUT /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Delete a note
- `GET /api/notes/shared` - Get notes shared with the current user
- `POST /api/notes/:id/share` - Share a note with another user
- `GET /api/notes/:id/revisions` - Get revision history for a note
- `POST /api/notes/:id/revisions/:revisionId/restore` - Restore a previous revision

#### Users

- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user account
- `POST /api/users/:id/profile-picture` - Upload profile picture

## WebSocket Events

The server uses Socket.IO for real-time communication:

- `join-note` - Join a note editing session
- `leave-note` - Leave a note editing session
- `content-change` - Send content changes to other connected users
- `cursor-position` - Send cursor position updates
