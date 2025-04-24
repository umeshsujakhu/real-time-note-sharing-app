# Notes App - Client

Frontend implementation for the Notes App, built with React, TypeScript, and Material-UI.

## Features

- Modern, responsive UI built with Material-UI
- Real-time note editing with Socket.IO
- Authentication and user management
- Collaborative editing with cursor tracking
- Note organization (archiving, sharing)
- Rich text editing with React-Quill

## Project Structure

```
src/
├── components/      # Reusable UI components
├── context/         # React context providers
├── hooks/           # Custom React hooks
├── pages/           # Page components for routes
├── services/        # API service classes
├── types/           # TypeScript type definitions
├── App.tsx          # Main application component
└── index.tsx        # Application entry point
```

## Setup and Installation

### Prerequisites

- Node.js 14+
- Backend API server running

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables (optional):

   - Create a `.env` file with the following variables:
     ```
     REACT_APP_API_URL=http://localhost:3000
     ```

3. Start the development server:
   ```bash
   npm start
   ```

## Available Scripts

- `npm start` - Start the development server
- `npm run build` - Build the application for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Main Components

### Authentication

- `AuthContext` - Context provider for authentication state
- `Login` & `Register` pages - User authentication
- Protected routes for authenticated users

### Note Management

- `Dashboard` - Main notes view with grid layout
- `NoteCard` - Card component for displaying note previews
- `NotePage` - Individual note editing page
- `RichTextEditor` - Rich text editor for notes

### Layout

- `Layout` - Main layout component with sidebar navigation
- Responsive design with mobile and desktop support
- Light/dark theme support

## State Management

The application uses React Context for global state management:

- Authentication state
- Note editing state
- UI state (theme, sidebar, etc.)

## API Integration

The client communicates with the backend API through:

- RESTful API calls with Axios
- Real-time events with Socket.IO

## Development Guidelines

1. **Component Structure**

   - Use functional components with hooks
   - Create reusable components in the components directory
   - Use TypeScript interfaces for props

2. **Styling**

   - Use Material-UI's styling system (sx prop, styled components)
   - Follow design system for consistency (colors, spacing, typography)

3. **Code Quality**
   - Follow ESLint and Prettier rules
   - Write tests for critical components
