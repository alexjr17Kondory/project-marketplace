import { Upload, Image as ImageIcon } from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';

// Datos de imagen con original y comprimida
export interface ImageUploadData {
  compressed: string; // Para preview (menor peso)
  original: string; // Para producción (calidad original)
  fileName: string;
  fileSize: number;
}

interface ImageUploaderProps {
  onImageUpload: (imageData: string, uploadData?: ImageUploadData) => void;
  isUploading?: boolean;
}

// Detectar si una imagen tiene transparencia
const hasTransparency = (ctx: CanvasRenderingContext2D, width: number, height: number): boolean => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Revisar canal alpha (cada 4 bytes: R, G, B, A)
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      return true; // Encontró pixel con transparencia
    }
  }
  return false;
};

// Detectar los límites del contenido visible (no transparente) y recortar
const trimTransparentPixels = (imageDataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageDataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0);

      // Verificar si la imagen tiene transparencia
      if (!hasTransparency(ctx, canvas.width, canvas.height)) {
        resolve(imageDataUrl); // No tiene transparencia, devolver original
        return;
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;

      // Umbral de transparencia (píxeles con alpha > 10 se consideran visibles)
      const alphaThreshold = 10;

      // Encontrar los límites del contenido visible
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

      // Si no se encontró contenido visible, devolver original
      if (minX > maxX || minY > maxY) {
        resolve(imageDataUrl);
        return;
      }

      // Agregar pequeño padding (2px) para evitar cortes muy ajustados
      const padding = 2;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(canvas.width - 1, maxX + padding);
      maxY = Math.min(canvas.height - 1, maxY + padding);

      // Crear nuevo canvas con el tamaño recortado
      const trimmedWidth = maxX - minX + 1;
      const trimmedHeight = maxY - minY + 1;

      const trimmedCanvas = document.createElement('canvas');
      trimmedCanvas.width = trimmedWidth;
      trimmedCanvas.height = trimmedHeight;

      const trimmedCtx = trimmedCanvas.getContext('2d');
      if (!trimmedCtx) {
        resolve(imageDataUrl);
        return;
      }

      // Copiar solo la región visible
      trimmedCtx.drawImage(
        canvas,
        minX, minY, trimmedWidth, trimmedHeight,
        0, 0, trimmedWidth, trimmedHeight
      );

      // Devolver imagen recortada como PNG
      resolve(trimmedCanvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(imageDataUrl);
    img.src = imageDataUrl;
  });
};

// Comprimir imagen para preview manteniendo calidad aceptable
const compressImage = (
  originalDataUrl: string,
  maxWidth: number = 800,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Solo redimensionar si es más grande que maxWidth
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);

        // Detectar si la imagen tiene transparencia
        const isTransparent = hasTransparency(ctx, width, height);

        // Usar PNG para imágenes con transparencia, JPEG para las demás
        const format = isTransparent ? 'image/png' : 'image/jpeg';
        const compressed = canvas.toDataURL(format, isTransparent ? undefined : quality);
        resolve(compressed);
      } else {
        resolve(originalDataUrl);
      }
    };
    img.onerror = () => resolve(originalDataUrl);
    img.src = originalDataUrl;
  });
};

export const ImageUploader = ({ onImageUpload, isUploading = false }: ImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 10MB para originales de alta calidad)
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 10MB');
      return;
    }

    // Leer archivo como base64 (original)
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawData = event.target?.result as string;

      // Recortar espacio transparente de imágenes PNG
      const trimmedData = await trimTransparentPixels(rawData);

      // Comprimir para preview (usando la imagen ya recortada)
      const compressedData = await compressImage(trimmedData);

      // Crear objeto con ambas versiones (ambas recortadas)
      const uploadData: ImageUploadData = {
        compressed: compressedData,
        original: trimmedData, // Usar la versión recortada como original
        fileName: file.name,
        fileSize: file.size,
      };

      // Enviar la versión comprimida para el canvas, pero incluir datos completos
      onImageUpload(compressedData, uploadData);

      // Reset file input to allow uploading to different zones
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={handleClick}
        disabled={isUploading}
        className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isUploading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Cargando...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Subir Imagen
          </>
        )}
      </button>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Recomendaciones:</p>
            <ul className="text-xs space-y-1 text-blue-700">
              <li>• Formato: PNG, JPG, SVG</li>
              <li>• Tamaño máximo: 10MB</li>
              <li>• Resolución: 300 DPI para mejor calidad</li>
              <li>• Fondo transparente (PNG) recomendado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
