import { useState, useEffect } from 'react';
import {
  CheckCircle,
  Printer,
  Download,
  Mail,
  X,
  Loader2,
  ArrowRight
} from 'lucide-react';
import * as posService from '../../services/pos.service';

interface SaleCompletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: {
    id: number;
    orderNumber: string;
    customerEmail?: string;
  };
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  change: number;
  paymentMethod: 'cash' | 'card' | 'mixed';
  taxRate?: number;
  onSendEmail?: (email: string) => Promise<void>;
}

export const SaleCompletedModal = ({
  isOpen,
  onClose,
  sale,
  subtotal,
  discount,
  tax,
  total,
  change,
  paymentMethod,
  taxRate = 19,
  onSendEmail,
}: SaleCompletedModalProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(!!sale.customerEmail);

  useEffect(() => {
    if (isOpen && sale.id) {
      loadPdf();
      setEmailSent(!!sale.customerEmail);
    }

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, sale.id]);

  const loadPdf = async () => {
    try {
      setLoadingPdf(true);
      const blob = await posService.getInvoicePDFBlob(sale.id);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error loading PDF:', error);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await posService.printInvoicePDF(sale.id);
    } catch (error) {
      console.error('Error printing:', error);
    } finally {
      setPrinting(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Factura_${sale.orderNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendEmail = async () => {
    if (!emailInput.trim() || !onSendEmail) return;
    setSendingEmail(true);
    try {
      await onSendEmail(emailInput.trim());
      setEmailSent(true);
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setSendingEmail(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] mx-4 flex flex-col overflow-hidden">
        {/* Header con éxito */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Venta Exitosa</h2>
                <p className="text-green-100 text-sm">Factura #{sale.orderNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Panel izquierdo - Resumen y acciones */}
          <div className="lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-200 p-4 space-y-4 overflow-y-auto">
            {/* Resumen de venta */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Resumen</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuento:</span>
                    <span>-${discount.toLocaleString()}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>IVA ({taxRate}%):</span>
                    <span>${tax.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total:</span>
                    <span>${total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Método de pago y cambio */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Método:</span>
                <span className="font-medium text-blue-700">
                  {paymentMethod === 'cash' ? 'Efectivo' :
                   paymentMethod === 'card' ? 'Tarjeta' : 'Mixto'}
                </span>
              </div>
              {paymentMethod !== 'card' && change > 0 && (
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-blue-200">
                  <span className="text-green-700 font-medium">Cambio:</span>
                  <span className="text-xl font-bold text-green-600">
                    ${change.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-800 text-sm">Enviar por email</span>
              </div>
              {emailSent ? (
                <div className="flex items-center gap-2 text-xs text-purple-700">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Enviada a: {sale.customerEmail || emailInput}</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="cliente@email.com"
                    className="flex-1 px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail || !emailInput.trim()}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                  >
                    {sendingEmail ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handlePrint}
                disabled={loadingPdf || printing}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium transition-colors"
              >
                {printing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Printer className="w-5 h-5" />
                )}
                {printing ? 'Imprimiendo...' : 'Imprimir'}
              </button>

              <button
                onClick={handleDownload}
                disabled={!pdfUrl || loadingPdf}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                Descargar PDF
              </button>

              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium transition-colors"
              >
                Nueva Venta
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Panel derecho - Vista previa del PDF */}
          <div className="flex-1 bg-gray-100 p-4 overflow-hidden">
            <div className="h-full bg-white rounded-lg shadow-inner overflow-hidden">
              {loadingPdf ? (
                <div className="h-full flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
                    <p className="text-gray-600">Generando factura...</p>
                  </div>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full min-h-[400px]"
                  title="Vista previa de factura"
                />
              ) : (
                <div className="h-full flex items-center justify-center min-h-[400px]">
                  <p className="text-gray-500">Error al cargar la factura</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleCompletedModal;
