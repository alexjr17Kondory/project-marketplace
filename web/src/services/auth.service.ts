import api from './api.service';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  roleId: number;
  role: string;
  permissions: string[];
  status: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

const AUTH_STORAGE_KEY = 'marketplace_auth';

export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (!response.data) throw new Error(response.message || 'Error en el login');

    // Guardar en localStorage
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.data));

    return response.data;
  },

  // Registro
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (!response.data) throw new Error(response.message || 'Error en el registro');

    // Guardar en localStorage
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.data));

    return response.data;
  },

  // Obtener perfil
  async getProfile(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    if (!response.data) throw new Error('No autenticado');
    return response.data;
  },

  // Actualizar perfil
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<User>('/auth/me', data);
    if (!response.data) throw new Error('Error actualizando perfil');

    // Actualizar en localStorage
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const auth = JSON.parse(stored);
      auth.user = { ...auth.user, ...response.data };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    }

    return response.data;
  },

  // Cambiar contraseña
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/auth/change-password', { currentPassword, newPassword });
  },

  // Solicitar recuperación de contraseña
  async requestPasswordReset(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  // Restablecer contraseña
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, newPassword });
  },

  // Logout
  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  // Obtener datos de auth del localStorage
  getStoredAuth(): AuthResponse | null {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return this.getStoredAuth() !== null;
  },

  // Verificar si es admin
  isAdmin(): boolean {
    const auth = this.getStoredAuth();
    return auth?.user?.roleId === 1;
  },

  // Verificar si tiene un permiso específico
  hasPermission(permission: string): boolean {
    const auth = this.getStoredAuth();
    return auth?.user?.permissions?.includes(permission) || false;
  },
};

export default authService;
