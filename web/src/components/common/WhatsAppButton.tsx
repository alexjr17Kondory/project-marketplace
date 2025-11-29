import { useState } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { WhatsAppIcon } from '../icons/SocialIcons';

export const WhatsAppButton = () => {
  const { settings } = useSettings();
  const whatsapp = settings.home?.whatsappButton;
  const [showTooltip, setShowTooltip] = useState(false);

  // Si no está activo o no hay configuración, no mostrar
  if (!whatsapp?.isActive) return null;

  // Verificar visibilidad según dispositivo
  const isMobile = window.innerWidth < 768;
  if (isMobile && !whatsapp.showOnMobile) return null;
  if (!isMobile && !whatsapp.showOnDesktop) return null;

  // Construir URL de WhatsApp
  const whatsappUrl = `https://wa.me/${whatsapp.phoneNumber}?text=${encodeURIComponent(whatsapp.defaultMessage)}`;

  const positionClasses = whatsapp.position === 'bottom-left'
    ? 'left-4 md:left-6'
    : 'right-4 md:right-6';

  return (
    <div className={`fixed bottom-20 md:bottom-6 ${positionClasses} z-50`}>
      {/* Tooltip */}
      {whatsapp.showTooltip && showTooltip && (
        <div
          className={`absolute bottom-full mb-2 ${whatsapp.position === 'bottom-left' ? 'left-0' : 'right-0'}
            bg-white rounded-lg shadow-lg p-3 min-w-[200px] animate-fade-in-up`}
        >
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute -top-2 -right-2 bg-gray-100 rounded-full p-1 hover:bg-gray-200 transition-colors"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
          <p className="text-sm text-gray-700 font-medium">{whatsapp.tooltipText}</p>
          <div
            className={`absolute -bottom-2 ${whatsapp.position === 'bottom-left' ? 'left-4' : 'right-4'}
              w-4 h-4 bg-white transform rotate-45 shadow-lg`}
          />
        </div>
      )}

      {/* WhatsApp Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => whatsapp.showTooltip && setShowTooltip(true)}
        className={`
          flex items-center justify-center
          w-14 h-14 md:w-16 md:h-16
          rounded-full shadow-lg
          hover:scale-110 hover:shadow-xl
          transition-all duration-300
          ${whatsapp.pulseAnimation ? 'animate-pulse-soft' : ''}
        `}
        style={{ backgroundColor: whatsapp.buttonColor }}
        title="Contáctanos por WhatsApp"
      >
        <WhatsAppIcon className="w-7 h-7 md:w-8 md:h-8 text-white" />
      </a>

      {/* Pulse Ring Animation */}
      {whatsapp.pulseAnimation && (
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{ backgroundColor: whatsapp.buttonColor }}
        />
      )}
    </div>
  );
};
