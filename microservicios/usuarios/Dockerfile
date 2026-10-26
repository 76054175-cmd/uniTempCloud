FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV PORT=3001
EXPOSE 3001

# node como proceso principal para recibir SIGTERM de Docker/Kubernetes
CMD ["node", "src/server.js"]
