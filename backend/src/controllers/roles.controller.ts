import { Request, Response, NextFunction } from 'express';
import * as rolesService from '../services/roles.service';

// Obtener todos los roles
export async function getAllRoles(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await rolesService.getAllRoles(req.query as any);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener rol por ID
export async function getRoleById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const includeUsers = req.query.includeUsers === 'true';
    const role = await rolesService.getRoleById(id, includeUsers);

    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
}

// Crear rol
export async function createRole(req: Request, res: Response, next: NextFunction) {
  try {
    const role = await rolesService.createRole(req.body);

    res.status(201).json({
      success: true,
      message: 'Rol creado exitosamente',
      data: role,
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar rol
export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const role = await rolesService.updateRole(id, req.body);

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      data: role,
    });
  } catch (error) {
    next(error);
  }
}

// Eliminar rol
export async function deleteRole(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await rolesService.deleteRole(id);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

// Asignar rol a usuario
export async function assignRoleToUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, roleId } = req.body;
    const result = await rolesService.assignRoleToUser(userId, roleId);

    res.json({
      success: true,
      message: 'Rol asignado exitosamente',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener usuarios por rol
export async function getUsersByRole(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const result = await rolesService.getUsersByRole(id, page, limit);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener permisos disponibles
export async function getAvailablePermissions(_req: Request, res: Response, next: NextFunction) {
  try {
    const permissions = rolesService.getAvailablePermissions();

    res.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener estadísticas de roles
export async function getRolesStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await rolesService.getRolesStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
