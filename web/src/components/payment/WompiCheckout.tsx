import { useEffect, useRef, useState } from 'react';
import { Shield, CreditCard, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import {
  generateIntegritySignature,
  WOMPI_WIDGET_URL,
  validateWompiCredentials,
} from '../../services/wompi.service';

interface WompiCheckoutProps {
  publicKey: string;
  amountInCents: number;
  reference: string;
  currency?: string;
  integrityKey?: string;
  redirectUrl?: string;
  customerEmail?: string;
  customerFullName?: string;
  customerPhone?: string;
  onPaymentSuccess?: (transactionId: string) => void;
  onPaymentError?: (error: string) => void;
  onClose?: () => void;
  isTestMode?: boolean;
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
  signature?: { integrity: string };
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

// Verificar si las credenciales son válidas
const hasValidCredentials = (publicKey: string): boolean => {
  return Boolean(publicKey) &&
         publicKey !== 'pub_test_SIMULATION' &&
         (publicKey.startsWith('pub_test_') || publicKey.startsWith('pub_prod_'));
};

export const WompiCheckout = ({
  publicKey,
  amountInCents,
  reference,
  currency = 'COP',
  integrityKey,
  redirectUrl,
  customerEmail,
  customerFullName,
  customerPhone,
  onPaymentSuccess,
  onPaymentError,
  onClose,
  isTestMode = true,
}: WompiCheckoutProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const scriptLoaded = useRef(false);
  const widgetRef = useRef<WompiWidgetInstance | null>(null);

  // Verificar credenciales
  const credentialsValid = hasValidCredentials(publicKey);

  // Validar credenciales
  useEffect(() => {
    if (!credentialsValid) {
      setIsLoading(false);
      return;
    }

    const validation = validateWompiCredentials({
      publicKey,
      isTestMode,
    });

    if (!validation.isValid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }, [publicKey, isTestMode, credentialsValid]);

  // Generar firma de integridad si está disponible la clave
  useEffect(() => {
    if (!credentialsValid) return;

    const generateSignatureAsync = async () => {
      if (integrityKey) {
        try {
          const sig = await generateIntegritySignature({
            reference,
            amountInCents,
            currency,
            integrityKey,
          });
          setSignature(sig);
        } catch (error) {
          console.error('Error generating signature:', error);
        }
      }
    };

    generateSignatureAsync();
  }, [reference, amountInCents, currency, integrityKey, credentialsValid]);

  // Cargar script de Wompi solo si hay credenciales válidas
  useEffect(() => {
    if (!credentialsValid) {
      setIsLoading(false);
      return;
    }

    const loadScript = () => {
      const existingScript = document.querySelector(`script[src="${WOMPI_WIDGET_URL}"]`);

      if (existingScript) {
        if (window.WidgetCheckout) {
          scriptLoaded.current = true;
          setIsLoading(false);
        } else {
          existingScript.addEventListener('load', () => {
            scriptLoaded.current = true;
            setIsLoading(false);
          });
        }
        return;
      }

      const script = document.createElement('script');
      script.src = WOMPI_WIDGET_URL;
      script.async = true;

      script.onload = () => {
        scriptLoaded.current = true;
        setIsLoading(false);
      };

      script.onerror = () => {
        setIsLoading(false);
        onPaymentError?.('Error al cargar el widget de Wompi.');
      };

      document.body.appendChild(script);
    };

    loadScript();
  }, [credentialsValid, onPaymentError]);

  const handlePayment = () => {
    if (!window.WidgetCheckout) {
      onPaymentError?.('Widget de Wompi no disponible. Recarga la página.');
      return;
    }

    setIsProcessing(true);

    const config: WompiWidgetConfig = {
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
    };

    if (signature) {
      config.signature = { integrity: signature };
    }

    try {
      const checkout = new window.WidgetCheckout(config);
      widgetRef.current = checkout;

      checkout.open((result: WompiResult) => {
        setIsProcessing(false);

        if (result.transaction) {
          const { status, id } = result.transaction;

          switch (status) {
            case 'APPROVED':
              onPaymentSuccess?.(id);
              break;
            case 'PENDING':
              onPaymentSuccess?.(id);
              break;
            case 'DECLINED':
              onPaymentError?.('El pago fue rechazado. Por favor intenta con otro método de pago.');
              break;
            case 'ERROR':
              onPaymentError?.('Ocurrió un error al procesar el pago. Por favor intenta de nuevo.');
              break;
            case 'VOIDED':
              onClose?.();
              break;
            default:
              onClose?.();
          }
        } else {
          onClose?.();
        }
      });
    } catch (error) {
      setIsProcessing(false);
      console.error('Error opening Wompi widget:', error);
      onPaymentError?.('Error al abrir el widget de pago.');
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  // Si no hay credenciales válidas, mostrar alerta
  if (!credentialsValid) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-orange-800">
              Método de pago no configurado
            </h3>
            <p className="text-sm text-orange-700 mt-2">
              El pago con Wompi no está disponible en este momento. Por favor selecciona otro método de pago o contacta al administrador.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          <span className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700 flex items-center gap-1">
            <CreditCard className="w-4 h-4" />
            Tarjeta crédito
          </span>
          <span className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700 flex items-center gap-1">
            <CreditCard className="w-4 h-4" />
            Tarjeta débito
          </span>
          <span className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700">
            🏦 PSE
          </span>
          <span className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700">
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
            Pagar con Wompi {formatCurrency(amountInCents)}
          </>
        )}
      </button>

      {/* Badge de seguridad */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Shield className="w-4 h-4 text-green-500" />
        <span>Pago seguro procesado por</span>
        <span className="font-semibold text-purple-600">Wompi</span>
      </div>

      {/* Nota de modo prueba */}
      {isTestMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Modo de Prueba</p>
              <p className="text-xs text-yellow-700 mt-1">
                Tarjetas de prueba:
              </p>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <code className="bg-yellow-100 px-1.5 py-0.5 rounded">4242 4242 4242 4242</code>
                  <span className="text-yellow-600">= Aprobado</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-3 h-3 text-red-500" />
                  <code className="bg-yellow-100 px-1.5 py-0.5 rounded">4111 1111 1111 1111</code>
                  <span className="text-yellow-600">= Rechazado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
