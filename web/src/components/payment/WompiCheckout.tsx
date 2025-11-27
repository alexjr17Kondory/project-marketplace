import { useEffect, useRef, useState } from 'react';
import { Shield, CreditCard, Loader2, CheckCircle, XCircle } from 'lucide-react';

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
  simulationMode?: boolean; // Modo de simulación para desarrollo
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
  simulationMode = false,
}: WompiCheckoutProps) => {
  const [isLoading, setIsLoading] = useState(!simulationMode);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [simCardNumber, setSimCardNumber] = useState('');
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Si es modo simulación, no cargar el script real
    if (simulationMode) {
      setIsLoading(false);
      return;
    }

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
  }, [onPaymentError, simulationMode]);

  const handlePayment = () => {
    // Modo simulación
    if (simulationMode) {
      setShowSimulator(true);
      return;
    }

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

  // Manejar pago simulado
  const handleSimulatedPayment = () => {
    setIsProcessing(true);

    // Simular delay de procesamiento
    setTimeout(() => {
      setIsProcessing(false);
      setShowSimulator(false);

      // 4242... = éxito, 4000... = rechazado
      if (simCardNumber.replace(/\s/g, '').startsWith('4242')) {
        const fakeTransactionId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        onPaymentSuccess?.(fakeTransactionId);
      } else if (simCardNumber.replace(/\s/g, '').startsWith('4000')) {
        onPaymentError?.('Pago rechazado (simulación)');
      } else {
        const fakeTransactionId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        onPaymentSuccess?.(fakeTransactionId);
      }
    }, 2000);
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

      {/* Nota de modo prueba o simulación */}
      {(publicKey.startsWith('pub_test_') || simulationMode) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-sm text-yellow-700">
            🧪 <strong>{simulationMode ? 'Modo simulación' : 'Modo de prueba'}:</strong> Usa la tarjeta 4242 4242 4242 4242 para simular pagos
          </p>
        </div>
      )}

      {/* Modal de simulación de pago */}
      {showSimulator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Simulador de Pago</h3>
              <p className="text-sm text-gray-500 mt-1">Ambiente de desarrollo</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de tarjeta
                </label>
                <input
                  type="text"
                  value={simCardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                    const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
                    setSimCardNumber(formatted);
                  }}
                  placeholder="4242 4242 4242 4242"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vencimiento
                  </label>
                  <input
                    type="text"
                    placeholder="12/28"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-700">Tarjetas de prueba:</p>
                <ul className="text-gray-600 mt-1 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>4242 4242 4242 4242 = Aprobado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>4000 0000 0000 0000 = Rechazado</span>
                  </li>
                </ul>
              </div>

              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-purple-600">{formatCurrency(amountInCents)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSimulator(false)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSimulatedPayment}
                  disabled={isProcessing || simCardNumber.replace(/\s/g, '').length < 16}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Pagar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
