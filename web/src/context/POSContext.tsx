import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as posService from '../services/pos.service';
import * as cashRegisterService from '../services/cash-register.service';
import type { ScanProductResponse, Sale, SaleItem, CreateSaleRequest } from '../services/pos.service';
import type { CashSession } from '../services/cash-register.service';
import { useToast } from './ToastContext';

// ==================== TYPES ====================

export interface CartItem extends ScanProductResponse {
  quantity: number;
  subtotal: number;
}

interface POSContextType {
  // Session
  currentSession: CashSession | null;
  isLoadingSession: boolean;
  loadSession: () => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (product: ScanProductResponse, quantity?: number) => void;
  removeFromCart: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clearCart: () => void;

  // Totals
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  setDiscount: (amount: number) => void;

  // Sales
  isProcessingSale: boolean;
  processSale: (data: Omit<CreateSaleRequest, 'items' | 'cashRegisterId'>) => Promise<Sale>;

  // Barcode scanning
  scanProduct: (barcode: string) => Promise<void>;
  isScanningProduct: boolean;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

// ==================== PROVIDER ====================

export function POSProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();

  // Session state
  const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);

  // Loading states
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [isScanningProduct, setIsScanningProduct] = useState(false);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = (subtotal - discount) * 0.19; // 19% IVA
  const total = subtotal - discount + tax;

  /**
   * Load current session
   */
  const loadSession = useCallback(async () => {
    try {
      setIsLoadingSession(true);
      const session = await cashRegisterService.getMySession();
      setCurrentSession(session);
    } catch (error: any) {
      console.error('Error loading session:', error);
      setCurrentSession(null);
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  /**
   * Add product to cart
   */
  const addToCart = useCallback(
    (product: ScanProductResponse, quantity: number = 1) => {
      setCart((prevCart) => {
        // Check if product already in cart
        const existingItem = prevCart.find((item) => item.variantId === product.variantId);

        if (existingItem) {
          // Update quantity
          const newQuantity = existingItem.quantity + quantity;

          // Check stock
          if (newQuantity > product.stock) {
            showToast('Stock insuficiente', 'error');
            return prevCart;
          }

          return prevCart.map((item) =>
            item.variantId === product.variantId
              ? {
                  ...item,
                  quantity: newQuantity,
                  subtotal: newQuantity * item.price,
                }
              : item
          );
        } else {
          // Add new item
          if (quantity > product.stock) {
            showToast('Stock insuficiente', 'error');
            return prevCart;
          }

          return [
            ...prevCart,
            {
              ...product,
              quantity,
              subtotal: quantity * product.price,
            },
          ];
        }
      });

      showToast('Producto agregado al carrito', 'success');
    },
    [showToast]
  );

  /**
   * Remove product from cart
   */
  const removeFromCart = useCallback((variantId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.variantId !== variantId));
  }, []);

  /**
   * Update product quantity
   */
  const updateQuantity = useCallback(
    (variantId: number, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(variantId);
        return;
      }

      setCart((prevCart) =>
        prevCart.map((item) => {
          if (item.variantId === variantId) {
            // Check stock
            if (quantity > item.stock) {
              showToast('Stock insuficiente', 'error');
              return item;
            }

            return {
              ...item,
              quantity,
              subtotal: quantity * item.price,
            };
          }
          return item;
        })
      );
    },
    [removeFromCart, showToast]
  );

  /**
   * Clear cart
   */
  const clearCart = useCallback(() => {
    setCart([]);
    setDiscount(0);
  }, []);

  /**
   * Scan product by barcode
   */
  const scanProduct = useCallback(
    async (barcode: string) => {
      if (!barcode.trim()) return;

      try {
        setIsScanningProduct(true);
        const product = await posService.scanProduct(barcode);
        addToCart(product, 1);
      } catch (error: any) {
        console.error('Error scanning product:', error);
        showToast(
          error.response?.data?.message || 'Producto no encontrado',
          'error'
        );
      } finally {
        setIsScanningProduct(false);
      }
    },
    [addToCart, showToast]
  );

  /**
   * Process sale
   */
  const processSale = useCallback(
    async (data: Omit<CreateSaleRequest, 'items' | 'cashRegisterId'>): Promise<Sale> => {
      if (!currentSession) {
        throw new Error('No hay una sesión de caja abierta');
      }

      if (cart.length === 0) {
        throw new Error('El carrito está vacío');
      }

      try {
        setIsProcessingSale(true);

        // Prepare sale items
        const items: SaleItem[] = cart.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        }));

        // Create sale
        const sale = await posService.createSale({
          ...data,
          cashRegisterId: currentSession.cashRegisterId,
          items,
          discount,
        });

        // Clear cart on success
        clearCart();

        // Reload session to update counters
        await loadSession();

        showToast('Venta procesada exitosamente', 'success');

        return sale;
      } catch (error: any) {
        console.error('Error processing sale:', error);
        showToast(
          error.response?.data?.message || 'Error al procesar la venta',
          'error'
        );
        throw error;
      } finally {
        setIsProcessingSale(false);
      }
    },
    [currentSession, cart, discount, clearCart, loadSession, showToast]
  );

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const value: POSContextType = {
    // Session
    currentSession,
    isLoadingSession,
    loadSession,

    // Cart
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,

    // Totals
    subtotal,
    discount,
    tax,
    total,
    setDiscount,

    // Sales
    isProcessingSale,
    processSale,

    // Barcode scanning
    scanProduct,
    isScanningProduct,
  };

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
}

// ==================== HOOK ====================

export function usePOS() {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
}
