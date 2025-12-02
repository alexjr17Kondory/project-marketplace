import { Request, Response, NextFunction } from 'express';
import * as storageService from '../services/storage.service';
import { CLOUDINARY_FOLDERS, type CloudinaryFolder } from '../config/cloudinary';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

// Mapear nombre de carpeta a constante
const folderMap: Record<string, CloudinaryFolder> = {
  products: CLOUDINARY_FOLDERS.PRODUCTS,
  designs: CLOUDINARY_FOLDERS.DESIGNS,
  avatars: CLOUDINARY_FOLDERS.AVATARS,
  orders: CLOUDINARY_FOLDERS.ORDERS,
  general: CLOUDINARY_FOLDERS.GENERAL,
};

/**
 * Subir imagen desde archivo (multipart/form-data)
 * POST /api/uploads/image
 */
export async function uploadImage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna imagen',
      });
      return;
    }

    const folder = folderMap[req.body.folder] || CLOUDINARY_FOLDERS.GENERAL;
    const publicId = req.body.publicId;
    const width = req.body.width ? parseInt(req.body.width) : undefined;
    const height = req.body.height ? parseInt(req.body.height) : undefined;

    const result = await storageService.uploadImage(file.buffer, {
      folder,
      publicId,
      transformation: width || height ? { width, height, crop: 'fill' } : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Subir múltiples imágenes
 * POST /api/uploads/images
 */
export async function uploadMultipleImages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No se proporcionaron imágenes',
      });
      return;
    }

    const folder = folderMap[req.body.folder] || CLOUDINARY_FOLDERS.GENERAL;

    const results = await storageService.uploadMultiple(
      files.map((file) => ({ buffer: file.buffer, filename: file.originalname })),
      { folder }
    );

    res.status(201).json({
      success: true,
      message: `${results.length} imagen(es) subida(s) exitosamente`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Subir imagen desde URL
 * POST /api/uploads/from-url
 */
export async function uploadFromUrl(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { url, folder: folderName, publicId, width, height } = req.body;

    const folder = folderMap[folderName] || CLOUDINARY_FOLDERS.GENERAL;

    const result = await storageService.uploadFromUrl(url, {
      folder,
      publicId,
      transformation: width || height ? { width, height, crop: 'fill' } : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Imagen subida exitosamente desde URL',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Subir imagen en base64
 * POST /api/uploads/base64
 */
export async function uploadBase64(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { image, folder: folderName, publicId, width, height } = req.body;

    const folder = folderMap[folderName] || CLOUDINARY_FOLDERS.GENERAL;

    const result = await storageService.uploadBase64(image, {
      folder,
      publicId,
      transformation: width || height ? { width, height, crop: 'fill' } : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Eliminar imagen
 * DELETE /api/uploads/:publicId
 */
export async function deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // El publicId puede contener slashes, así que lo reconstruimos
    const publicId = req.params['publicId'] + (req.params[0] ? req.params[0] : '');

    const deleted = await storageService.deleteImage(publicId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Imagen no encontrada o ya fue eliminada',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Imagen eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener URL optimizada
 * GET /api/uploads/optimize
 */
export async function getOptimizedUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { publicId, width, height, quality, format } = req.query;

    if (!publicId || typeof publicId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Public ID requerido',
      });
      return;
    }

    const url = storageService.getOptimizedUrl(publicId, {
      width: width ? parseInt(width as string) : undefined,
      height: height ? parseInt(height as string) : undefined,
      quality: (quality as 'auto' | number) || 'auto',
      format: (format as 'auto' | 'webp' | 'jpg' | 'png') || 'auto',
    });

    res.json({
      success: true,
      data: { url },
    });
  } catch (error) {
    next(error);
  }
}
