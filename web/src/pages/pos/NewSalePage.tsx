import { useState, useEffect, useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import type { CartItem } from '../../context/POSContext';
import { useToast } from '../../context/ToastContext';
import type { Sale } from '../../services/pos.service';
import OpenSessionPrompt from '../../components/pos/OpenSessionPrompt';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  DollarSign,
  CreditCard,
  Percent,
  X,
  Barcode as BarcodeIcon,
  Printer,
  CheckCircle,
} from 'lucide-react';

// Interfaz para datos de la venta completada
interface CompletedSaleData {
  sale: Sale;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'mixed';
  change: number;
}

export default function NewSalePage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    discount,
    tax,
    total,
    setDiscount,
    scanProduct,
    isScanningProduct,
    processSale,
    isProcessingSale,
    currentSession,
  } = usePOS();

  const { showToast } = useToast();

  // Scanner input
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mixed'>('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');

  // Discount modal
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountInput, setDiscountInput] = useState('');

  // Completed sale modal
  const [completedSale, setCompletedSale] = useState<CompletedSaleData | null>(null);

  // Auto-focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Handle barcode scan
  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    await scanProduct(barcodeInput);
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  // Calculate change
  const change =
    paymentMethod === 'cash'
      ? Math.max(0, parseFloat(cashAmount || '0') - total)
      : paymentMethod === 'mixed'
      ? Math.max(0, parseFloat(cashAmount || '0') + parseFloat(cardAmount || '0') - total)
      : 0;

  // Handle payment
  const handlePayment = async () => {
    if (cart.length === 0) {
      showToast('El carrito está vacío', 'error');
      return;
    }

    // Validate payment amounts
    const totalPaid =
      paymentMethod === 'cash'
        ? parseFloat(cashAmount || '0')
        : paymentMethod === 'card'
        ? total
        : parseFloat(cashAmount || '0') + parseFloat(cardAmount || '0');

    if (totalPaid < total) {
      showToast('El monto pagado es insuficiente', 'error');
      return;
    }

    try {
      // Guardar datos antes de procesar (el carrito se limpia después)
      const saleItems = [...cart];
      const saleSubtotal = subtotal;
      const saleDiscount = discount;
      const saleTax = tax;
      const saleTotal = total;
      const saleChange = change;
      const salePaymentMethod = paymentMethod;

      const sale = await processSale({
        paymentMethod,
        cashAmount: paymentMethod !== 'card' ? parseFloat(cashAmount || '0') : undefined,
        cardAmount:
          paymentMethod === 'card'
            ? total
            : paymentMethod === 'mixed'
            ? parseFloat(cardAmount || '0')
            : undefined,
        customerId: undefined,
      });

      // Mostrar modal de venta completada
      setCompletedSale({
        sale,
        items: saleItems,
        subtotal: saleSubtotal,
        discount: saleDiscount,
        tax: saleTax,
        total: saleTotal,
        paymentMethod: salePaymentMethod,
        change: saleChange,
      });

      // Reset payment inputs
      setCashAmount('');
      setCardAmount('');
      setPaymentMethod('cash');
    } catch (error) {
      console.error('Error processing sale:', error);
    }
  };

  // Cerrar modal de venta completada
  const handleCloseSaleModal = () => {
    setCompletedSale(null);
    barcodeInputRef.current?.focus();
  };

  // Imprimir ticket
  const handlePrintTicket = () => {
    if (!completedSale) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      showToast('No se pudo abrir la ventana de impresión', 'error');
      return;
    }

    const { sale, items, subtotal: sSubtotal, discount: sDiscount, tax: sTax, total: sTotal, paymentMethod: sPM, change: sChange } = completedSale;

    const paymentMethodText = sPM === 'cash' ? 'Efectivo' : sPM === 'card' ? 'Tarjeta' : 'Mixto';
    const date = new Date(sale.createdAt).toLocaleString('es-CO');

    const ticketHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket - ${sale.orderNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm;
            padding: 10px;
          }
          .header { text-align: center; margin-bottom: 15px; }
          .header h1 { font-size: 16px; margin-bottom: 5px; }
          .header p { font-size: 10px; color: #666; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .info { margin-bottom: 10px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .items { margin-bottom: 10px; }
          .item { margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px dotted #ccc; }
          .item-name { font-weight: bold; }
          .item-details { display: flex; justify-content: space-between; font-size: 11px; color: #666; }
          .item-total { text-align: right; font-weight: bold; }
          .totals { margin-top: 10px; }
          .totals .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .totals .total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 5px; }
          .payment { margin-top: 10px; background: #f5f5f5; padding: 10px; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; color: #666; }
          @media print {
            body { width: 80mm; }
            @page { margin: 0; size: 80mm auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MARKETPLACE</h1>
          <p>Ticket de Venta</p>
        </div>

        <div class="divider"></div>

        <div class="info">
          <div class="info-row">
            <span>Orden:</span>
            <span><strong>${sale.orderNumber}</strong></span>
          </div>
          <div class="info-row">
            <span>Fecha:</span>
            <span>${date}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="items">
          ${items.map(item => `
            <div class="item">
              <div class="item-name">${item.product.name}</div>
              <div class="item-details">
                <span>${item.color} - ${item.size}</span>
                <span>${item.quantity} x $${item.price.toLocaleString('es-CO')}</span>
              </div>
              <div class="item-total">$${item.subtotal.toLocaleString('es-CO')}</div>
            </div>
          `).join('')}
        </div>

        <div class="divider"></div>

        <div class="totals">
          <div class="row">
            <span>Subtotal:</span>
            <span>$${sSubtotal.toLocaleString('es-CO')}</span>
          </div>
          ${sDiscount > 0 ? `
          <div class="row" style="color: red;">
            <span>Descuento:</span>
            <span>-$${sDiscount.toLocaleString('es-CO')}</span>
          </div>
          ` : ''}
          <div class="row">
            <span>IVA (19%):</span>
            <span>$${sTax.toLocaleString('es-CO')}</span>
          </div>
          <div class="row total">
            <span>TOTAL:</span>
            <span>$${sTotal.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div class="payment">
          <div class="info-row">
            <span>Método de pago:</span>
            <span>${paymentMethodText}</span>
          </div>
          ${sPM !== 'card' && sChange > 0 ? `
          <div class="info-row" style="color: green; font-weight: bold;">
            <span>Cambio:</span>
            <span>$${sChange.toLocaleString('es-CO')}</span>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>Gracias por su compra!</p>
          <p>Conserve este ticket</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(ticketHTML);
    printWindow.document.close();
  };

  // Handle discount
  const handleApplyDiscount = () => {
    const discountValue = parseFloat(discountInput || '0');
    if (discountValue < 0 || discountValue > subtotal) {
      showToast('Descuento inválido', 'error');
      return;
    }
    setDiscount(discountValue);
    setShowDiscountModal(false);
    setDiscountInput('');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        setShowDiscountModal(true);
      } else if (e.key === 'F12') {
        e.preventDefault();
        handlePayment();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (showDiscountModal) {
          setShowDiscountModal(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDiscountModal, cart, cashAmount, cardAmount, paymentMethod]);

  if (!currentSession) {
    return (
      <OpenSessionPrompt
        title="Sin Sesion de Caja"
        message="Abre una sesion de caja para comenzar a vender"
      />
    );
  }

  return (
    <div className="h-full flex gap-4">
      {/* Left Column - Cart */}
      <div className="flex-1 flex flex-col">
        {/* Scanner Input */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <form onSubmit={handleScan} className="flex gap-2">
            <div className="flex-1 relative">
              <BarcodeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Escanea o ingresa código de barras..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                disabled={isScanningProduct}
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isScanningProduct}
            >
              {isScanningProduct ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
        </div>

        {/* Cart Items */}
        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Carrito ({cart.length} productos)
              </h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Carrito vacío</p>
                  <p className="text-sm mt-1">Escanea productos para comenzar</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {cart.map((item) => (
                  <div key={item.variantId} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.color} - {item.size}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">SKU: {item.sku}</p>
                        <p className="text-sm font-medium text-blue-600 mt-2">
                          ${item.price.toLocaleString()} c/u
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => removeFromCart(item.variantId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            className="p-1 rounded border border-gray-300 hover:bg-gray-100"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            className="p-1 rounded border border-gray-300 hover:bg-gray-100"
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-lg font-semibold text-gray-900">
                          ${item.subtotal.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Payment */}
      <div className="w-96 flex flex-col gap-4">
        {/* Totals */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Resumen</h3>

          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Descuento:</span>
              <div className="flex items-center gap-2">
                <span className="text-red-600">-${discount.toLocaleString()}</span>
                <button
                  onClick={() => setShowDiscountModal(true)}
                  className="text-blue-600 hover:text-blue-700"
                  title="Aplicar descuento (F9)"
                >
                  <Percent className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>IVA (19%):</span>
              <span>${tax.toLocaleString()}</span>
            </div>

            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>Total:</span>
                <span>${total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Método de Pago</h3>

          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
                className="w-4 h-4"
              />
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="flex-1 font-medium">Efectivo</span>
            </label>

            <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
                className="w-4 h-4"
              />
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="flex-1 font-medium">Tarjeta</span>
            </label>

            <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value="mixed"
                checked={paymentMethod === 'mixed'}
                onChange={() => setPaymentMethod('mixed')}
                className="w-4 h-4"
              />
              <div className="flex gap-1">
                <DollarSign className="w-5 h-5 text-green-600" />
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <span className="flex-1 font-medium">Mixto</span>
            </label>
          </div>

          {/* Payment Inputs */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto Recibido
                </label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                />
              </div>
              {parseFloat(cashAmount || '0') > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Cambio:</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${change.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'mixed' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Efectivo
                </label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarjeta
                </label>
                <input
                  type="number"
                  value={cardAmount}
                  onChange={(e) => setCardAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                />
              </div>
              {(parseFloat(cashAmount || '0') > 0 || parseFloat(cardAmount || '0') > 0) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Total Pagado:</p>
                  <p className="text-xl font-bold text-blue-600">
                    ${(parseFloat(cashAmount || '0') + parseFloat(cardAmount || '0')).toLocaleString()}
                  </p>
                  {change > 0 && (
                    <>
                      <p className="text-sm text-gray-600 mt-2">Cambio:</p>
                      <p className="text-xl font-bold text-green-600">
                        ${change.toLocaleString()}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handlePayment}
            disabled={cart.length === 0 || isProcessingSale}
            className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-2"
          >
            {isProcessingSale ? (
              'Procesando...'
            ) : (
              <>
                <DollarSign className="w-6 h-6" />
                COBRAR (F12)
              </>
            )}
          </button>

          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Cancelar Venta
          </button>
        </div>

        {/* Shortcuts Help */}
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
          <p className="font-semibold mb-2">Atajos de Teclado:</p>
          <div className="space-y-1">
            <p><kbd className="px-2 py-1 bg-white border rounded">F9</kbd> Descuento</p>
            <p><kbd className="px-2 py-1 bg-white border rounded">F12</kbd> Cobrar</p>
            <p><kbd className="px-2 py-1 bg-white border rounded">ESC</kbd> Cancelar</p>
          </div>
        </div>
      </div>

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Aplicar Descuento</h2>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto del Descuento
                </label>
                <input
                  type="number"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  step="0.01"
                  min="0"
                  max={subtotal}
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-2">
                  Subtotal: ${subtotal.toLocaleString()}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDiscountModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApplyDiscount}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sale Completed Modal */}
      {completedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h2 className="text-xl font-semibold text-green-800">Venta Exitosa</h2>
                  <p className="text-sm text-green-600">Orden: {completedSale.sale.orderNumber}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Resumen */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>${completedSale.subtotal.toLocaleString()}</span>
                  </div>
                  {completedSale.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento:</span>
                      <span>-${completedSale.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>IVA (19%):</span>
                    <span>${completedSale.tax.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total:</span>
                      <span>${completedSale.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Método de pago y cambio */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Método de pago:</span>
                  <span className="font-medium">
                    {completedSale.paymentMethod === 'cash' ? 'Efectivo' :
                     completedSale.paymentMethod === 'card' ? 'Tarjeta' : 'Mixto'}
                  </span>
                </div>
                {completedSale.paymentMethod !== 'card' && completedSale.change > 0 && (
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                    <span className="text-green-700 font-medium">Cambio:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${completedSale.change.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={handlePrintTicket}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
                >
                  <Printer className="w-5 h-5" />
                  Imprimir Ticket
                </button>
                <button
                  onClick={handleCloseSaleModal}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Nueva Venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
