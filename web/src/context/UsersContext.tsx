import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserWithPassword, UserStatus } from '../types/user';

interface UsersContextType {
  users: User[];
  admins: User[];

  // Users (Clientes)
  addUser: (user: Omit<UserWithPassword, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUser: (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;

  // Admins
  addAdmin: (admin: Omit<UserWithPassword, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAdmin: (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>) => void;
  deleteAdmin: (id: string) => void;
  toggleAdminStatus: (id: string) => void;

  // Helpers
  getUserById: (id: string) => User | undefined;
  getAdminById: (id: string) => User | undefined;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

const STORAGE_KEY = 'marketplace_users';

// Datos iniciales de usuarios
const initialUsers: UserWithPassword[] = [
  {
    id: '1',
    email: 'admin@marketplace.com',
    password: 'admin123',
    name: 'Administrador Principal',
    role: 'superadmin',
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
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    email: 'admin2@marketplace.com',
    password: 'admin123',
    name: 'Juan Pérez',
    role: 'admin',
    status: 'active',
    phone: '+57 310 234 5678',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: '3',
    email: 'user@marketplace.com',
    password: 'user123',
    name: 'María García',
    role: 'user',
    status: 'active',
    phone: '+57 320 345 6789',
    cedula: '9876543210',
    address: {
      address: 'Carrera 50 #30-20',
      city: 'Medellín',
      postalCode: '050001',
      country: 'Colombia',
    },
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    id: '4',
    email: 'cliente2@gmail.com',
    password: 'cliente123',
    name: 'Carlos López',
    role: 'user',
    status: 'active',
    phone: '+57 315 456 7890',
    createdAt: new Date('2024-04-20'),
    updatedAt: new Date('2024-04-20'),
  },
  {
    id: '5',
    email: 'cliente3@gmail.com',
    password: 'cliente123',
    name: 'Ana Martínez',
    role: 'user',
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
    updatedAt: new Date('2024-06-15'),
  },
];

export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const [allUsers, setAllUsers] = useState<UserWithPassword[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored).map((u: UserWithPassword) => ({
          ...u,
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt),
        }));
      } catch (e) {
        console.error('Error loading users:', e);
      }
    }
    return initialUsers;
  });

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));
  }, [allUsers]);

  // Filtrar usuarios por rol
  const users = allUsers
    .filter((u) => u.role === 'user')
    .map(({ password: _, ...user }) => user);

  const admins = allUsers
    .filter((u) => u.role === 'admin' || u.role === 'superadmin')
    .map(({ password: _, ...admin }) => admin);

  // Métodos para Usuarios (Clientes)
  const addUser = (userData: Omit<UserWithPassword, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newUser: UserWithPassword = {
      ...userData,
      id: Date.now().toString(),
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAllUsers((prev) => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>) => {
    setAllUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, ...updates, updatedAt: new Date() } : u
      )
    );
  };

  const deleteUser = (id: string) => {
    setAllUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const toggleUserStatus = (id: string) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatus: UserStatus = u.status === 'active' ? 'inactive' : 'active';
          return { ...u, status: newStatus, updatedAt: new Date() };
        }
        return u;
      })
    );
  };

  // Métodos para Administradores
  const addAdmin = (adminData: Omit<UserWithPassword, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAdmin: UserWithPassword = {
      ...adminData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAllUsers((prev) => [...prev, newAdmin]);
  };

  const updateAdmin = (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>) => {
    setAllUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, ...updates, updatedAt: new Date() } : u
      )
    );
  };

  const deleteAdmin = (id: string) => {
    // No permitir eliminar superadmin
    const user = allUsers.find((u) => u.id === id);
    if (user?.role === 'superadmin') {
      console.error('No se puede eliminar el superadmin');
      return;
    }
    setAllUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const toggleAdminStatus = (id: string) => {
    // No permitir desactivar superadmin
    const user = allUsers.find((u) => u.id === id);
    if (user?.role === 'superadmin') {
      console.error('No se puede desactivar el superadmin');
      return;
    }
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatus: UserStatus = u.status === 'active' ? 'inactive' : 'active';
          return { ...u, status: newStatus, updatedAt: new Date() };
        }
        return u;
      })
    );
  };

  // Helpers
  const getUserById = (id: string) => {
    const user = allUsers.find((u) => u.id === id && u.role === 'user');
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return undefined;
  };

  const getAdminById = (id: string) => {
    const admin = allUsers.find((u) => u.id === id && (u.role === 'admin' || u.role === 'superadmin'));
    if (admin) {
      const { password: _, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    }
    return undefined;
  };

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
