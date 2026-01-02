import { Link } from 'react-router-dom';
import { Sparkles, ShoppingBag, Palette, Package, Truck, Shield, Heart, Star, Zap, Gift, Percent, Quote, ChevronRight, Flame } from 'lucide-react';
import { FeaturedProducts } from '../components/products/FeaturedProducts';
import { useSettings } from '../context/SettingsContext';

// Mapeo de iconos por ID
const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
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

// Testimonios estáticos (en producción vendrían de API/settings)
const testimonials = [
  {
    id: 1,
    name: 'María González',
    role: 'Emprendedora',
    avatar: 'https://i.pravatar.cc/100?img=1',
    text: 'La calidad de las camisetas superó mis expectativas. El proceso de personalización fue súper fácil y rápido.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Carlos Rodríguez',
    role: 'Diseñador Gráfico',
    avatar: 'https://i.pravatar.cc/100?img=3',
    text: 'Como diseñador, valoro mucho la fidelidad del color. Vexa reproduce mis diseños exactamente como los imaginé.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Ana Martínez',
    role: 'Community Manager',
    avatar: 'https://i.pravatar.cc/100?img=5',
    text: 'Pedí hoodies para todo mi equipo de trabajo. El envío fue rápido y todos quedaron encantados con la calidad.',
    rating: 5,
  },
];

export const HomePage = () => {
  const { settings } = useSettings();

  // Colores de marca dinámicos
  const brandColors = settings.appearance?.brandColors || settings.general.brandColors || {
    primary: '#7c3aed',
    secondary: '#ec4899',
    accent: '#f59e0b',
  };
  const gradientBgStyle = `linear-gradient(to bottom right, ${brandColors.primary}, ${brandColors.secondary}, ${brandColors.accent})`;

  // Settings del Home
  const homeSettings = settings.home;
  const hero = homeSettings?.hero;
  const features = homeSettings?.features?.filter(f => f.isActive).sort((a, b) => a.order - b.order) || [];
  const showFeatures = homeSettings?.showFeatures ?? true;
  const cta = homeSettings?.cta;
  const productSections = homeSettings?.productSections?.filter(s => s.isActive).sort((a, b) => a.order - b.order) || [];

  return (
    <div className="overflow-x-hidden bg-gray-100 min-h-screen">
      {/* Hero Section - Bento Grid Style */}
      <div className="bg-gray-100 py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4">
          {/* Bento Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">

            {/* Main Banner - Large Card (2/3 width on desktop) */}
            <div
              className="md:col-span-2 md:row-span-2 relative rounded-2xl overflow-hidden min-h-[220px] md:min-h-[300px] group"
              style={{ background: gradientBgStyle }}
            >
              {/* Pattern Overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-center p-5 md:p-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-black text-white drop-shadow-lg leading-tight mb-2 md:mb-3">
                  <span className="block">Diseñado por ti,</span>
                  <span className="block text-white/90">hecho por Vexa</span>
                </h1>
                <p className="text-sm md:text-base text-white/90 mb-4 max-w-md">
                  {hero?.subtitle || 'Personaliza camisetas, hoodies y más con tus propios diseños.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/customizer"
                    className="bg-white px-4 py-2.5 md:px-5 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-bold hover:bg-gray-100 inline-flex items-center gap-1.5 md:gap-2 transition-all hover:scale-105 shadow-lg group/btn"
                    style={{ color: brandColors.primary }}
                  >
                    <Palette className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:rotate-12 transition-transform" />
                    Crear diseño
                    <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/catalog"
                    className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-2.5 md:px-5 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-bold hover:bg-white/30 inline-flex items-center gap-1.5 md:gap-2 transition-all"
                  >
                    <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
                    Ver catálogo
                  </Link>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -right-10 -bottom-10 w-40 h-40 md:w-60 md:h-60 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -left-10 -top-10 w-32 h-32 md:w-40 md:h-40 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* Side Card 1 - Personaliza */}
            <Link
              to="/customizer"
              className="hidden md:flex relative rounded-2xl overflow-hidden min-h-[142px] group hover:scale-[1.02] transition-transform flex-col"
              style={{ backgroundColor: brandColors.secondary }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-black/0 to-black/20"></div>
              <div className="relative z-10 h-full flex flex-col justify-between p-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-medium">Tu creatividad</p>
                  <h3 className="text-white text-lg font-bold flex items-center gap-1.5">
                    Personaliza
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </h3>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            </Link>

            {/* Side Card 2 - Lo más vendido */}
            <Link
              to="/catalog?featured=true"
              className="hidden md:flex relative rounded-2xl overflow-hidden min-h-[142px] group hover:scale-[1.02] transition-transform flex-col"
              style={{ backgroundColor: brandColors.accent }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-black/0 to-black/20"></div>
              <div className="relative z-10 h-full flex flex-col justify-between p-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-medium">Tendencias</p>
                  <h3 className="text-white text-lg font-bold flex items-center gap-1.5">
                    Lo más vendido
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </h3>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            </Link>
          </div>

          {/* Trust Bar - Características en tarjetas individuales */}
          {showFeatures && features.length > 0 && (
            <div className="mt-3 md:mt-4 flex flex-wrap gap-2 md:gap-3">
              {features.slice(0, 4).map((feature) => {
                const IconComponent = iconMap[feature.icon] || Sparkles;
                return (
                  <div
                    key={feature.id}
                    className="bg-white rounded-xl p-3 md:p-4 shadow-sm flex items-center gap-3 flex-1 min-w-[calc(50%-0.25rem)] md:min-w-0"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${brandColors.primary}15`, color: brandColors.primary }}
                    >
                      <IconComponent className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">{feature.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 hidden sm:block">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* Product Sections - Dinámico */}
      {productSections.length > 0 ? (
        productSections.map((section) => (
          <FeaturedProducts key={section.id} section={section} />
        ))
      ) : (
        <FeaturedProducts />
      )}

      {/* Testimonios Section */}
      <section className="py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                Lo que dicen nuestros clientes
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                Miles de personas ya crearon sus diseños únicos con Vexa
              </p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                >
                  {/* Quote Icon */}
                  <Quote
                    className="w-6 h-6 mb-3 opacity-30"
                    style={{ color: brandColors.primary }}
                  />

                  {/* Text */}
                  <p className="text-gray-700 mb-4 leading-relaxed text-sm">
                    "{testimonial.text}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                      <p className="text-xs text-gray-500">{testimonial.role}</p>
                    </div>
                    {/* Rating */}
                    <div className="flex gap-0.5">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final Section */}
      <section className="py-4 md:py-6 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div
            className="rounded-2xl p-6 md:p-10 text-center text-white overflow-hidden relative"
            style={{ background: gradientBgStyle }}
          >
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
            </div>

            <div className="relative z-10">
              {/* Slogan */}
              <p className="text-sm md:text-base font-medium text-white/80 mb-2">
                Recuerda...
              </p>
              <h2 className="text-2xl md:text-4xl font-display font-black mb-4">
                Diseñado por ti, hecho por Vexa
              </h2>
              <p className="text-sm md:text-lg text-white/90 mb-6 max-w-xl mx-auto">
                {cta?.subtitle || 'Tu creatividad merece la mejor calidad. Empieza a diseñar ahora.'}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link
                  to="/customizer"
                  className="bg-white px-6 py-3 rounded-xl text-base font-bold hover:bg-gray-100 inline-flex items-center gap-2 transition-all hover:scale-105 shadow-lg"
                  style={{ color: brandColors.primary }}
                >
                  <Palette className="w-5 h-5" />
                  Empezar a diseñar
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/catalog"
                  className="bg-white/10 backdrop-blur-sm border-2 border-white/50 text-white px-6 py-3 rounded-xl text-base font-bold hover:bg-white/20 inline-flex items-center gap-2 transition-all"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Explorar productos
                </Link>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </div>
        </div>
      </section>
    </div>
  );
};
