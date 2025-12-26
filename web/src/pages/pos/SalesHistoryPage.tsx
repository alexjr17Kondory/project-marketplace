import { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { useToast } from '../../context/ToastContext';
import * as posService from '../../services/pos.service';
import OpenSessionPrompt from '../../components/pos/OpenSessionPrompt';
import { History, Receipt, Calendar, DollarSign, CreditCard, User, Printer } from 'lucide-react';

export default function SalesHistoryPage() {
  const { currentSession } = usePOS();
  const { showToast } = useToast();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    if (!currentSession) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await posService.getSalesHistory();
      setSales(data);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  // Imprimir ticket de una venta
  const handlePrintTicket = (sale: any) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      showToast('No se pudo abrir la ventana de impresión', 'error');
      return;
    }

    const paymentMethodText = sale.paymentMethod === 'cash' ? 'Efectivo' : sale.paymentMethod === 'card' ? 'Tarjeta' : 'Mixto';
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
          ${sale.customerName ? `
          <div class="info-row">
            <span>Cliente:</span>
            <span>${sale.customerName}</span>
          </div>
          ` : ''}
        </div>

        <div class="divider"></div>

        <div class="items">
          ${(sale.items || []).map((item: any) => `
            <div class="item">
              <div class="item-name">${item.productName}</div>
              <div class="item-details">
                <span>${item.color || ''} ${item.size || ''}</span>
                <span>${item.quantity} x $${Number(item.unitPrice).toLocaleString('es-CO')}</span>
              </div>
              <div class="item-total">$${(item.quantity * Number(item.unitPrice)).toLocaleString('es-CO')}</div>
            </div>
          `).join('')}
        </div>

        <div class="divider"></div>

        <div class="totals">
          <div class="row">
            <span>Subtotal:</span>
            <span>$${Number(sale.subtotal).toLocaleString('es-CO')}</span>
          </div>
          ${Number(sale.discount) > 0 ? `
          <div class="row" style="color: red;">
            <span>Descuento:</span>
            <span>-$${Number(sale.discount).toLocaleString('es-CO')}</span>
          </div>
          ` : ''}
          <div class="row">
            <span>IVA (19%):</span>
            <span>$${Number(sale.tax).toLocaleString('es-CO')}</span>
          </div>
          <div class="row total">
            <span>TOTAL:</span>
            <span>$${Number(sale.total).toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div class="payment">
          <div class="info-row">
            <span>Método de pago:</span>
            <span>${paymentMethodText}</span>
          </div>
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

  if (!currentSession) {
    return (
      <OpenSessionPrompt
        title="Sin Sesion de Caja"
        message="Abre una sesion de caja para ver el historial de ventas"
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando historial...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <History className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historial de Ventas</h1>
            <p className="text-gray-600 mt-1">
              Ventas de la sesión actual - {currentSession.cashRegister?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Ventas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {currentSession.salesCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vendido</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${currentSession.totalSales.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ticket Promedio</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                $
                {currentSession.salesCount > 0
                  ? Math.round(currentSession.totalSales / currentSession.salesCount).toLocaleString()
                  : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Ventas Realizadas</h2>
        </div>

        {sales.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600">No hay ventas registradas en esta sesión</p>
            <p className="text-sm text-gray-500 mt-1">
              Las ventas que realices aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    # Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Productos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pago
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-gray-500">
                            {new Date(sale.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">
                        {sale.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {sale.user?.name || 'Cliente general'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {sale.items?.length || 0} productos
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {sale.paymentMethod === 'card' ? (
                          <CreditCard className="w-4 h-4 text-blue-600" />
                        ) : (
                          <DollarSign className="w-4 h-4 text-green-600" />
                        )}
                        <span className="text-sm text-gray-600 capitalize">
                          {sale.paymentMethod === 'cash' && 'Efectivo'}
                          {sale.paymentMethod === 'card' && 'Tarjeta'}
                          {sale.paymentMethod === 'mixed' && 'Mixto'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        ${sale.total.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handlePrintTicket(sale)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                        title="Imprimir ticket"
                      >
                        <Printer className="w-4 h-4" />
                        Imprimir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
