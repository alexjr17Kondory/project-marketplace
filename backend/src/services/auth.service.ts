import crypto from 'crypto';
import { prisma } from '../config/database';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from '../utils/errors';
import type {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
} from '../validators/auth.validator';

// Rol por defecto para usuarios nuevos
const DEFAULT_USER_ROLE_ID = 2;

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    name: string;
    phone: string | null;
    avatar: string | null;
    roleId: number;
    role: string;
    permissions: string[];
    status: string;
  };
  token: string;
}

export async function register(data: RegisterInput): Promise<AuthResponse> {
  // Verificar si el email ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ConflictError('El email ya está registrado');
  }

  // Verificar que existe el rol por defecto
  const defaultRole = await prisma.role.findUnique({
    where: { id: DEFAULT_USER_ROLE_ID },
  });

  if (!defaultRole) {
    throw new BadRequestError('Error de configuración: rol por defecto no encontrado');
  }

  // Crear usuario
  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      phone: data.phone || null,
      roleId: DEFAULT_USER_ROLE_ID,
    },
    include: {
      role: true,
    },
  });

  // Generar token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
  });

  const permissions = Array.isArray(user.role.permissions)
    ? user.role.permissions as string[]
    : [];

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      roleId: user.roleId,
      role: user.role.name,
      permissions,
      status: user.status,
    },
    token,
  };
}

export async function login(data: LoginInput): Promise<AuthResponse> {
  // Buscar usuario por email
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: {
      role: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  // Verificar contraseña
  const isValidPassword = await verifyPassword(data.password, user.passwordHash);

  if (!isValidPassword) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  // Verificar que el usuario esté activo
  if (user.status !== 'ACTIVE') {
    throw new UnauthorizedError('Tu cuenta está desactivada. Contacta al administrador.');
  }

  // Generar token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
  });

  const permissions = Array.isArray(user.role.permissions)
    ? user.role.permissions as string[]
    : [];

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      roleId: user.roleId,
      role: user.role.name,
      permissions,
      status: user.status,
    },
    token,
  };
}

export async function getMe(userId: number): Promise<AuthResponse['user']> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
    },
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const permissions = Array.isArray(user.role.permissions)
    ? user.role.permissions as string[]
    : [];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatar: user.avatar,
    roleId: user.roleId,
    role: user.role.name,
    permissions,
    status: user.status,
  };
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // No revelar si el email existe o no
  if (!user) {
    console.log(`[Auth] Intento de recuperación para email no existente: ${email}`);
    return;
  }

  // Generar token de reset
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: resetTokenHash,
      resetTokenExp,
    },
  });

  // En desarrollo, mostrar el token en consola
  console.log(`[Auth] Token de recuperación para ${email}: ${resetToken}`);
  console.log(`[Auth] URL de reset: http://localhost:5173/reset-password?token=${resetToken}`);

  // TODO: Enviar email con el link de reset
}

export async function resetPassword(data: ResetPasswordInput): Promise<void> {
  // Hashear el token recibido para comparar
  const resetTokenHash = crypto.createHash('sha256').update(data.token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      resetToken: resetTokenHash,
      resetTokenExp: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new BadRequestError('Token inválido o expirado');
  }

  // Actualizar contraseña y limpiar token
  const passwordHash = await hashPassword(data.password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExp: null,
    },
  });

  console.log(`[Auth] Contraseña reseteada para: ${user.email}`);
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Verificar contraseña actual
  const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);

  if (!isValidPassword) {
    throw new BadRequestError('La contraseña actual es incorrecta');
  }

  // Actualizar contraseña
  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  cedula?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface UpdateProfileResponse {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  roleId: number;
  role: string;
  permissions: string[];
  status: string;
  profile?: {
    cedula?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
}

export async function updateMe(
  userId: number,
  data: UpdateProfileInput
): Promise<UpdateProfileResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      addresses: {
        where: { isDefault: true },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Actualizar datos básicos del usuario
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name ?? user.name,
      phone: data.phone ?? user.phone,
      cedula: data.cedula ?? user.cedula,
    },
    include: {
      role: true,
    },
  });

  // Manejar la dirección
  let address = user.addresses[0];

  if (data.address || data.city || data.postalCode || data.country) {
    if (address) {
      // Actualizar dirección existente
      address = await prisma.address.update({
        where: { id: address.id },
        data: {
          address: data.address ?? address.address,
          city: data.city ?? address.city,
          postalCode: data.postalCode ?? address.postalCode,
          country: data.country ?? address.country,
        },
      });
    } else {
      // Crear nueva dirección por defecto
      address = await prisma.address.create({
        data: {
          userId,
          label: 'Principal',
          address: data.address || '',
          city: data.city || '',
          postalCode: data.postalCode || '',
          country: data.country || 'Colombia',
          isDefault: true,
        },
      });
    }
  }

  const permissions = Array.isArray(updatedUser.role.permissions)
    ? updatedUser.role.permissions as string[]
    : [];

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    phone: updatedUser.phone,
    avatar: updatedUser.avatar,
    roleId: updatedUser.roleId,
    role: updatedUser.role.name,
    permissions,
    status: updatedUser.status,
    profile: {
      cedula: updatedUser.cedula || undefined,
      phone: updatedUser.phone || undefined,
      address: address?.address,
      city: address?.city,
      postalCode: address?.postalCode || undefined,
      country: address?.country,
    },
  };
}
