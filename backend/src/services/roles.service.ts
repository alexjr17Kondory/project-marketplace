import { prisma } from '../config/database';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errors';
import type {
  CreateRoleInput,
  UpdateRoleInput,
  ListRolesInput,
} from '../validators/roles.validator';
import { AVAILABLE_PERMISSIONS, PERMISSION_GROUPS } from '../validators/roles.validator';

// Roles del sistema que no pueden ser eliminados ni modificados
const SYSTEM_ROLE_IDS = [1, 2, 3]; // SuperAdmin, Admin, Cliente

// Generar slug desde nombre
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Obtener todos los roles
export async function getAllRoles(params: ListRolesInput) {
  const { page, limit, search, isActive, includeUsers } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [roles, total] = await Promise.all([
    prisma.role.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: 'asc' },
      include: includeUsers
        ? {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
              take: 10,
            },
            _count: {
              select: { users: true },
            },
          }
        : {
            _count: {
              select: { users: true },
            },
          },
    }),
    prisma.role.count({ where }),
  ]);

  return {
    data: roles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Obtener rol por ID
export async function getRoleById(id: number, includeUsers = false) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: includeUsers
      ? {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              status: true,
              createdAt: true,
            },
          },
          _count: {
            select: { users: true },
          },
        }
      : {
          _count: {
            select: { users: true },
          },
        },
  });

  if (!role) {
    throw new NotFoundError('Rol no encontrado');
  }

  return role;
}

// Crear rol
export async function createRole(data: CreateRoleInput) {
  // Verificar nombre único
  const existing = await prisma.role.findFirst({
    where: { name: data.name },
  });

  if (existing) {
    throw new ConflictError(`Ya existe un rol con el nombre "${data.name}"`);
  }

  const slug = generateSlug(data.name);

  const role = await prisma.role.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      permissions: data.permissions,
      isActive: data.isActive ?? true,
      isSystem: false,
    },
  });

  return role;
}

// Actualizar rol
export async function updateRole(id: number, data: UpdateRoleInput) {
  const role = await prisma.role.findUnique({
    where: { id },
  });

  if (!role) {
    throw new NotFoundError('Rol no encontrado');
  }

  // No permitir modificar roles del sistema (excepto activar/desactivar)
  if (role.isSystem && (data.name || data.permissions)) {
    throw new ForbiddenError('No se pueden modificar los roles del sistema');
  }

  // Verificar nombre único si se está actualizando
  if (data.name && data.name !== role.name) {
    const existing = await prisma.role.findFirst({
      where: { name: data.name, id: { not: id } },
    });

    if (existing) {
      throw new ConflictError(`Ya existe un rol con el nombre "${data.name}"`);
    }
  }

  const updatedRole = await prisma.role.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.permissions && { permissions: data.permissions }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return updatedRole;
}

// Eliminar rol
export async function deleteRole(id: number) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  if (!role) {
    throw new NotFoundError('Rol no encontrado');
  }

  // No permitir eliminar roles del sistema
  if (role.isSystem) {
    throw new ForbiddenError('No se pueden eliminar los roles del sistema');
  }

  // No permitir eliminar si hay usuarios con este rol
  if (role._count.users > 0) {
    throw new ConflictError(
      `No se puede eliminar el rol porque tiene ${role._count.users} usuario(s) asignado(s)`
    );
  }

  await prisma.role.delete({
    where: { id },
  });

  return { message: 'Rol eliminado exitosamente' };
}

// Asignar rol a usuario
export async function assignRoleToUser(userId: number, roleId: number) {
  // Verificar que el rol existe
  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new NotFoundError('Rol no encontrado');
  }

  if (!role.isActive) {
    throw new ForbiddenError('No se puede asignar un rol inactivo');
  }

  // Verificar que el usuario existe
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Actualizar rol del usuario
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { roleId },
    select: {
      id: true,
      name: true,
      email: true,
      role: {
        select: {
          id: true,
          name: true,
          permissions: true,
        },
      },
    },
  });

  return updatedUser;
}

// Obtener usuarios por rol
export async function getUsersByRole(roleId: number, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new NotFoundError('Rol no encontrado');
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { roleId },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where: { roleId } }),
  ]);

  return {
    role: {
      id: role.id,
      name: role.name,
    },
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Obtener todos los permisos disponibles
export function getAvailablePermissions() {
  return {
    permissions: AVAILABLE_PERMISSIONS,
    groups: PERMISSION_GROUPS,
  };
}

// Verificar si un rol tiene un permiso específico
export async function roleHasPermission(roleId: number, permission: string): Promise<boolean> {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { permissions: true },
  });

  if (!role) {
    return false;
  }

  const permissions = role.permissions as string[];
  return permissions.includes(permission);
}

// Obtener estadísticas de roles
export async function getRolesStats() {
  const [totalRoles, activeRoles, usersPerRole] = await Promise.all([
    prisma.role.count(),
    prisma.role.count({ where: { isActive: true } }),
    prisma.role.findMany({
      select: {
        id: true,
        name: true,
        isSystem: true,
        isActive: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { id: 'asc' },
    }),
  ]);

  return {
    totalRoles,
    activeRoles,
    inactiveRoles: totalRoles - activeRoles,
    distribution: usersPerRole.map((role) => ({
      id: role.id,
      name: role.name,
      isSystem: role.isSystem,
      isActive: role.isActive,
      userCount: role._count.users,
    })),
  };
}
