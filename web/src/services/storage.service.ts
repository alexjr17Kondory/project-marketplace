/**
 * Service para manejar localStorage de forma segura
 */

const STORAGE_PREFIX = 'styleprint_';

export class StorageService {
  /**
   * Guardar datos en localStorage
   */
  static set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(STORAGE_PREFIX + key, serialized);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Obtener datos de localStorage
   */
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  /**
   * Eliminar un item de localStorage
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  /**
   * Limpiar todo el localStorage de la app
   */
  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  /**
   * Verificar si existe un item
   */
  static has(key: string): boolean {
    return localStorage.getItem(STORAGE_PREFIX + key) !== null;
  }

  /**
   * Obtener todas las keys de la app
   */
  static keys(): string[] {
    try {
      const allKeys = Object.keys(localStorage);
      return allKeys
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .map((key) => key.replace(STORAGE_PREFIX, ''));
    } catch (error) {
      console.error('Error getting keys from localStorage:', error);
      return [];
    }
  }
}

// Keys específicas para la aplicación
export const STORAGE_KEYS = {
  CART: 'cart',
  CUSTOMIZED_PRODUCTS: 'customized_products',
  USER_PREFERENCES: 'user_preferences',
  RECENT_DESIGNS: 'recent_designs',
} as const;
