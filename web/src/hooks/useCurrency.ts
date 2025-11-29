import { useSettings } from '../context/SettingsContext';
import { formatPrice } from '../utils/formatPrice';

// Hook para formatear precios usando la configuración de moneda
export const useCurrency = () => {
  const { settings } = useSettings();
  const { currencySymbol, currency } = settings.general;

  const format = (price: number): string => {
    return formatPrice(price, currencySymbol, currency);
  };

  return {
    format,
    currencySymbol,
    currency,
  };
};
