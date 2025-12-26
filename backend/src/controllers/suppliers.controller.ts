import { Request, Response } from 'express';
import * as suppliersService from '../services/suppliers.service';

// GET /api/suppliers
export async function getSuppliers(req: Request, res: Response) {
  try {
    const { search, isActive, city } = req.query;

    const filters = {
      search: search as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      city: city as string,
    };

    const suppliers = await suppliersService.getSuppliers(filters);
    res.json({ success: true, data: suppliers });
  } catch (error: any) {
    console.error('Error getting suppliers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/suppliers/stats
export async function getSupplierStats(req: Request, res: Response) {
  try {
    const stats = await suppliersService.getSupplierStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error getting supplier stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/suppliers/generate-code
export async function generateCode(req: Request, res: Response) {
  try {
    const code = await suppliersService.generateSupplierCode();
    res.json({ success: true, data: { code } });
  } catch (error: any) {
    console.error('Error generating supplier code:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/suppliers/:id
export async function getSupplierById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] || '0', 10);
    const supplier = await suppliersService.getSupplierById(id);

    if (!supplier) {
      res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
      return;
    }

    res.json({ success: true, data: supplier });
  } catch (error: any) {
    console.error('Error getting supplier:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// POST /api/suppliers
export async function createSupplier(req: Request, res: Response) {
  try {
    const supplier = await suppliersService.createSupplier(req.body);
    res.status(201).json({ success: true, data: supplier, message: 'Proveedor creado correctamente' });
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}

// PUT /api/suppliers/:id
export async function updateSupplier(req: Request, res: Response) {
  try {
    const id = parseInt(req.params['id'] || '0', 10);
    const supplier = await suppliersService.updateSupplier(id, req.body);
    res.json({ success: true, data: supplier, message: 'Proveedor actualizado correctamente' });
  } catch (error: any) {
    console.error('Error updating supplier:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}

// DELETE /api/suppliers/:id
export async function deleteSupplier(req: Request, res: Response) {
  try {
    const id = parseInt(req.params['id'] || '0', 10);
    await suppliersService.deleteSupplier(id);
    res.json({ success: true, message: 'Proveedor eliminado correctamente' });
  } catch (error: any) {
    console.error('Error deleting supplier:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}
