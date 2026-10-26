FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV PORT=3003
EXPOSE 3003

# node como proceso principal para recibir SIGTERM de Docker/Kubernetes
CMD ["node", "src/server.js"]
