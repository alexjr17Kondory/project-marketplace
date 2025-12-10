/**
 * Utilidad para detectar los límites del contenido visible de un PNG
 * Encuentra el bounding box de los píxeles no transparentes
 */

export interface PngBounds {
  // Límites como porcentaje de la imagen (0-100)
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * Detecta los límites del contenido visible (no transparente) de una imagen PNG
 * @param imageSource - URL o base64 de la imagen
 * @returns Promise con los límites como porcentajes
 */
export const detectPngBounds = (imageSource: string): Promise<PngBounds> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('No se pudo crear el contexto del canvas'));
        return;
      }

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;

      // Umbral de transparencia (píxeles con alpha > 10 se consideran visibles)
      const alphaThreshold = 10;

      // Recorrer todos los píxeles para encontrar los límites del contenido visible
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const index = (y * canvas.width + x) * 4;
          const alpha = data[index + 3];

          if (alpha > alphaThreshold) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Si no se encontró contenido visible, usar toda la imagen
      if (minX > maxX || minY > maxY) {
        resolve({
          left: 0,
          top: 0,
          right: 100,
          bottom: 100,
          width: 100,
          height: 100,
        });
        return;
      }

      // Convertir a porcentajes
      const bounds: PngBounds = {
        left: (minX / canvas.width) * 100,
        top: (minY / canvas.height) * 100,
        right: ((maxX + 1) / canvas.width) * 100,
        bottom: ((maxY + 1) / canvas.height) * 100,
        width: ((maxX - minX + 1) / canvas.width) * 100,
        height: ((maxY - minY + 1) / canvas.height) * 100,
      };

      resolve(bounds);
    };

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };

    img.src = imageSource;
  });
};

/**
 * Limita una posición para que el diseño no se salga de los límites del PNG
 * @param position - Posición actual del diseño (centro, en porcentaje)
 * @param designSize - Tamaño del diseño (en porcentaje)
 * @param bounds - Límites del contenido visible del PNG
 * @returns Nueva posición limitada
 */
export const clampPositionToBounds = (
  position: { x: number; y: number },
  designSize: { width: number; height: number },
  bounds: PngBounds
): { x: number; y: number } => {
  const halfWidth = designSize.width / 2;
  const halfHeight = designSize.height / 2;

  // Calcular límites para el centro del diseño
  const minX = bounds.left + halfWidth;
  const maxX = bounds.right - halfWidth;
  const minY = bounds.top + halfHeight;
  const maxY = bounds.bottom - halfHeight;

  return {
    x: Math.max(minX, Math.min(maxX, position.x)),
    y: Math.max(minY, Math.min(maxY, position.y)),
  };
};

/**
 * Verifica si un diseño está dentro de los límites del PNG
 */
export const isDesignWithinBounds = (
  position: { x: number; y: number },
  designSize: { width: number; height: number },
  bounds: PngBounds
): boolean => {
  const halfWidth = designSize.width / 2;
  const halfHeight = designSize.height / 2;

  const designLeft = position.x - halfWidth;
  const designRight = position.x + halfWidth;
  const designTop = position.y - halfHeight;
  const designBottom = position.y + halfHeight;

  return (
    designLeft >= bounds.left &&
    designRight <= bounds.right &&
    designTop >= bounds.top &&
    designBottom <= bounds.bottom
  );
};
