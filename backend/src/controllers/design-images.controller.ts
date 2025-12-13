import { Request, Response, NextFunction } from 'express';
import { designImagesService } from '../services/design-images.service';

// Listar todas las imágenes de diseño
export async function getAllDesignImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { isActive, category, search } = req.query;

    const filters = {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      category: category as string | undefined,
      search: search as string | undefined,
    };

    const images = await designImagesService.getAllDesignImages(filters);
    res.json({ success: true, data: images });
  } catch (error) {
    next(error);
  }
}

// Obtener imagen de diseño por ID
export async function getDesignImageById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const image = await designImagesService.getDesignImageById(id);

    if (!image) {
      res.status(404).json({ success: false, message: 'Imagen no encontrada' });
      return;
    }

    res.json({ success: true, data: image });
  } catch (error) {
    next(error);
  }
}

// Obtener categorías únicas
export async function getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await designImagesService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

// Crear imagen de diseño
export async function createDesignImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const image = await designImagesService.createDesignImage(req.body);
    res.status(201).json({ success: true, data: image });
  } catch (error) {
    next(error);
  }
}

// Actualizar imagen de diseño
export async function updateDesignImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const image = await designImagesService.updateDesignImage(id, req.body);
    res.json({ success: true, data: image });
  } catch (error) {
    next(error);
  }
}

// Eliminar imagen de diseño
export async function deleteDesignImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const permanent = req.query.permanent === 'true';

    const image = permanent
      ? await designImagesService.permanentDeleteDesignImage(id)
      : await designImagesService.deleteDesignImage(id);

    res.json({ success: true, data: image });
  } catch (error) {
    next(error);
  }
}

// Actualizar orden de múltiples imágenes
export async function updateSortOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      res.status(400).json({ success: false, message: 'Se requiere un array de items' });
      return;
    }

    const results = await designImagesService.updateSortOrder(items);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
}
