// Función para formatear precios con la moneda configurada
export const formatPrice = (
  price: number,
  currencySymbol: string = '$',
  currency: string = 'COP'
): string => {
  // Para COP usar formato sin decimales, para otras monedas con 2 decimales
  const useDecimals = currency !== 'COP';

  const formattedNumber = useDecimals
    ? price.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : price.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return `${currencySymbol}${formattedNumber}`;
};

// Función para formatear precio con símbolo y código de moneda
export const formatPriceWithCode = (
  price: number,
  currencySymbol: string = '$',
  currency: string = 'COP'
): { formatted: string; code: string } => {
  return {
    formatted: formatPrice(price, currencySymbol, currency),
    code: currency,
  };
};
