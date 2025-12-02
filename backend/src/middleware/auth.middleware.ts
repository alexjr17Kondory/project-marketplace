import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Token no proporcionado');
    }

    const payload = verifyToken(token);
    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Token inválido o expirado'));
    }
  }
}

// Middleware para verificar roles específicos
export function requireRole(...allowedRoleIds: number[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('No autenticado'));
    }

    if (!allowedRoleIds.includes(req.user.roleId)) {
      return next(new ForbiddenError('No tienes permisos para acceder a este recurso'));
    }

    next();
  };
}

// Middleware para verificar si es admin (roleId 1 = SuperAdmin, roleId otros pueden ser admins)
export function requireAdmin(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError('No autenticado'));
  }

  // RoleId 1 es SuperAdmin
  if (req.user.roleId !== 1) {
    return next(new ForbiddenError('Se requieren permisos de administrador'));
  }

  next();
}
