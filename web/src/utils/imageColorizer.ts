/**
 * Utilidad para aplicar color a imágenes PNG preservando transparencia
 * Solo colorea los píxeles visibles (no transparentes)
 */

// Convertir hex a RGB
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Aplica un color a una imagen PNG preservando la transparencia
 * Usa el modo "multiply" - el color se aplica sobre los píxeles existentes
 * @param imageDataUrl - Base64 de la imagen original
 * @param color - Color hex a aplicar (ej: "#FF0000")
 * @returns Promise con el base64 de la imagen coloreada
 */
export const applyColorToImage = (
  imageDataUrl: string,
  color: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const rgb = hexToRgb(color);
    if (!rgb) {
      reject(new Error('Color hex inválido'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo obtener contexto 2D'));
        return;
      }

      // Dibujar imagen original
      ctx.drawImage(img, 0, 0);

      // Obtener datos de píxeles
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Aplicar color a cada píxel no transparente
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];

        // Solo procesar píxeles que no son completamente transparentes
        if (alpha > 0) {
          // Obtener luminosidad del píxel original (escala de grises)
          const originalR = data[i];
          const originalG = data[i + 1];
          const originalB = data[i + 2];

          // Calcular luminosidad (fórmula estándar)
          const luminance = (0.299 * originalR + 0.587 * originalG + 0.114 * originalB) / 255;

          // Aplicar el color multiplicado por la luminosidad
          // Esto preserva los detalles de la imagen original
          data[i] = Math.round(rgb.r * luminance);     // R
          data[i + 1] = Math.round(rgb.g * luminance); // G
          data[i + 2] = Math.round(rgb.b * luminance); // B
          // Alpha se mantiene igual (data[i + 3])
        }
      }

      // Poner datos modificados de vuelta
      ctx.putImageData(imageData, 0, 0);

      // Exportar como PNG para preservar transparencia
      const colorizedDataUrl = canvas.toDataURL('image/png');
      resolve(colorizedDataUrl);
    };

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };

    img.src = imageDataUrl;
  });
};

/**
 * Aplica color sólido (reemplaza completamente el color original)
 * Útil para logos monocromáticos
 */
export const applyFlatColorToImage = (
  imageDataUrl: string,
  color: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const rgb = hexToRgb(color);
    if (!rgb) {
      reject(new Error('Color hex inválido'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo obtener contexto 2D'));
        return;
      }

      // Dibujar imagen original
      ctx.drawImage(img, 0, 0);

      // Obtener datos de píxeles
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Reemplazar color de cada píxel no transparente
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];

        // Solo procesar píxeles que no son completamente transparentes
        if (alpha > 0) {
          data[i] = rgb.r;     // R
          data[i + 1] = rgb.g; // G
          data[i + 2] = rgb.b; // B
          // Alpha se mantiene igual
        }
      }

      ctx.putImageData(imageData, 0, 0);

      const colorizedDataUrl = canvas.toDataURL('image/png');
      resolve(colorizedDataUrl);
    };

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };

    img.src = imageDataUrl;
  });
};

// Colores predefinidos para el selector
export const DESIGN_COLORS = [
  { name: 'Original', value: '' },
  { name: 'Negro', value: '#000000' },
  { name: 'Blanco', value: '#FFFFFF' },
  { name: 'Rojo', value: '#EF4444' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Amarillo', value: '#F59E0B' },
  { name: 'Morado', value: '#8B5CF6' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Naranja', value: '#F97316' },
  { name: 'Cian', value: '#06B6D4' },
];
