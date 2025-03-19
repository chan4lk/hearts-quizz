# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock* ./
RUN npm ci
COPY . .
RUN npm run build
ENV PORT=5001
EXPOSE 3000


# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "preview"]
