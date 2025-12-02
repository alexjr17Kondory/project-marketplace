import { prisma } from '../config/database';
import { hashPassword } from '../utils/password';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../utils/errors';
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateProfileInput,
  ListUsersQuery,
  AddressInput,
} from '../validators/users.validator';

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  cedula: string | null;
  avatar: string | null;
  roleId: number;
  role: string;
  permissions: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedUsers {
  data: UserResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function formatUserResponse(user: any): UserResponse {
  const permissions = Array.isArray(user.role?.permissions)
    ? user.role.permissions as string[]
    : [];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    cedula: user.cedula,
    avatar: user.avatar,
    roleId: user.roleId,
    role: user.role?.name || '',
    permissions,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// Listar usuarios con paginación
export async function listUsers(query: ListUsersQuery): Promise<PaginatedUsers> {
  const { page, limit, search, status, roleId, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { cedula: { contains: search } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (roleId) {
    where.roleId = roleId;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { role: true },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users.map(formatUserResponse),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Obtener usuario por ID
export async function getUserById(id: number): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  return formatUserResponse(user);
}

// Crear usuario (admin)
export async function createUser(data: CreateUserInput): Promise<UserResponse> {
  // Verificar email único
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ConflictError('El email ya está registrado');
  }

  // Verificar que el rol existe
  const role = await prisma.role.findUnique({
    where: { id: data.roleId },
  });

  if (!role) {
    throw new BadRequestError('El rol especificado no existe');
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      phone: data.phone || null,
      cedula: data.cedula || null,
      roleId: data.roleId,
      status: data.status || 'ACTIVE',
    },
    include: { role: true },
  });

  return formatUserResponse(user);
}

// Actualizar usuario (admin)
export async function updateUser(id: number, data: UpdateUserInput): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Si se cambia el email, verificar que sea único
  if (data.email && data.email !== user.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('El email ya está en uso');
    }
  }

  // Si se cambia el rol, verificar que existe
  if (data.roleId) {
    const role = await prisma.role.findUnique({
      where: { id: data.roleId },
    });

    if (!role) {
      throw new BadRequestError('El rol especificado no existe');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      email: data.email,
      name: data.name,
      phone: data.phone,
      cedula: data.cedula,
      roleId: data.roleId,
      status: data.status,
    },
    include: { role: true },
  });

  return formatUserResponse(updatedUser);
}

// Actualizar perfil propio
export async function updateProfile(userId: number, data: UpdateProfileInput): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      phone: data.phone,
      cedula: data.cedula,
    },
    include: { role: true },
  });

  return formatUserResponse(updatedUser);
}

// Eliminar usuario
export async function deleteUser(id: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // No permitir eliminar superadmins (roleId = 1)
  if (user.roleId === 1) {
    throw new BadRequestError('No se puede eliminar un superadmin');
  }

  await prisma.user.delete({
    where: { id },
  });
}

// ==================== DIRECCIONES ====================

export async function getUserAddresses(userId: number) {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return addresses;
}

export async function createAddress(userId: number, data: AddressInput) {
  // Si es default, quitar default de otras
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      userId,
      ...data,
    },
  });

  return address;
}

export async function updateAddress(userId: number, addressId: number, data: AddressInput) {
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    throw new NotFoundError('Dirección no encontrada');
  }

  // Si es default, quitar default de otras
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true, id: { not: addressId } },
      data: { isDefault: false },
    });
  }

  const updatedAddress = await prisma.address.update({
    where: { id: addressId },
    data,
  });

  return updatedAddress;
}

export async function deleteAddress(userId: number, addressId: number) {
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    throw new NotFoundError('Dirección no encontrada');
  }

  await prisma.address.delete({
    where: { id: addressId },
  });
}

export async function setDefaultAddress(userId: number, addressId: number) {
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    throw new NotFoundError('Dirección no encontrada');
  }

  // Quitar default de todas
  await prisma.address.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });

  // Establecer nueva default
  const updatedAddress = await prisma.address.update({
    where: { id: addressId },
    data: { isDefault: true },
  });

  return updatedAddress;
}
