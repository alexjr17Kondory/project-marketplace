import { Link } from 'react-router-dom';
import { Sparkles, Mail, Phone, MapPin, Clock, Heart } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { InstagramIcon, FacebookIcon, WhatsAppIcon, TwitterIcon } from '../icons/SocialIcons';

export const Footer = () => {
  const { settings } = useSettings();

  // Colores de marca dinámicos desde settings.appearance
  const brandColors = settings.appearance?.brandColors || settings.general.brandColors || {
    primary: '#7c3aed',
    secondary: '#ec4899',
    accent: '#f59e0b',
  };
  const showSocialInFooter = settings.appearance?.showSocialInFooter ?? true;
  const showScheduleInFooter = settings.appearance?.showScheduleInFooter ?? true;
  const gradientStyle = `linear-gradient(to right, ${brandColors.primary}, ${brandColors.secondary}, ${brandColors.accent})`;
  const gradientBgStyle = `linear-gradient(to bottom right, ${brandColors.primary}, ${brandColors.secondary}, ${brandColors.accent})`;

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-auto relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{ background: gradientStyle }}
      />

      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {/* Logo o Icono por defecto */}
              {settings.general.logo ? (
                <img
                  src={settings.general.logo}
                  alt={settings.general.siteName}
                  className="h-10 max-w-[60px] object-contain"
                />
              ) : (
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-xl blur-md opacity-50"
                    style={{ background: gradientBgStyle }}
                  />
                  <div
                    className="relative p-2 rounded-xl"
                    style={{ background: gradientBgStyle }}
                  >
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
              {/* Nombre siempre visible */}
              <div className="flex flex-col">
                <h3
                  className="font-black text-lg bg-clip-text text-transparent"
                  style={{
                    backgroundImage: gradientStyle,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {settings.general.siteName || 'StylePrint'}
                </h3>
                {settings.general.slogan && (
                  <span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">
                    {settings.general.slogan}
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">
              {settings.general.siteDescription || 'Tu tienda de ropa personalizada. Dale vida a tu creatividad con diseños únicos.'}
            </p>
            {/* Social Icons - Dinámicos */}
            {showSocialInFooter && (
              <div className="flex gap-2">
                {settings.general.socialLinks.instagram && (
                  <a
                    href={settings.general.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-700 hover:bg-gradient-to-br hover:from-purple-600 hover:via-pink-500 hover:to-orange-400 flex items-center justify-center hover:scale-110 transition-all"
                    title="Instagram"
                  >
                    <InstagramIcon className="w-4 h-4 text-white" />
                  </a>
                )}
                {settings.general.socialLinks.facebook && (
                  <a
                    href={settings.general.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-700 hover:bg-[#1877F2] flex items-center justify-center hover:scale-110 transition-all"
                    title="Facebook"
                  >
                    <FacebookIcon className="w-4 h-4 text-white" />
                  </a>
                )}
                {settings.general.socialLinks.twitter && (
                  <a
                    href={settings.general.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-700 hover:bg-black flex items-center justify-center hover:scale-110 transition-all"
                    title="X (Twitter)"
                  >
                    <TwitterIcon className="w-4 h-4 text-white" />
                  </a>
                )}
                {settings.general.socialLinks.whatsapp && (
                  <a
                    href={`https://wa.me/${settings.general.socialLinks.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-700 hover:bg-[#25D366] flex items-center justify-center hover:scale-110 transition-all"
                    title="WhatsApp"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-white" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-sm mb-4 text-white">
              Enlaces Rápidos
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white text-xs transition-colors inline-flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="text-gray-400 hover:text-white text-xs transition-colors inline-flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Catálogo
                </Link>
              </li>
              <li>
                <Link to="/customize" className="text-gray-400 hover:text-white text-xs transition-colors inline-flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Personalizar
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-gray-400 hover:text-white text-xs transition-colors inline-flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Carrito
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info - Dinámico */}
          <div>
            <h3 className="font-bold text-sm mb-4 text-white">
              Contacto
            </h3>
            <div className="space-y-2">
              {settings.general.contactEmail && (
                <a href={`mailto:${settings.general.contactEmail}`} className="text-gray-400 hover:text-white text-xs transition-colors flex items-center gap-2 group">
                  <Mail className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{settings.general.contactEmail}</span>
                </a>
              )}
              {settings.general.contactPhone && (
                <a href={`tel:${settings.general.contactPhone}`} className="text-gray-400 hover:text-white text-xs transition-colors flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  {settings.general.contactPhone}
                </a>
              )}
              {settings.general.address && (
                <p className="text-gray-400 text-xs flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <span>{settings.general.address}, {settings.general.city}, {settings.general.country}</span>
                </p>
              )}
            </div>
          </div>

          {/* Horarios */}
          {showScheduleInFooter && (
            <div>
              <h3 className="font-bold text-sm mb-4 text-white">
                Horario de Atención
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="text-gray-400">Lun - Vie: 9:00 AM - 6:00 PM</p>
                    <p className="text-gray-400">Sábado: 10:00 AM - 4:00 PM</p>
                    <p className="text-gray-500">Domingo: Cerrado</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-2">Métodos de Pago</p>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="bg-gray-700/50 text-gray-400 px-2 py-1 rounded text-[10px] font-semibold">VISA</span>
                    <span className="bg-gray-700/50 text-gray-400 px-2 py-1 rounded text-[10px] font-semibold">MC</span>
                    <span className="bg-gray-700/50 text-gray-400 px-2 py-1 rounded text-[10px] font-semibold">AMEX</span>
                    <span className="bg-gray-700/50 text-gray-400 px-2 py-1 rounded text-[10px] font-semibold">PayPal</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700/50 pt-6">
          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500 text-center md:text-left">
              © {new Date().getFullYear()}{' '}
              <span
                className="bg-clip-text text-transparent font-bold"
                style={{
                  backgroundImage: gradientStyle,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {settings.general.siteName || 'StylePrint'}
              </span>
              . Todos los derechos reservados.
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <Link to="/legal/terms" className="hover:text-white transition-colors">Términos y Condiciones</Link>
              <span className="text-gray-700">|</span>
              <Link to="/legal/privacy" className="hover:text-white transition-colors">Política de Privacidad</Link>
              <span className="text-gray-700">|</span>
              <Link to="/legal/returns" className="hover:text-white transition-colors">Política de Devoluciones</Link>
            </div>

            <p className="text-xs text-gray-500 flex items-center gap-1">
              Hecho con <Heart className="w-3 h-3 inline text-red-500 fill-red-500" /> para creativos
            </p>
          </div>

          {/* Enlace oculto para admin (Fase 1) */}
          <Link to="/admin-panel" className="text-xs text-gray-900 hover:text-gray-800 mt-2 inline-block transition">
            •
          </Link>
        </div>
      </div>
    </footer>
  );
};
