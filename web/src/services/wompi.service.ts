// Wompi Payment Service
// Documentación: https://docs.wompi.co/

export interface WompiCredentials {
  publicKey: string;
  privateKey?: string;
  integrityKey?: string;
  eventSecret?: string;
  isTestMode: boolean;
}

export interface WompiTransactionData {
  amountInCents: number;
  currency: string;
  reference: string;
  customerEmail: string;
  customerFullName: string;
  customerPhone: string;
  customerPhonePrefix?: string;
  redirectUrl?: string;
}

export interface WompiSignatureData {
  reference: string;
  amountInCents: number;
  currency: string;
  integrityKey: string;
}

// Generar firma de integridad para transacciones (se usa en el widget)
export const generateIntegritySignature = async (data: WompiSignatureData): Promise<string> => {
  const { reference, amountInCents, currency, integrityKey } = data;

  // La firma se genera: reference + amountInCents + currency + integrityKey
  const concatenated = `${reference}${amountInCents}${currency}${integrityKey}`;

  // Generar SHA256 hash
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(concatenated);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  // Convertir a hexadecimal
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
};

// Verificar estado de una transacción
export const getTransactionStatus = async (
  transactionId: string,
  credentials: WompiCredentials
): Promise<WompiTransactionResponse | null> => {
  const baseUrl = credentials.isTestMode
    ? 'https://sandbox.wompi.co/v1'
    : 'https://production.wompi.co/v1';

  try {
    const response = await fetch(`${baseUrl}/transactions/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${credentials.publicKey}`,
      },
    });

    if (!response.ok) {
      console.error('Error fetching transaction:', response.statusText);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
};

export interface WompiTransactionResponse {
  data: {
    id: string;
    created_at: string;
    amount_in_cents: number;
    reference: string;
    currency: string;
    payment_method_type: string;
    payment_method: {
      type: string;
      extra?: {
        brand?: string;
        last_four?: string;
      };
    };
    status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';
    status_message?: string;
    customer_email: string;
    customer_data?: {
      phone_number?: string;
      full_name?: string;
    };
  };
}

// URLs del widget de Wompi
export const WOMPI_WIDGET_URL = 'https://checkout.wompi.co/widget.js';

// Obtener URL base según ambiente
export const getWompiBaseUrl = (isTestMode: boolean): string => {
  return isTestMode
    ? 'https://sandbox.wompi.co/v1'
    : 'https://production.wompi.co/v1';
};

// Validar credenciales de Wompi
export const validateWompiCredentials = (credentials: WompiCredentials): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!credentials.publicKey) {
    errors.push('La clave pública es requerida');
  } else if (credentials.isTestMode && !credentials.publicKey.startsWith('pub_test_')) {
    errors.push('La clave pública de prueba debe empezar con "pub_test_"');
  } else if (!credentials.isTestMode && !credentials.publicKey.startsWith('pub_prod_')) {
    errors.push('La clave pública de producción debe empezar con "pub_prod_"');
  }

  if (credentials.integrityKey && credentials.integrityKey.length < 10) {
    errors.push('La clave de integridad parece inválida');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Formatear referencia de pago (máximo 64 caracteres, solo alfanuméricos y guiones)
export const formatPaymentReference = (orderNumber: string): string => {
  const cleaned = orderNumber.replace(/[^a-zA-Z0-9-]/g, '');
  return cleaned.slice(0, 64);
};

// Obtener token de aceptación (requerido por Wompi)
export const getAcceptanceToken = async (publicKey: string, isTestMode: boolean): Promise<string | null> => {
  const baseUrl = getWompiBaseUrl(isTestMode);

  try {
    const response = await fetch(`${baseUrl}/merchants/${publicKey}`);

    if (!response.ok) {
      console.error('Error getting acceptance token:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.data?.presigned_acceptance?.acceptance_token || null;
  } catch (error) {
    console.error('Error getting acceptance token:', error);
    return null;
  }
};
