import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Cart, CartItemType, CartSummary } from '../types/cart';
import type { Product } from '../types/product';
import type { CustomizedProduct } from '../types/design';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../services/storage.service';
import { settingsService } from '../services/settings.service';

interface OrderConfig {
  shippingCost: number;
  freeShippingThreshold: number;
  taxRate: number;
  taxIncluded: boolean;
}

interface CartContextType {
  cart: Cart;
  orderConfig: OrderConfig;
  addStandardProduct: (product: Product, color: string, size: string, quantity?: number) => void;
  addCustomizedProduct: (customizedProduct: CustomizedProduct, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartSummary: () => CartSummary;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const INITIAL_CART: Cart = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  tax: 0,
  shipping: 0,
  discount: 0,
  total: 0,
  updatedAt: new Date(),
};

// Configuración por defecto (fallback)
const DEFAULT_ORDER_CONFIG: OrderConfig = {
  shippingCost: 12000,
  freeShippingThreshold: 150000,
  taxRate: 0.19,
  taxIncluded: true,
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useLocalStorage<CartItemType[]>(STORAGE_KEYS.CART, []);
  const [cart, setCart] = useState<Cart>(INITIAL_CART);
  const [orderConfig, setOrderConfig] = useState<OrderConfig>(DEFAULT_ORDER_CONFIG);

  // Cargar configuración de pedidos desde el backend
  useEffect(() => {
    const loadOrderConfig = async () => {
      try {
        const publicSettings = await settingsService.getPublicSettings();

        // Obtener configuración de shipping
        const shippingCost = publicSettings.shipping?.cost ?? DEFAULT_ORDER_CONFIG.shippingCost;
        const freeShippingThreshold = publicSettings.shipping?.freeThreshold ?? DEFAULT_ORDER_CONFIG.freeShippingThreshold;

        // Obtener tasa de impuestos - puede venir de tax.rate o de payment.taxRate
        let taxRate = DEFAULT_ORDER_CONFIG.taxRate;
        if (publicSettings.tax?.rate !== undefined) {
          // Si viene como porcentaje (ej: 19), convertir a decimal
          taxRate = publicSettings.tax.rate > 1 ? publicSettings.tax.rate / 100 : publicSettings.tax.rate;
        }

        // Determinar si el impuesto está incluido en el precio
        // Por defecto true (estándar en Colombia)
        const taxIncluded = (publicSettings.tax as any)?.included ?? true;

        setOrderConfig({
          shippingCost,
          freeShippingThreshold,
          taxRate,
          taxIncluded,
        });
      } catch (error) {
        console.error('Error loading order config:', error);
        // Usar valores por defecto si falla
      }
    };

    loadOrderConfig();
  }, []);

  // Recalcular totales cuando cambien los items o la configuración
  const recalculateTotals = useCallback(() => {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Calcular impuestos según configuración
    // Si taxIncluded es true, el impuesto ya está incluido en el precio
    // Si taxIncluded es false, se suma al subtotal
    const tax = orderConfig.taxIncluded ? 0 : Math.round(subtotal * orderConfig.taxRate);

    // Calcular envío: gratis si supera el umbral
    const shipping = subtotal >= orderConfig.freeShippingThreshold ? 0 : orderConfig.shippingCost;

    // Total = subtotal + impuestos (si no están incluidos) + envío
    const total = subtotal + tax + shipping;

    setCart({
      items: cartItems,
      totalItems,
      subtotal,
      tax,
      shipping,
      discount: 0,
      total,
      updatedAt: new Date(),
    });
  }, [cartItems, orderConfig]);

  useEffect(() => {
    recalculateTotals();
  }, [recalculateTotals]);

  const addStandardProduct = (
    product: Product,
    color: string,
    size: string,
    quantity: number = 1
  ) => {
    const newItem: CartItemType = {
      id: `${product.id}-${color}-${size}-${Date.now()}`,
      type: 'standard',
      product,
      selectedColor: color,
      selectedSize: size,
      quantity,
      price: product.basePrice,
      subtotal: product.basePrice * quantity,
      addedAt: new Date(),
    };

    setCartItems((prev) => [...prev, newItem]);
  };

  const addCustomizedProduct = (customizedProduct: CustomizedProduct, quantity: number = 1) => {
    const newItem: CartItemType = {
      id: `custom-${customizedProduct.id}-${Date.now()}`,
      type: 'customized',
      customizedProduct,
      quantity,
      price: customizedProduct.totalPrice,
      subtotal: customizedProduct.totalPrice * quantity,
      addedAt: new Date(),
    };

    setCartItems((prev) => [...prev, newItem]);
  };

  const removeItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity,
            subtotal: item.price * quantity,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartSummary = (): CartSummary => {
    return {
      itemCount: cart.totalItems,
      subtotal: cart.subtotal,
      total: cart.total,
    };
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        orderConfig,
        addStandardProduct,
        addCustomizedProduct,
        removeItem,
        updateQuantity,
        clearCart,
        getCartSummary,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
