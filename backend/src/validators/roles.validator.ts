import { z } from 'zod';

// Lista de permisos disponibles en el sistema
export const AVAILABLE_PERMISSIONS = [
  // Dashboard
  'dashboard.view',

  // Productos
  'products.view',
  'products.create',
  'products.edit',
  'products.delete',

  // Pedidos
  'orders.view',
  'orders.create',
  'orders.edit',
  'orders.delete',

  // Usuarios
  'users.view',
  'users.create',
  'users.edit',
  'users.delete',

  // Roles
  'roles.view',
  'roles.create',
  'roles.edit',
  'roles.delete',

  // Configuración
  'settings.view',
  'settings.edit',

  // Reportes
  'reports.view',
  'reports.export',

  // Catálogos
  'catalogs.view',
  'catalogs.create',
  'catalogs.edit',
  'catalogs.delete',
] as const;

export type Permission = (typeof AVAILABLE_PERMISSIONS)[number];

// Agrupación de permisos por módulo
export const PERMISSION_GROUPS = {
  dashboard: ['dashboard.view'],
  products: ['products.view', 'products.create', 'products.edit', 'products.delete'],
  orders: ['orders.view', 'orders.create', 'orders.edit', 'orders.delete'],
  users: ['users.view', 'users.create', 'users.edit', 'users.delete'],
  roles: ['roles.view', 'roles.create', 'roles.edit', 'roles.delete'],
  settings: ['settings.view', 'settings.edit'],
  reports: ['reports.view', 'reports.export'],
  catalogs: ['catalogs.view', 'catalogs.create', 'catalogs.edit', 'catalogs.delete'],
} as const;

// Crear rol
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(50, 'Nombre no puede exceder 50 caracteres'),
  description: z
    .string()
    .min(5, 'Descripción debe tener al menos 5 caracteres')
    .max(200, 'Descripción no puede exceder 200 caracteres'),
  permissions: z
    .array(z.enum(AVAILABLE_PERMISSIONS as unknown as [string, ...string[]]))
    .min(1, 'Debe tener al menos un permiso'),
  isActive: z.boolean().default(true),
});

// Actualizar rol
export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(50, 'Nombre no puede exceder 50 caracteres')
    .optional(),
  description: z
    .string()
    .min(5, 'Descripción debe tener al menos 5 caracteres')
    .max(200, 'Descripción no puede exceder 200 caracteres')
    .optional(),
  permissions: z
    .array(z.enum(AVAILABLE_PERMISSIONS as unknown as [string, ...string[]]))
    .min(1, 'Debe tener al menos un permiso')
    .optional(),
  isActive: z.boolean().optional(),
});

// Asignar rol a usuario
export const assignRoleSchema = z.object({
  userId: z.string().min(1, 'ID de usuario requerido'),
  roleId: z.coerce.number().int().positive('ID de rol inválido'),
});

// Parámetros de listado
export const listRolesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  includeUsers: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
});

// ID de rol
export const roleIdSchema = z.object({
  id: z.coerce.number().int().positive('ID de rol inválido'),
});

// Types
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type ListRolesInput = z.infer<typeof listRolesSchema>;
