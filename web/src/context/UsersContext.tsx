import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserWithPassword, UserStatus, UserAddress } from '../types/user';

interface UsersContextType {
  users: User[];
  admins: User[];

  // Users (Clientes)
  addUser: (user: Omit<UserWithPassword, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUser: (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;

  // Admins
  addAdmin: (admin: Omit<UserWithPassword, 'id' | 'createdAt' | 'updatedAt'> & { roleId?: number }) => void;
  updateAdmin: (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>> & { roleId?: number }) => void;
  deleteAdmin: (id: string) => void;
  toggleAdminStatus: (id: string) => void;

  // Helpers
  getUserById: (id: string) => User | undefined;
  getAdminById: (id: string) => User | undefined;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

// Usar la misma clave que AuthContext para sincronizar
const AUTH_USERS_KEY = 'marketplace_users';

// Interfaz interna para usuarios de AuthContext
interface AuthUser {
  id: string;
  email: string;
  name: string;
  password: string;
  roleId: number; // 0 = superadmin, 1 = user, 2+ = roles personalizados
  createdAt: string | Date;
  profile?: {
    phone?: string;
    cedula?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  // Campos adicionales para el módulo de admin
  status?: UserStatus;
  phone?: string;
  cedula?: string;
  address?: UserAddress;
}

// Convertir roleId a role string para compatibilidad con el módulo de admin
const roleIdToRole = (roleId: number): 'user' | 'admin' | 'superadmin' => {
  if (roleId === 0) return 'superadmin';
  if (roleId === 1) return 'user';
  return 'admin'; // Roles personalizados (2+) son admins
};


// Convertir AuthUser a User para el módulo de admin
const authUserToAdminUser = (authUser: AuthUser): UserWithPassword => {
  const createdAt = typeof authUser.createdAt === 'string'
    ? new Date(authUser.createdAt)
    : authUser.createdAt;

  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.name,
    password: authUser.password,
    role: roleIdToRole(authUser.roleId),
    status: authUser.status || 'active',
    phone: authUser.phone || authUser.profile?.phone,
    cedula: authUser.cedula || authUser.profile?.cedula,
    address: authUser.address || (authUser.profile?.address ? {
      address: authUser.profile.address,
      city: authUser.profile.city || '',
      postalCode: authUser.profile.postalCode || '',
      country: authUser.profile.country || 'Colombia',
    } : undefined),
    createdAt,
    updatedAt: createdAt,
  };
};


// Datos iniciales si no hay nada en localStorage
const getInitialUsers = (): AuthUser[] => [
  {
    id: 'super-admin-001',
    email: 'admin@marketplace.com',
    password: 'admin123',
    name: 'Super Administrador',
    roleId: 0,
    status: 'active',
    phone: '+57 300 123 4567',
    cedula: '1234567890',
    address: {
      address: 'Calle 123 #45-67',
      city: 'Bogotá',
      postalCode: '110111',
      country: 'Colombia',
    },
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'user-demo-001',
    email: 'user@marketplace.com',
    password: 'cliente123',
    name: 'Usuario Demo',
    roleId: 1,
    status: 'active',
    phone: '+57 320 345 6789',
    cedula: '9876543210',
    address: {
      address: 'Carrera 50 #30-20',
      city: 'Medellín',
      postalCode: '050001',
      country: 'Colombia',
    },
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'user-003',
    email: 'cliente2@gmail.com',
    password: 'cliente123',
    name: 'Carlos López',
    roleId: 1,
    status: 'active',
    phone: '+57 315 456 7890',
    createdAt: new Date('2024-04-20'),
  },
  {
    id: 'user-004',
    email: 'cliente3@gmail.com',
    password: 'cliente123',
    name: 'Ana Martínez',
    roleId: 1,
    status: 'inactive',
    phone: '+57 318 567 8901',
    cedula: '5678901234',
    address: {
      address: 'Av. Principal 100',
      city: 'Cali',
      postalCode: '760001',
      country: 'Colombia',
    },
    createdAt: new Date('2024-05-05'),
  },
];

// Cargar usuarios desde localStorage
const loadAuthUsers = (): AuthUser[] => {
  const stored = localStorage.getItem(AUTH_USERS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((u: any) => ({
          ...u,
          createdAt: new Date(u.createdAt),
          // Asegurar que roleId existe
          roleId: typeof u.roleId === 'number' ? u.roleId : (u.role === 'superadmin' || u.role === 'admin' ? 0 : 1),
        }));
      }
    } catch (e) {
      console.error('Error loading users:', e);
    }
  }

  // Si no hay datos, guardar iniciales
  const initial = getInitialUsers();
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(initial));
  return initial;
};

// Guardar usuarios en localStorage
const saveAuthUsers = (users: AuthUser[]) => {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
};

export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const [authUsers, setAuthUsers] = useState<AuthUser[]>(loadAuthUsers);

  // Escuchar cambios en localStorage (por si AuthContext modifica los datos)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_USERS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setAuthUsers(parsed.map((u: any) => ({
            ...u,
            createdAt: new Date(u.createdAt),
            roleId: typeof u.roleId === 'number' ? u.roleId : 1,
          })));
        } catch (err) {
          console.error('Error parsing users from storage:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Guardar en localStorage cuando cambian los usuarios
  useEffect(() => {
    saveAuthUsers(authUsers);
  }, [authUsers]);

  // Convertir a formato del módulo admin
  const allUsers = authUsers.map(authUserToAdminUser);

  // Filtrar usuarios por rol
  const users = allUsers
    .filter((u) => u.role === 'user')
    .map(({ password: _, ...user }) => user);

  const admins = allUsers
    .filter((u) => u.role === 'admin' || u.role === 'superadmin')
    .map(({ password: _, ...admin }) => admin);

  // Métodos para Usuarios (Clientes)
  const addUser = useCallback((userData: Omit<UserWithPassword, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      email: userData.email,
      password: userData.password,
      name: userData.name,
      roleId: 1, // Siempre usuario normal
      status: userData.status || 'active',
      phone: userData.phone,
      cedula: userData.cedula,
      address: userData.address,
      createdAt: new Date(),
    };
    setAuthUsers((prev) => [...prev, newUser]);
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>) => {
    setAuthUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          return {
            ...u,
            ...updates,
            // Actualizar profile si hay cambios de dirección
            profile: {
              ...u.profile,
              phone: updates.phone || u.profile?.phone,
              cedula: updates.cedula || u.profile?.cedula,
              address: updates.address?.address || u.profile?.address,
              city: updates.address?.city || u.profile?.city,
              postalCode: updates.address?.postalCode || u.profile?.postalCode,
              country: updates.address?.country || u.profile?.country,
            },
          };
        }
        return u;
      })
    );
  }, []);

  const deleteUser = useCallback((id: string) => {
    setAuthUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const toggleUserStatus = useCallback((id: string) => {
    setAuthUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatus: UserStatus = u.status === 'active' ? 'inactive' : 'active';
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  }, []);

  // Métodos para Administradores
  const addAdmin = useCallback((adminData: Omit<UserWithPassword, 'id' | 'createdAt' | 'updatedAt'> & { roleId?: number }) => {
    // Determinar roleId basado en el rol o usar el proporcionado
    let roleId = adminData.roleId;
    if (roleId === undefined) {
      roleId = adminData.role === 'superadmin' ? 0 : 2; // 2 = admin básico
    }

    const newAdmin: AuthUser = {
      id: `admin-${Date.now()}`,
      email: adminData.email,
      password: adminData.password,
      name: adminData.name,
      roleId,
      status: adminData.status || 'active',
      phone: adminData.phone,
      cedula: adminData.cedula,
      address: adminData.address,
      createdAt: new Date(),
    };
    setAuthUsers((prev) => [...prev, newAdmin]);
  }, []);

  const updateAdmin = useCallback((id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>> & { roleId?: number }) => {
    setAuthUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updatedUser = {
            ...u,
            ...updates,
            // Actualizar roleId si se proporciona
            roleId: updates.roleId ?? u.roleId,
            // Actualizar profile
            profile: {
              ...u.profile,
              phone: updates.phone || u.profile?.phone,
              cedula: updates.cedula || u.profile?.cedula,
              address: updates.address?.address || u.profile?.address,
              city: updates.address?.city || u.profile?.city,
              postalCode: updates.address?.postalCode || u.profile?.postalCode,
              country: updates.address?.country || u.profile?.country,
            },
          };
          return updatedUser;
        }
        return u;
      })
    );
  }, []);

  const deleteAdmin = useCallback((id: string) => {
    // No permitir eliminar superadmin
    const user = authUsers.find((u) => u.id === id);
    if (user?.roleId === 0) {
      console.error('No se puede eliminar el superadmin');
      return;
    }
    setAuthUsers((prev) => prev.filter((u) => u.id !== id));
  }, [authUsers]);

  const toggleAdminStatus = useCallback((id: string) => {
    // No permitir desactivar superadmin
    const user = authUsers.find((u) => u.id === id);
    if (user?.roleId === 0) {
      console.error('No se puede desactivar el superadmin');
      return;
    }
    setAuthUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatus: UserStatus = u.status === 'active' ? 'inactive' : 'active';
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  }, [authUsers]);

  // Helpers
  const getUserById = useCallback((id: string) => {
    const user = allUsers.find((u) => u.id === id && u.role === 'user');
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return undefined;
  }, [allUsers]);

  const getAdminById = useCallback((id: string) => {
    const admin = allUsers.find((u) => u.id === id && (u.role === 'admin' || u.role === 'superadmin'));
    if (admin) {
      const { password: _, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    }
    return undefined;
  }, [allUsers]);

  return (
    <UsersContext.Provider
      value={{
        users,
        admins,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        addAdmin,
        updateAdmin,
        deleteAdmin,
        toggleAdminStatus,
        getUserById,
        getAdminById,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};
