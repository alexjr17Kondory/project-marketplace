import { Request, Response, NextFunction } from 'express';
import * as usersService from '../services/users.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

// ==================== USUARIOS (Admin) ====================

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.listUsers(req.query as any);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const user = await usersService.getUserById(id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const user = await usersService.updateUser(id, req.body);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await usersService.deleteUser(id);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
}

// ==================== PERFIL (Usuario propio) ====================

export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUserById(req.user!.userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateProfile(req.user!.userId, req.body);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

// ==================== DIRECCIONES ====================

export async function getAddresses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const addresses = await usersService.getUserAddresses(req.user!.userId);

    res.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
}

export async function createAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const address = await usersService.createAddress(req.user!.userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Dirección creada exitosamente',
      data: address,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const addressId = Number(req.params.addressId);
    const address = await usersService.updateAddress(
      req.user!.userId,
      addressId,
      req.body
    );

    res.json({
      success: true,
      message: 'Dirección actualizada exitosamente',
      data: address,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const addressId = Number(req.params.addressId);
    await usersService.deleteAddress(req.user!.userId, addressId);

    res.json({
      success: true,
      message: 'Dirección eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
}

export async function setDefaultAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const addressId = Number(req.params.addressId);
    const address = await usersService.setDefaultAddress(
      req.user!.userId,
      addressId
    );

    res.json({
      success: true,
      message: 'Dirección predeterminada actualizada',
      data: address,
    });
  } catch (error) {
    next(error);
  }
}
