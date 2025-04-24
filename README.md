# Notes App

A full-stack note-taking application with real-time collaboration features.

## Project Structure

This project is organized into two main parts:

### Backend (Server)

- **Tech Stack**: Node.js, Express, TypeScript, TypeORM, PostgreSQL, Socket.IO
- **Features**:
  - REST API for note CRUD operations
  - User authentication and authorization
  - Note sharing capabilities
  - Real-time collaboration with WebSockets
  - Revision history

### Frontend (Client)

- **Tech Stack**: React, TypeScript, Material-UI, Socket.IO Client
- **Features**:
  - Modern and responsive UI
  - Real-time note editing
  - User authentication and profile management
  - Collaborative editing
  - Dark/light mode support
  - Markdown/rich text editing

## Prerequisites

- Node.js 14+ and npm
- PostgreSQL database
- Git
- Docker and Docker Compose (optional)

## Getting Started

### Without Docker

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```
3. Set up your environment variables:

   - Create `.env` file in the server directory with the following variables:

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
     ```

4. Start the development servers:
   ```bash
   npm run dev
   ```

This will start both the backend server and the frontend client.

### With Docker

1. Make sure Docker and Docker Compose are installed on your system
2. Clone the repository
3. Start the application:
   ```bash
   docker-compose up -d
   ```

This will build and start all services (client, server, and PostgreSQL database).

## Development

- Backend server runs on http://localhost:3000
- Frontend client runs on http://localhost:3001
- API documentation is available at http://localhost:3000/api-docs

### Development Workflow

1. The backend server supports hot reloading via nodemon
2. The frontend client supports hot reloading via React's development server
3. Changes to the code will automatically restart the respective services

## Production Deployment

To build and run the application for production:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Project Roadmap

- [x] Project setup and architecture
- [x] User authentication
- [x] Note CRUD operations
- [x] Real-time editing
- [ ] Note sharing and collaboration
- [ ] Mobile-responsive design
- [ ] End-to-end testing
- [ ] CI/CD pipeline
- [ ] Production deployment

## License

This project is licensed under the ISC License.
