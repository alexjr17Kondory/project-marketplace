import { useState, useRef, useEffect } from 'react';
import { Upload, Link, X, Image as ImageIcon } from 'lucide-react';
import { Input } from '../shared/Input';

type InputMode = 'file' | 'url';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

export const ImageUploadField = ({
  label,
  value,
  onChange,
  required = false,
  placeholder = 'https://ejemplo.com/imagen.jpg',
}: ImageUploadFieldProps) => {
  const [mode, setMode] = useState<InputMode>('file');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar previewUrl con value externo
  useEffect(() => {
    setPreviewUrl(value || '');
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar 5MB');
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewUrl(dataUrl);
      onChange(dataUrl);
      setUploading(false);
    };
    reader.onerror = () => {
      alert('Error al leer el archivo');
      setUploading(false);
    };
    reader.readAsDataURL(file);

    // Limpiar el input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlChange = (url: string) => {
    setPreviewUrl(url);
    onChange(url);
  };

  const handleClear = () => {
    setPreviewUrl('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModeChange = (newMode: InputMode) => {
    setMode(newMode);
    // No limpiar el valor al cambiar de modo, solo si el usuario lo desea
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && '*'}
        </label>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => handleModeChange('file')}
            className={`px-3 py-1 text-xs font-medium flex items-center gap-1 transition-colors ${
              mode === 'file'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Upload className="w-3 h-3" />
            Archivo
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('url')}
            className={`px-3 py-1 text-xs font-medium flex items-center gap-1 transition-colors ${
              mode === 'url'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Link className="w-3 h-3" />
            URL
          </button>
        </div>
      </div>

      {mode === 'file' ? (
        <div className="space-y-2">
          {previewUrl ? (
            <div className="relative group">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-40 object-contain bg-gray-100 rounded-lg border border-gray-200"
                onError={() => setPreviewUrl('')}
              />
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors bg-gray-50"
            >
              {uploading ? (
                <>
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Cargando...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm font-medium">Haz clic para subir una imagen</span>
                  <span className="text-xs text-gray-400">PNG, JPG, GIF hasta 5MB</span>
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            type="url"
            value={previewUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder}
            required={required && !previewUrl}
          />
          {previewUrl && (
            <div className="relative group">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-40 object-contain bg-gray-100 rounded-lg border border-gray-200"
                onError={() => {
                  // Si la URL no es válida, mostrar placeholder
                }}
              />
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
