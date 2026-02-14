# Use the official Node.js 20 image.
FROM node:20-alpine AS base

# Set the working directory in the container
WORKDIR /app

# Install dependencies
COPY package.json ./
COPY package-lock.json* ./
# Use --frozen-lockfile to ensure we use the lockfile
RUN npm ci

# Install bash for the generate:api-types script
RUN apk add --no-cache bash

# Copy the rest of the application code
COPY . .

# The generate:api-types script needs PYTHON_API_URL.
# This will be passed in during the build phase.
ARG PYTHON_API_URL
RUN npm run generate:api-types

# Generate Prisma client
RUN npm run prisma:generate

# Build the Next.js application
RUN npm run build

# Start a new stage for the production image
FROM node:20-alpine AS production

WORKDIR /app

# Copy over the built application from the previous stage
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/public ./public

# Expose the port the app runs on
EXPOSE 8080

# The command to start the application
CMD ["npm", "start"]
