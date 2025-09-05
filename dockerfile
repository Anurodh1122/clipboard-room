# Build frontend
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Run backend + serve frontend
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server/server.cjs ./server.cjs

EXPOSE 3080
CMD ["node", "server.cjs"]
