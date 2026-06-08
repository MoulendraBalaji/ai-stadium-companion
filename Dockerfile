FROM node:24-alpine
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (production & dev for building)
RUN npm ci

# Copy full application codebase
COPY . .

# Build React client static assets (places bundle in /app/dist)
RUN npm run build

# Expose port and configure production settings
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Start the Express server serving API endpoints and static React files
CMD ["npm", "start"]
