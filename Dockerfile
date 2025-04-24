# Multi-stage build for both client and server

# Build client
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Build server
FROM node:18-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# Production image
FROM node:18-alpine
WORKDIR /app

# Copy client build
COPY --from=client-build /app/client/build /app/client/build

# Copy server build
COPY --from=server-build /app/server/dist /app/server/dist
COPY --from=server-build /app/server/package*.json /app/server/

# Install production dependencies for server
WORKDIR /app/server
RUN npm install --production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["node", "dist/index.js"] 