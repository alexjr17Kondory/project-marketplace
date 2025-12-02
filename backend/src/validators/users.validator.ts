import { z } from 'zod';

// Crear usuario (admin)
export const createUserSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres'),
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .transform((val) => val.trim()),
  phone: z.string().optional(),
  cedula: z.string().optional(),
  roleId: z.number().int().positive('Role ID inválido'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

// Actualizar usuario
export const updateUserSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .transform((val) => val.toLowerCase().trim())
    .optional(),
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .transform((val) => val.trim())
    .optional(),
  phone: z.string().optional(),
  cedula: z.string().optional(),
  roleId: z.number().int().positive('Role ID inválido').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

// Actualizar perfil propio
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .transform((val) => val.trim())
    .optional(),
  phone: z.string().optional(),
  cedula: z.string().optional(),
});

// Query params para listar usuarios
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  roleId: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ID param
export const userIdSchema = z.object({
  id: z.string().min(1, 'ID de usuario requerido'),
});

// Dirección
export const addressSchema = z.object({
  label: z.string().min(1, 'Etiqueta requerida').max(50),
  address: z.string().min(5, 'Dirección muy corta').max(200),
  city: z.string().min(2, 'Ciudad requerida').max(100),
  department: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('Colombia'),
  isDefault: z.boolean().default(false),
});

export const addressIdSchema = z.object({
  addressId: z.string().min(1, 'ID de dirección requerido'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type AddressInput = z.infer<typeof addressSchema>;
