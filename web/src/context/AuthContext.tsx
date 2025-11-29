import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { Role, Permission } from '../types/roles';
import { SYSTEM_ROLES, hasPermission, hasModuleAccess, canAccessAdmin } from '../types/roles';
import type { AdminModule } from '../types/roles';

export interface UserProfile {
  phone?: string;
  cedula?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  roleId: number; // ID del rol (0 = super admin, 1 = usuario normal, 2+ = roles personalizados)
  createdAt: Date;
  profile?: UserProfile;
}

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean; // Rol 0
  isAdmin: boolean; // Cualquier rol con acceso al admin (excepto rol 1)
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile> & { name?: string }) => Promise<void>;
  // Recuperación de contraseña
  requestPasswordReset: (email: string) => Promise<void>;
  validateResetToken: (token: string, email: string) => Promise<boolean>;
  resetPassword: (token: string, email: string, newPassword: string) => Promise<void>;
  // Helpers de permisos
  hasPermission: (permission: Permission) => boolean;
  hasModuleAccess: (module: AdminModule) => boolean;
  canAccessAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'marketplace_auth';
const USERS_STORAGE_KEY = 'marketplace_users';
const RESET_TOKENS_KEY = 'marketplace_reset_tokens';

// Interfaz para tokens de reset
interface ResetToken {
  email: string;
  token: string;
  expiresAt: number; // timestamp
}

// Mock users iniciales
const INITIAL_MOCK_USERS: Array<User & { password: string }> = [
  {
    id: 'super-admin-001',
    email: 'admin@marketplace.com',
    password: 'admin123',
    name: 'Super Administrador',
    roleId: 0, // Super Admin
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'user-demo-001',
    email: 'user@marketplace.com',
    password: 'cliente123',
    name: 'Usuario Demo',
    roleId: 1, // Usuario normal
    createdAt: new Date('2024-01-15'),
  },
];

// Migrar usuarios antiguos (con role string) a roleId number
const migrateUser = (u: any): User & { password: string } => {
  // Si ya tiene roleId, mantenerlo
  if (typeof u.roleId === 'number') {
    return {
      ...u,
      createdAt: new Date(u.createdAt),
    };
  }

  // Migrar de role (string) a roleId (number)
  let roleId = 1; // Por defecto usuario normal
  if (u.role === 'admin' || u.role === 'superadmin') {
    roleId = 0; // Super Admin
  }

  const { role, ...userWithoutRole } = u;
  return {
    ...userWithoutRole,
    roleId,
    createdAt: new Date(u.createdAt),
  };
};

// Cargar usuarios desde localStorage o usar los iniciales
const loadUsers = (): Array<User & { password: string }> => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const migratedUsers = parsed.map(migrateUser);

      // Verificar si hay un super admin (roleId: 0), si no, agregarlo
      const hasSuperAdmin = migratedUsers.some((u: any) => u.roleId === 0);
      if (!hasSuperAdmin) {
        migratedUsers.unshift(INITIAL_MOCK_USERS[0]);
      }

      // Guardar usuarios migrados
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(migratedUsers));
      return migratedUsers;
    } catch (e) {
      console.error('Error loading users from localStorage:', e);
    }
  }
  // Guardar usuarios iniciales
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_USERS));
  return INITIAL_MOCK_USERS;
};

// Variable global para usuarios (se sincroniza con localStorage)
let MOCK_USERS = loadUsers();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        // Migrar usuario logueado si tiene formato antiguo (role string)
        if (typeof parsed.roleId !== 'number') {
          let roleId = 1;
          if (parsed.role === 'admin' || parsed.role === 'superadmin') {
            roleId = 0;
          }
          const { role, ...userWithoutRole } = parsed;
          const migratedUser = {
            ...userWithoutRole,
            roleId,
            createdAt: new Date(parsed.createdAt),
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedUser));
          return migratedUser;
        }

        return {
          ...parsed,
          createdAt: new Date(parsed.createdAt),
        };
      } catch (e) {
        console.error('Error loading auth from localStorage:', e);
      }
    }
    return null;
  });

  // Cargar roles desde localStorage (incluyendo personalizados)
  const [roles, setRoles] = useState<Role[]>(() => {
    const stored = localStorage.getItem('marketplace_roles');
    if (stored) {
      try {
        const customRoles = JSON.parse(stored).map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        }));
        return [...SYSTEM_ROLES, ...customRoles];
      } catch (e) {
        console.error('Error loading roles:', e);
      }
    }
    return SYSTEM_ROLES;
  });

  // Obtener el rol actual del usuario
  const role = user ? roles.find(r => r.id === user.roleId) || null : null;

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  // Escuchar cambios en roles
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'marketplace_roles' && e.newValue) {
        try {
          const customRoles = JSON.parse(e.newValue).map((r: any) => ({
            ...r,
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt),
          }));
          setRoles([...SYSTEM_ROLES, ...customRoles]);
        } catch (err) {
          console.error('Error parsing roles:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));

    // Recargar usuarios por si hay cambios
    MOCK_USERS = loadUsers();

    const foundUser = MOCK_USERS.find(
      u => u.email === email && u.password === password
    );

    if (!foundUser) {
      throw new Error('Email o contraseña incorrectos');
    }

    const { password: _, ...userWithoutPassword } = foundUser;
    setUser(userWithoutPassword);
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));

    // Recargar usuarios
    MOCK_USERS = loadUsers();

    // Verificar si el email ya existe
    const emailExists = MOCK_USERS.some(u => u.email === email);
    if (emailExists) {
      throw new Error('Este email ya está registrado');
    }

    // Crear nuevo usuario con rol 1 (usuario normal)
    const newUser: User & { password: string } = {
      id: `user-${Date.now()}`,
      email,
      password,
      name,
      roleId: 1, // Siempre rol 1 para usuarios que se registran
      createdAt: new Date(),
    };

    MOCK_USERS.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(MOCK_USERS));

    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const updateProfile = async (profileData: Partial<UserProfile> & { name?: string }): Promise<void> => {
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 300));

    const { name, ...profileFields } = profileData;

    const updatedUser = {
      ...user,
      name: name || user.name,
      profile: {
        ...user.profile,
        ...profileFields,
      },
    };

    // Actualizar en MOCK_USERS
    MOCK_USERS = loadUsers();
    const userIndex = MOCK_USERS.findIndex(u => u.id === user.id);
    if (userIndex >= 0) {
      MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], ...updatedUser };
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(MOCK_USERS));
    }

    setUser(updatedUser);
  };

  // Solicitar reset de contraseña
  const requestPasswordReset = async (email: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Recargar usuarios
    MOCK_USERS = loadUsers();

    // Verificar si el email existe
    const userExists = MOCK_USERS.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (!userExists) {
      throw new Error('No existe una cuenta con este email');
    }

    // Generar token único
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hora

    // Guardar token
    const storedTokens: ResetToken[] = JSON.parse(localStorage.getItem(RESET_TOKENS_KEY) || '[]');
    // Eliminar tokens antiguos del mismo email
    const filteredTokens = storedTokens.filter(t => t.email.toLowerCase() !== email.toLowerCase());
    filteredTokens.push({ email: email.toLowerCase(), token, expiresAt });
    localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(filteredTokens));

    // En desarrollo, mostrar el enlace en consola
    const resetUrl = `${window.location.origin}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    console.log('🔐 Enlace de recuperación de contraseña:');
    console.log(resetUrl);
    console.log('(Este enlace expira en 1 hora)');
  };

  // Validar token de reset
  const validateResetToken = async (token: string, email: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const storedTokens: ResetToken[] = JSON.parse(localStorage.getItem(RESET_TOKENS_KEY) || '[]');
    const foundToken = storedTokens.find(
      t => t.token === token && t.email.toLowerCase() === email.toLowerCase()
    );

    if (!foundToken) return false;
    if (Date.now() > foundToken.expiresAt) return false;

    return true;
  };

  // Reset de contraseña
  const resetPassword = async (token: string, email: string, newPassword: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Validar token
    const isValid = await validateResetToken(token, email);
    if (!isValid) {
      throw new Error('El enlace de recuperación no es válido o ha expirado');
    }

    // Actualizar contraseña
    MOCK_USERS = loadUsers();
    const userIndex = MOCK_USERS.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (userIndex < 0) {
      throw new Error('Usuario no encontrado');
    }

    MOCK_USERS[userIndex].password = newPassword;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(MOCK_USERS));

    // Eliminar token usado
    const storedTokens: ResetToken[] = JSON.parse(localStorage.getItem(RESET_TOKENS_KEY) || '[]');
    const filteredTokens = storedTokens.filter(t => t.token !== token);
    localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(filteredTokens));
  };

  // Helper: verificar permiso
  const checkPermission = (permission: Permission): boolean => {
    return hasPermission(role, permission);
  };

  // Helper: verificar acceso a módulo
  const checkModuleAccess = (module: AdminModule): boolean => {
    return hasModuleAccess(role, module);
  };

  // Helper: verificar acceso al admin
  const checkCanAccessAdmin = (): boolean => {
    return canAccessAdmin(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isSuperAdmin: user?.roleId === 0,
        isAdmin: !!role && canAccessAdmin(role),
        login,
        register,
        logout,
        updateProfile,
        requestPasswordReset,
        validateResetToken,
        resetPassword,
        hasPermission: checkPermission,
        hasModuleAccess: checkModuleAccess,
        canAccessAdmin: checkCanAccessAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
