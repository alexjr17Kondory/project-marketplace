# Frontend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer puerto (Vite corre en 5174)
EXPOSE 5174

# Comando para desarrollo con host accesible
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
