import { useEffect, useRef, useState } from 'react';
import { Shield, CreditCard, Loader2 } from 'lucide-react';

interface WompiCheckoutProps {
  publicKey: string;
  amountInCents: number;
  reference: string;
  currency?: string;
  redirectUrl?: string;
  customerEmail?: string;
  customerFullName?: string;
  customerPhone?: string;
  onPaymentSuccess?: (transactionId: string) => void;
  onPaymentError?: (error: string) => void;
  onClose?: () => void;
}

// Declaración para el objeto window con Wompi
declare global {
  interface Window {
    WidgetCheckout?: new (config: WompiWidgetConfig) => WompiWidgetInstance;
  }
}

interface WompiWidgetConfig {
  currency: string;
  amountInCents: number;
  reference: string;
  publicKey: string;
  redirectUrl?: string;
  customerData?: {
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    phoneNumberPrefix?: string;
  };
}

interface WompiWidgetInstance {
  open: (callback: (result: WompiResult) => void) => void;
}

interface WompiResult {
  transaction?: {
    id: string;
    status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';
    reference: string;
    amountInCents: number;
  };
}

export const WompiCheckout = ({
  publicKey,
  amountInCents,
  reference,
  currency = 'COP',
  redirectUrl,
  customerEmail,
  customerFullName,
  customerPhone,
  onPaymentSuccess,
  onPaymentError,
  onClose,
}: WompiCheckoutProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Cargar el script de Wompi
    if (!scriptLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://checkout.wompi.co/widget.js';
      script.async = true;
      script.onload = () => {
        setIsLoading(false);
        scriptLoaded.current = true;
      };
      script.onerror = () => {
        setIsLoading(false);
        onPaymentError?.('Error al cargar el widget de pagos');
      };
      document.body.appendChild(script);

      return () => {
        // No removemos el script para evitar recargas
      };
    } else {
      setIsLoading(false);
    }
  }, [onPaymentError]);

  const handlePayment = () => {
    if (!window.WidgetCheckout) {
      onPaymentError?.('Widget de Wompi no disponible');
      return;
    }

    setIsProcessing(true);

    const checkout = new window.WidgetCheckout({
      currency,
      amountInCents,
      reference,
      publicKey,
      redirectUrl,
      customerData: {
        email: customerEmail,
        fullName: customerFullName,
        phoneNumber: customerPhone,
        phoneNumberPrefix: '+57',
      },
    });

    checkout.open((result: WompiResult) => {
      setIsProcessing(false);

      if (result.transaction) {
        const { status, id } = result.transaction;

        if (status === 'APPROVED') {
          onPaymentSuccess?.(id);
        } else if (status === 'DECLINED' || status === 'ERROR') {
          onPaymentError?.('El pago fue rechazado. Por favor intenta con otro método.');
        } else if (status === 'PENDING') {
          // Para PSE, el pago puede quedar pendiente
          onPaymentSuccess?.(id);
        } else if (status === 'VOIDED') {
          onClose?.();
        }
      } else {
        // Usuario cerró el widget sin pagar
        onClose?.();
      }
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-600">Cargando pasarela de pagos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen del pago */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600">Total a pagar:</span>
          <span className="text-2xl font-bold text-purple-600">
            {formatCurrency(amountInCents)}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          Referencia: {reference}
        </div>
      </div>

      {/* Métodos de pago disponibles */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-sm text-gray-600 mb-3">Métodos de pago disponibles:</p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
            💳 Tarjeta de crédito
          </span>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
            💳 Tarjeta débito
          </span>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
            🏦 PSE
          </span>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
            📱 Nequi
          </span>
        </div>
      </div>

      {/* Botón de pago */}
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pagar {formatCurrency(amountInCents)}
          </>
        )}
      </button>

      {/* Badge de seguridad */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Shield className="w-4 h-4 text-green-500" />
        <span>Pago seguro procesado por</span>
        <img
          src="https://wompi.com/assets/images/brand/wompi-logo.svg"
          alt="Wompi"
          className="h-5"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <span className="hidden font-semibold text-purple-600">Wompi</span>
      </div>

      {/* Nota de modo prueba */}
      {publicKey.startsWith('pub_test_') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-sm text-yellow-700">
            🧪 <strong>Modo de prueba:</strong> Usa la tarjeta 4242 4242 4242 4242 para simular pagos
          </p>
        </div>
      )}
    </div>
  );
};
