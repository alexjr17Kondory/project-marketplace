import { Link } from 'react-router-dom';
import { Sparkles, ShoppingBag, Palette, Package, Truck, Shield, Heart, Star, Zap, Gift, Percent } from 'lucide-react';
import { FeaturedProducts } from '../components/products/FeaturedProducts';
import { useSettings } from '../context/SettingsContext';
import type { FeatureCard } from '../types/settings';

// Mapeo de iconos por ID
const iconMap = {
  palette: Palette,
  sparkles: Sparkles,
  package: Package,
  truck: Truck,
  shield: Shield,
  heart: Heart,
  star: Star,
  zap: Zap,
  gift: Gift,
  percent: Percent,
};

export const HomePage = () => {
  const { settings } = useSettings();

  // Colores de marca dinámicos
  const brandColors = settings.appearance?.brandColors || settings.general.brandColors || {
    primary: '#7c3aed',
    secondary: '#ec4899',
    accent: '#f59e0b',
  };
  const gradientStyle = `linear-gradient(to right, ${brandColors.primary}, ${brandColors.secondary}, ${brandColors.accent})`;
  const gradientBgStyle = `linear-gradient(to bottom right, ${brandColors.primary}, ${brandColors.secondary}, ${brandColors.accent})`;

  // Settings del Home
  const homeSettings = settings.home;
  const hero = homeSettings?.hero;
  const features = homeSettings?.features?.filter(f => f.isActive).sort((a, b) => a.order - b.order) || [];
  const showFeatures = homeSettings?.showFeatures ?? true;
  const cta = homeSettings?.cta;
  const productSections = homeSettings?.productSections?.filter(s => s.isActive).sort((a, b) => a.order - b.order) || [];

  // Renderizar icono de feature
  const renderFeatureIcon = (feature: FeatureCard) => {
    const IconComponent = iconMap[feature.icon] || Sparkles;
    return <IconComponent className="w-10 h-10 text-white" strokeWidth={2} />;
  };

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section - Creative Billboard Style - Full Width */}
      <div className="relative overflow-hidden shadow-2xl w-full h-[calc(100vh-180px)] md:h-[calc(100vh-72px)]">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: hero?.useGradientBackground !== false
              ? gradientBgStyle
              : hero?.backgroundImage
                ? `url(${hero.backgroundImage}) center/cover no-repeat`
                : gradientBgStyle
          }}
        >
          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>

          {/* Floating T-shirt Illustrations */}
          <div className="absolute top-10 left-10 text-8xl opacity-10 animate-pulse-soft">👕</div>
          <div className="absolute bottom-10 right-10 text-9xl opacity-10 animate-pulse-soft" style={{ animationDelay: '1s' }}>🎨</div>
          <div className="absolute top-1/2 right-20 text-7xl opacity-10 animate-pulse-soft" style={{ animationDelay: '2s' }}>✨</div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 px-6 text-center h-full flex flex-col justify-center">
          {/* Badge */}
          {(hero?.showBadge ?? true) && hero?.badge && (
            <div className="mb-6 animate-fade-in-up">
              <span className="inline-block bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-bold border-2 border-white/40 shadow-lg">
                <Sparkles className="w-4 h-4 inline mr-2" />
                {hero.badge}
              </span>
            </div>
          )}

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-display font-black mb-6 animate-fade-in-up text-white drop-shadow-2xl">
            {hero?.title || 'Dale Vida a tu'}
            <br />
            <span className="text-white/90">{hero?.titleHighlight || 'Creatividad'}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white mb-10 max-w-3xl mx-auto leading-relaxed font-medium drop-shadow-lg">
            {hero?.subtitle || 'Crea diseños únicos en camisetas y hoodies. Sube tus imágenes y hazlas realidad.'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {(hero?.showPrimaryButton ?? true) && (
              <Link
                to={hero?.primaryButtonLink || '/catalog'}
                className="bg-white px-10 py-5 rounded-2xl text-xl font-bold hover:bg-gray-100 inline-flex items-center justify-center gap-3 transition-all hover:scale-110 shadow-2xl group"
                style={{ color: brandColors.primary }}
              >
                <ShoppingBag className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                {hero?.primaryButtonText || 'Ver Catálogo'}
              </Link>
            )}
            {(hero?.showSecondaryButton ?? true) && (
              <Link
                to={hero?.secondaryButtonLink || '/catalog'}
                className="bg-white/10 backdrop-blur-md border-2 border-white text-white px-10 py-5 rounded-2xl text-xl font-bold hover:bg-white inline-flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-lg"
              >
                <ShoppingBag className="w-6 h-6" />
                {hero?.secondaryButtonText || 'Ver Catálogo'}
              </Link>
            )}
          </div>

          {/* Bottom Accent - Highlights */}
          {(hero?.showHighlights ?? true) && hero?.highlights && hero.highlights.length > 0 && (
            <div className="mt-12 mb-6 md:mb-0 flex items-center justify-center gap-4 md:gap-8 text-white/80 text-xs md:text-sm font-semibold flex-wrap">
              {hero.highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white/80 rounded-full"></div>
                  {highlight}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Features - Dinámico */}
        {showFeatures && features.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {features.map((feature) => (
              <div key={feature.id} className="group relative">
                <div className="absolute inset-0 bg-gray-500 rounded-3xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative bg-white p-8 rounded-3xl border-2 border-gray-100 hover:border-gray-300 transition-all hover:-translate-y-2 hover:shadow-2xl">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gray-800 rounded-2xl blur-md opacity-30"></div>
                    <div className="relative bg-gray-800 w-20 h-20 rounded-2xl flex items-center justify-center transform group-hover:rotate-6 transition-transform">
                      {renderFeatureIcon(feature)}
                    </div>
                  </div>
                  <h3 className="text-2xl font-black mb-3 text-gray-900 group-hover:text-gray-700 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Sections - Dinámico */}
      {productSections.length > 0 ? (
        productSections.map((section) => (
          <FeaturedProducts key={section.id} section={section} />
        ))
      ) : (
        <FeaturedProducts />
      )}

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4">
        {/* CTA Section - Dinámico */}
        {(cta?.isActive ?? true) && (
          <div className="mt-20 relative group">
            {/* Glow Effect */}
            <div
              className="absolute inset-0 rounded-3xl blur-2xl opacity-30 group-hover:opacity-40 transition-opacity"
              style={{ background: gradientStyle }}
            ></div>

            {/* Card */}
            <div className="relative rounded-3xl p-1 overflow-hidden" style={{ background: gradientStyle }}>
              {/* Inner Content */}
              <div className="bg-white rounded-[22px] p-12 md:p-16 text-center relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}></div>
                </div>

                {/* Floating Emoji */}
                <div className="absolute top-8 right-8 text-6xl opacity-10 animate-pulse-soft">✨</div>
                <div className="absolute bottom-8 left-8 text-6xl opacity-10 animate-pulse-soft" style={{ animationDelay: '1s' }}>🎨</div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Badge */}
                  {(cta?.showBadge ?? true) && cta?.badge && (
                    <div className="mb-6 inline-block">
                      <span className="bg-gray-100 text-gray-700 px-6 py-2 rounded-full text-sm font-bold border-2 border-gray-200 shadow-md">
                        <Sparkles className="w-4 h-4 inline mr-2" />
                        {cta.badge}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h2
                    className="text-4xl md:text-5xl font-display font-black mb-4 bg-clip-text text-transparent"
                    style={{
                      backgroundImage: gradientStyle,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {cta?.title || '¿Listo para crear algo único?'}
                  </h2>

                  {/* Subtitle */}
                  <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    {cta?.subtitle || 'Empieza a diseñar tu prenda personalizada ahora y dale vida a tu creatividad'}
                  </p>

                  {/* CTA Button */}
                  {(cta?.showButton ?? true) && (
                    <Link
                      to={cta?.buttonLink || '/catalog'}
                      className="inline-flex items-center gap-3 text-white px-10 py-5 rounded-2xl text-xl font-bold hover:shadow-2xl transition-all hover:scale-105 group-hover:scale-110"
                      style={{ background: gradientStyle }}
                    >
                      <ShoppingBag className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                      {cta?.buttonText || 'Ver Catálogo'}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
