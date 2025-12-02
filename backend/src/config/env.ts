import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Server
  PORT: parseInt(process.env['PORT'] || '3001', 10),
  NODE_ENV: process.env['NODE_ENV'] || 'development',

  // Database
  DATABASE_URL: process.env['DATABASE_URL'] || '',

  // JWT
  JWT_SECRET: process.env['JWT_SECRET'] || 'default-secret-change-in-production',
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] || '7d',

  // CORS
  FRONTEND_URL: process.env['FRONTEND_URL'] || 'http://localhost:5173',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env['CLOUDINARY_CLOUD_NAME'] || '',
  CLOUDINARY_API_KEY: process.env['CLOUDINARY_API_KEY'] || '',
  CLOUDINARY_API_SECRET: process.env['CLOUDINARY_API_SECRET'] || '',

  // Wompi
  WOMPI_PUBLIC_KEY: process.env['WOMPI_PUBLIC_KEY'] || '',
  WOMPI_PRIVATE_KEY: process.env['WOMPI_PRIVATE_KEY'] || '',
  WOMPI_EVENTS_SECRET: process.env['WOMPI_EVENTS_SECRET'] || '',

  // Helpers
  isDevelopment: process.env['NODE_ENV'] === 'development',
  isProduction: process.env['NODE_ENV'] === 'production',
};
