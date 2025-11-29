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
        // Usar JPEG para mejor compresión, pero PNG si tiene transparencia
        const compressed = canvas.toDataURL('image/jpeg', quality);
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
      const originalData = event.target?.result as string;

      // Comprimir para preview
      const compressedData = await compressImage(originalData);

      // Crear objeto con ambas versiones
      const uploadData: ImageUploadData = {
        compressed: compressedData,
        original: originalData,
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
