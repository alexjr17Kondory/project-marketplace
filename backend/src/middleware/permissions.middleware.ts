import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from './auth.middleware';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

const prisma = new PrismaClient();

// Cache de permisos para evitar consultas repetidas en la misma sesión
const permissionsCache = new Map<number, string[]>();

/**
 * Middleware para verificar permisos específicos
 * Carga los permisos del rol del usuario y verifica si tiene el permiso requerido
 */
export function requirePermission(permission: string) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('No autenticado'));
      }

      const userId = req.user.userId;
      const roleId = req.user.roleId;

      // SuperAdmin (roleId 0 o 1) siempre tiene acceso total
      if (roleId === 0 || roleId === 1) {
        return next();
      }

      // Verificar caché
      let permissions = permissionsCache.get(roleId);

      if (!permissions) {
        // Obtener permisos del rol desde la base de datos
        const role = await prisma.role.findUnique({
          where: { id: roleId },
          select: { permissions: true },
        });

        if (!role) {
          return next(new ForbiddenError('Rol no encontrado'));
        }

        // Los permisos están guardados como JSON en la base de datos
        permissions = Array.isArray(role.permissions)
          ? (role.permissions as string[])
          : [];

        // Guardar en caché (expira en 5 minutos)
        permissionsCache.set(roleId, permissions);
        setTimeout(() => permissionsCache.delete(roleId), 5 * 60 * 1000);
      }

      // Verificar si tiene el permiso
      if (!permissions.includes(permission)) {
        return next(
          new ForbiddenError(`No tienes permisos para realizar esta acción: ${permission}`)
        );
      }

      // Agregar permisos al request para uso posterior
      (req as any).permissions = permissions;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware para verificar si el usuario tiene AL MENOS uno de los permisos especificados
 */
export function requireAnyPermission(...permissions: string[]) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('No autenticado'));
      }

      const roleId = req.user.roleId;

      // SuperAdmin (roleId 0 o 1) siempre tiene acceso total
      if (roleId === 0 || roleId === 1) {
        return next();
      }

      // Verificar caché
      let userPermissions = permissionsCache.get(roleId);

      if (!userPermissions) {
        // Obtener permisos del rol
        const role = await prisma.role.findUnique({
          where: { id: roleId },
          select: { permissions: true },
        });

        if (!role) {
          return next(new ForbiddenError('Rol no encontrado'));
        }

        userPermissions = Array.isArray(role.permissions)
          ? (role.permissions as string[])
          : [];

        // Guardar en caché
        permissionsCache.set(roleId, userPermissions);
        setTimeout(() => permissionsCache.delete(roleId), 5 * 60 * 1000);
      }

      // Verificar si tiene al menos uno de los permisos
      const hasPermission = permissions.some((permission) =>
        userPermissions!.includes(permission)
      );

      if (!hasPermission) {
        return next(
          new ForbiddenError(
            `No tienes permisos para realizar esta acción. Se requiere uno de: ${permissions.join(', ')}`
          )
        );
      }

      // Agregar permisos al request
      (req as any).permissions = userPermissions;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware para verificar si el usuario tiene TODOS los permisos especificados
 */
export function requireAllPermissions(...permissions: string[]) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('No autenticado'));
      }

      const roleId = req.user.roleId;

      // SuperAdmin (roleId 0 o 1) siempre tiene acceso total
      if (roleId === 0 || roleId === 1) {
        return next();
      }

      // Verificar caché
      let userPermissions = permissionsCache.get(roleId);

      if (!userPermissions) {
        // Obtener permisos del rol
        const role = await prisma.role.findUnique({
          where: { id: roleId },
          select: { permissions: true },
        });

        if (!role) {
          return next(new ForbiddenError('Rol no encontrado'));
        }

        userPermissions = Array.isArray(role.permissions)
          ? (role.permissions as string[])
          : [];

        // Guardar en caché
        permissionsCache.set(roleId, userPermissions);
        setTimeout(() => permissionsCache.delete(roleId), 5 * 60 * 1000);
      }

      // Verificar si tiene todos los permisos
      const hasAllPermissions = permissions.every((permission) =>
        userPermissions!.includes(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = permissions.filter(
          (permission) => !userPermissions!.includes(permission)
        );
        return next(
          new ForbiddenError(
            `No tienes permisos para realizar esta acción. Faltan: ${missingPermissions.join(', ')}`
          )
        );
      }

      // Agregar permisos al request
      (req as any).permissions = userPermissions;

      next();
    } catch (error) {
      next(error);
    }
  };
}
