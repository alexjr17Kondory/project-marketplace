# Backend Dockerfile
FROM node:20-slim

WORKDIR /app

# Instalar OpenSSL y otras dependencias necesarias para Prisma
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Generar cliente de Prisma
RUN npx prisma generate

# Exponer puerto
EXPOSE 3001

# Comando para desarrollo
CMD ["npm", "run", "dev"]
