import type { Product } from './product';
import type { CustomizedProduct } from './design';

// Item básico del carrito (producto sin personalizar)
export interface CartItem {
  id: string;
  type: 'standard'; // Producto estándar sin personalización
  product: Product;
  selectedColor: string;
  selectedSize: string;
  variantId?: number;
  quantity: number;
  price: number; // Precio unitario
  subtotal: number; // price * quantity
  addedAt: Date;
  // Propiedades de persistencia en DB
  dbId?: number;
  hasStock?: boolean;
  availableStock?: number;
}

// Item personalizado del carrito
export interface CustomizedCartItem {
  id: string;
  type: 'customized'; // Producto personalizado
  customizedProduct: CustomizedProduct;
  quantity: number;
  price: number; // Precio unitario (basePrice + customizationPrice)
  subtotal: number; // price * quantity
  addedAt: Date;
  // Propiedades de persistencia en DB
  dbId?: number;
  hasStock?: boolean;
  availableStock?: number;
}

// Alias para mantener compatibilidad
export type CartItemCustomized = CustomizedCartItem;

// Union type para cualquier tipo de item del carrito
export type CartItemType = CartItem | CartItemCustomized;

// Carrito completo
export interface Cart {
  items: CartItemType[];
  totalItems: number; // Suma de todas las cantidades
  subtotal: number; // Suma de todos los subtotales
  tax: number; // Impuestos (calculado según región)
  shipping: number; // Costo de envío
  discount: number; // Descuentos aplicados
  total: number; // subtotal + tax + shipping - discount
  updatedAt: Date;
}

// Resumen del carrito
export interface CartSummary {
  itemCount: number;
  subtotal: number;
  total: number;
}
