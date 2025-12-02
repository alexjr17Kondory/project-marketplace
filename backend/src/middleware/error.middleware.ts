import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { env } from '../config/env';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log del error en desarrollo
  if (env.isDevelopment) {
    console.error('❌ Error:', err);
  }

  // Error de Zod (validación)
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((error) => {
      const path = error.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(error.message);
    });

    res.status(422).json({
      success: false,
      message: 'Error de validación',
      errors,
    });
    return;
  }

  // Error de validación personalizado
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  // Error operacional (conocido)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(env.isDevelopment && { stack: err.stack }),
    });
    return;
  }

  // Error desconocido
  res.status(500).json({
    success: false,
    message: env.isDevelopment ? err.message : 'Error interno del servidor',
    ...(env.isDevelopment && { stack: err.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}
