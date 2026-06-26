FROM node:22-alpine

WORKDIR /app

# Copy dependencies first
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose vite port
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
