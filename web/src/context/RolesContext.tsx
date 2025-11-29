import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { Role } from '../types/roles';
import { SYSTEM_ROLES } from '../types/roles';

interface RolesContextType {
  roles: Role[];
  getRoleById: (id: number) => Role | undefined;
  createRole: (role: Omit<Role, 'id' | 'isSystem' | 'createdAt' | 'updatedAt'>) => Role;
  updateRole: (id: number, updates: Partial<Omit<Role, 'id' | 'isSystem'>>) => void;
  deleteRole: (id: number) => boolean;
  getAvailableRolesForAssignment: () => Role[]; // Roles que se pueden asignar a usuarios
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

const STORAGE_KEY = 'marketplace_roles';

export const RolesProvider = ({ children }: { children: ReactNode }) => {
  const [roles, setRoles] = useState<Role[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Combinar roles del sistema con roles guardados
        const customRoles = parsed
          .filter((r: Role) => !r.isSystem)
          .map((r: any) => ({
            ...r,
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt),
          }));
        return [...SYSTEM_ROLES, ...customRoles];
      } catch (e) {
        console.error('Error loading roles from localStorage:', e);
      }
    }
    return SYSTEM_ROLES;
  });

  // Guardar solo roles personalizados (no los del sistema)
  useEffect(() => {
    const customRoles = roles.filter(r => !r.isSystem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customRoles));
  }, [roles]);

  const getRoleById = (id: number): Role | undefined => {
    return roles.find(r => r.id === id);
  };

  const createRole = (roleData: Omit<Role, 'id' | 'isSystem' | 'createdAt' | 'updatedAt'>): Role => {
    // Generar nuevo ID (empezando desde 2, ya que 0 y 1 son del sistema)
    const maxId = Math.max(...roles.map(r => r.id), 1);
    const newRole: Role = {
      ...roleData,
      id: maxId + 1,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setRoles(prev => [...prev, newRole]);
    return newRole;
  };

  const updateRole = (id: number, updates: Partial<Omit<Role, 'id' | 'isSystem'>>): void => {
    const role = getRoleById(id);

    // No permitir editar roles del sistema
    if (!role || role.isSystem) {
      console.warn('No se puede editar un rol del sistema');
      return;
    }

    setRoles(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, ...updates, updatedAt: new Date() }
          : r
      )
    );
  };

  const deleteRole = (id: number): boolean => {
    const role = getRoleById(id);

    // No permitir eliminar roles del sistema
    if (!role || role.isSystem) {
      console.warn('No se puede eliminar un rol del sistema');
      return false;
    }

    setRoles(prev => prev.filter(r => r.id !== id));
    return true;
  };

  // Obtener roles que se pueden asignar a usuarios administrativos
  // (excluyendo rol 0 que es único y rol 1 que es para usuarios normales)
  const getAvailableRolesForAssignment = (): Role[] => {
    return roles.filter(r => r.id !== 0 && r.id !== 1 && r.isActive);
  };

  return (
    <RolesContext.Provider
      value={{
        roles,
        getRoleById,
        createRole,
        updateRole,
        deleteRole,
        getAvailableRolesForAssignment,
      }}
    >
      {children}
    </RolesContext.Provider>
  );
};

export const useRoles = () => {
  const context = useContext(RolesContext);
  if (context === undefined) {
    throw new Error('useRoles must be used within a RolesProvider');
  }
  return context;
};
