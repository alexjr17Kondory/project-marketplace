import cloudinary, { CLOUDINARY_FOLDERS, type CloudinaryFolder } from '../config/cloudinary';
import { BadRequestError } from '../utils/errors';

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface UploadOptions {
  folder?: CloudinaryFolder;
  publicId?: string;
  transformation?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    quality?: 'auto' | number;
  };
}

/**
 * Subir imagen desde buffer (multer)
 */
export async function uploadImage(
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { folder = CLOUDINARY_FOLDERS.GENERAL, publicId, transformation } = options;

  try {
    const uploadOptions: any = {
      folder,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    }

    if (transformation) {
      uploadOptions.transformation = {
        width: transformation.width,
        height: transformation.height,
        crop: transformation.crop || 'fill',
        quality: transformation.quality || 'auto',
      };
    }

    // Subir usando stream
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });

      uploadStream.end(buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error: any) {
    console.error('Error uploading to Cloudinary:', error);
    throw new BadRequestError(error.message || 'Error al subir la imagen');
  }
}

/**
 * Subir imagen desde URL
 */
export async function uploadFromUrl(
  url: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { folder = CLOUDINARY_FOLDERS.GENERAL, publicId, transformation } = options;

  try {
    const uploadOptions: any = {
      folder,
      resource_type: 'image',
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    }

    if (transformation) {
      uploadOptions.transformation = {
        width: transformation.width,
        height: transformation.height,
        crop: transformation.crop || 'fill',
        quality: transformation.quality || 'auto',
      };
    }

    const result = await cloudinary.uploader.upload(url, uploadOptions);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error: any) {
    console.error('Error uploading from URL to Cloudinary:', error);
    throw new BadRequestError(error.message || 'Error al subir la imagen desde URL');
  }
}

/**
 * Subir imagen en base64
 */
export async function uploadBase64(
  base64Data: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { folder = CLOUDINARY_FOLDERS.GENERAL, publicId, transformation } = options;

  try {
    // Asegurar que tenga el prefijo correcto
    let dataUri = base64Data;
    if (!base64Data.startsWith('data:')) {
      dataUri = `data:image/png;base64,${base64Data}`;
    }

    const uploadOptions: any = {
      folder,
      resource_type: 'image',
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    }

    if (transformation) {
      uploadOptions.transformation = {
        width: transformation.width,
        height: transformation.height,
        crop: transformation.crop || 'fill',
        quality: transformation.quality || 'auto',
      };
    }

    const result = await cloudinary.uploader.upload(dataUri, uploadOptions);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error: any) {
    console.error('Error uploading base64 to Cloudinary:', error);
    throw new BadRequestError(error.message || 'Error al subir la imagen');
  }
}

/**
 * Eliminar imagen por public_id
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error: any) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
}

/**
 * Obtener URL optimizada de una imagen existente
 */
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): string {
  return cloudinary.url(publicId, {
    width: options.width,
    height: options.height,
    crop: 'fill',
    quality: options.quality || 'auto',
    fetch_format: options.format || 'auto',
    secure: true,
  });
}

/**
 * Subir múltiples imágenes
 */
export async function uploadMultiple(
  files: { buffer: Buffer; filename?: string }[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map((file, index) =>
      uploadImage(file.buffer, {
        ...options,
        publicId: file.filename || `image-${Date.now()}-${index}`,
      })
    )
  );

  return results;
}
