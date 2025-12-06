import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary con variables de entorno
cloudinary.config({
  cloud_name: process.env['CLOUDINARY_CLOUD_NAME'],
  api_key: process.env['CLOUDINARY_API_KEY'],
  api_secret: process.env['CLOUDINARY_API_SECRET'],
});

export default cloudinary;

// Carpetas predefinidas para organización
export const CLOUDINARY_FOLDERS = {
  PRODUCTS: 'marketplace/products',
  DESIGNS: 'marketplace/designs',
  AVATARS: 'marketplace/avatars',
  ORDERS: 'marketplace/orders',
  TEMPLATES: 'marketplace/templates',
  GENERAL: 'marketplace/general',
} as const;

export type CloudinaryFolder = typeof CLOUDINARY_FOLDERS[keyof typeof CLOUDINARY_FOLDERS];
