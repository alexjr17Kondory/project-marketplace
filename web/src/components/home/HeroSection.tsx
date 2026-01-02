import { Link } from 'react-router-dom';
import { Sparkles, Palette, ShoppingBag, ChevronRight, Flame } from 'lucide-react';
import { HeroCard } from './HeroCard';
import { useSettings } from '../../context/SettingsContext';
import type { HeroCard as HeroCardType, HeroSettings } from '../../types/settings';

// Valores por defecto para el hero
const getDefaultHeroCards = (brandColors: { primary: string; secondary: string; accent: string }): HeroCardType[] => [
  {
    id: 'main',
    position: 'main',
    order: 0,
    title: 'Diseñado por ti,',
    titleLine2: 'hecho por Vexa',
    subtitle: 'Personaliza camisetas, hoodies y más con tus propios diseños.',
    showSubtitle: true,
    showBadge: false,
    buttons: [
      {
        id: 'btn-1',
        text: 'Crear diseño',
        link: '/customizer',
        style: 'primary',
        icon: 'palette',
        isActive: true,
      },
      {
        id: 'btn-2',
        text: 'Ver catálogo',
        link: '/catalog',
        style: 'secondary',
        icon: 'shoppingBag',
        isActive: true,
      },
    ],
    background: {
      type: 'gradient',
      overlayOpacity: 0,
    },
    isActive: true,
  },
  {
    id: 'side-1',
    position: 'side',
    order: 1,
    title: 'Personaliza',
    subtitle: 'Tu creatividad',
    showSubtitle: true,
    showBadge: false,
    buttons: [
      {
        id: 'btn-side-1',
        text: 'Personalizar',
        link: '/customizer',
        style: 'primary',
        isActive: true,
      },
    ],
    background: {
      type: 'gradient',
      gradientColors: {
        from: brandColors.secondary,
        to: brandColors.secondary,
      },
      overlayOpacity: 20,
    },
    isActive: true,
  },
  {
    id: 'side-2',
    position: 'side',
    order: 2,
    title: 'Lo más vendido',
    subtitle: 'Tendencias',
    showSubtitle: true,
    showBadge: false,
    buttons: [
      {
        id: 'btn-side-2',
        text: 'Ver más',
        link: '/catalog?featured=true',
        style: 'primary',
        isActive: true,
      },
    ],
    background: {
      type: 'gradient',
      gradientColors: {
        from: brandColors.accent,
        to: brandColors.accent,
      },
      overlayOpacity: 20,
    },
    isActive: true,
  },
];

interface HeroSectionProps {
  className?: string;
}

export const HeroSection = ({ className = '' }: HeroSectionProps) => {
  const { settings } = useSettings();

  // Colores de marca dinámicos
  const brandColors = settings.appearance?.brandColors || settings.general.brandColors || {
    primary: '#7c3aed',
    secondary: '#ec4899',
    accent: '#f59e0b',
  };

  // Obtener configuración del hero
  const heroSettings = settings.home?.hero;

  // Usar cards configurados o los por defecto
  const allCards = heroSettings?.cards?.length > 0
    ? heroSettings.cards
    : getDefaultHeroCards(brandColors);

  // Separar carta principal y laterales
  const mainCard = allCards.find(c => c.position === 'main' && c.isActive);
  const sideCards = allCards
    .filter(c => c.position === 'side' && c.isActive)
    .sort((a, b) => a.order - b.order)
    .slice(0, 3); // Máximo 3 cartas laterales

  // Configuración de visibilidad
  const showSideCards = heroSettings?.showSideCards ?? true;

  // Calcular el grid según la cantidad de cartas laterales
  const getSideCardsGridClass = () => {
    if (!showSideCards || sideCards.length === 0) return '';
    switch (sideCards.length) {
      case 1:
        return 'md:grid-cols-3'; // Main ocupa 2, side ocupa 1
      case 2:
        return 'md:grid-cols-3'; // Main ocupa 2, 2 sides
      case 3:
        return 'md:grid-cols-4'; // Main ocupa 2, 3 sides más pequeños
      default:
        return 'md:grid-cols-3';
    }
  };

  // Calcular el height de cada carta lateral basado en la cantidad
  const getSideCardHeight = () => {
    switch (sideCards.length) {
      case 1:
        return 'min-h-[300px]'; // Una sola carta lateral, altura completa
      case 2:
        return 'min-h-[142px]'; // 2 cartas, se dividen la altura
      case 3:
        return 'min-h-[93px]'; // 3 cartas, cada una más pequeña
      default:
        return 'min-h-[142px]';
    }
  };

  if (!mainCard) {
    return null; // No mostrar hero si no hay carta principal
  }

  return (
    <div className={`bg-gray-100 py-4 md:py-6 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Bento Grid Container */}
        <div className={`grid grid-cols-1 ${showSideCards && sideCards.length > 0 ? getSideCardsGridClass() : ''} gap-3 md:gap-4`}>
          {/* Main Card - Ocupa 2 columnas y su altura se adapta a las laterales */}
          <HeroCard
            card={mainCard}
            isMain
            className={`${showSideCards && sideCards.length > 0 ? 'md:col-span-2 md:row-span-' + sideCards.length : ''} min-h-[220px] md:min-h-[300px]`}
          />

          {/* Side Cards */}
          {showSideCards && sideCards.map((card) => (
            <HeroCard
              key={card.id}
              card={card}
              className={`hidden md:flex hover:scale-[1.02] transition-transform flex-col ${getSideCardHeight()}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
