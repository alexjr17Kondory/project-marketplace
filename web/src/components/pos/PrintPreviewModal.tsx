import { useState, useEffect } from 'react';
import { X, Printer, Download, Loader2 } from 'lucide-react';
import { Button } from '../shared/Button';
import * as posService from '../../services/pos.service';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: number;
  orderNumber?: string;
}

export const PrintPreviewModal = ({
  isOpen,
  onClose,
  saleId,
  orderNumber,
}: PrintPreviewModalProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (isOpen && saleId) {
      loadPdf();
    }

    return () => {
      // Cleanup blob URL when modal closes
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, saleId]);

  const loadPdf = async () => {
    try {
      setLoading(true);
      const blob = await posService.getInvoicePDFBlob(saleId);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error loading PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);

    try {
      // Close modal first
      onClose();

      // Use the printInvoicePDF service which fetches a fresh blob
      await posService.printInvoicePDF(saleId);
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
    link.download = `Factura_${orderNumber || saleId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Vista Previa de Factura
            </h2>
            {orderNumber && (
              <p className="text-sm text-gray-500">Factura #{orderNumber}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-100 p-4">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-3" />
                <p className="text-gray-600">Cargando factura...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <div className="h-full bg-white rounded-lg shadow-inner overflow-hidden">
              <iframe
                src={pdfUrl}
                className="w-full h-full min-h-[500px]"
                title="Vista previa de factura"
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Error al cargar la factura</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button variant="admin-secondary" onClick={handleDownload} disabled={!pdfUrl || loading}>
            <Download className="w-4 h-4 mr-2" />
            Descargar
          </Button>

          <div className="flex gap-3">
            <Button variant="admin-secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handlePrint}
              disabled={!pdfUrl || loading || printing}
            >
              {printing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Printer className="w-4 h-4 mr-2" />
              )}
              {printing ? 'Imprimiendo...' : 'Imprimir'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPreviewModal;
