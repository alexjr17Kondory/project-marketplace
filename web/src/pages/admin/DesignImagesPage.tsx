import { useState, useEffect, useRef } from 'react';
import { designImagesService, type DesignImage } from '../../services/design-images.service';
import { Button } from '../../components/shared/Button';
import { Plus, Settings, Trash2, Image as ImageIcon, Search, Filter, Upload, Link, Loader2 } from 'lucide-react';

export default function DesignImagesPage() {
  const [images, setImages] = useState<DesignImage[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterActive, setFilterActive] = useState<string>('');

  // Modal para crear/editar
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState<DesignImage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    thumbnailUrl: '',
    fullUrl: '',
    category: '',
    tags: '',
    sortOrder: 0,
    isActive: true,
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para comprimir imagen y convertir a base64 (mantiene PNG con transparencia)
  const compressImage = (file: File, maxWidth: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Escalar si es muy grande
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo crear el contexto del canvas'));
            return;
          }

          // Fondo transparente para PNG
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Mantener formato PNG para conservar transparencia
          const compressedBase64 = canvas.toDataURL('image/png');
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  // Manejar subida de archivo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen');
      return;
    }

    try {
      setUploadingFile(true);

      // Redimensionar para thumbnail (máx 300px, mantiene PNG con transparencia)
      // No hay límite de tamaño de entrada, se redimensiona automáticamente
      const thumbnailBase64 = await compressImage(file, 300);

      // Usar el nombre del archivo como nombre por defecto
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Sin extensión

      setFormData(prev => ({
        ...prev,
        thumbnailUrl: thumbnailBase64,
        name: prev.name || fileName,
      }));

    } catch (error) {
      console.error('Error al procesar imagen:', error);
      alert('Error al procesar la imagen. Intenta con otra imagen.');
    } finally {
      setUploadingFile(false);
      // Limpiar input para permitir subir el mismo archivo de nuevo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    loadImages();
    loadCategories();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const filters: { isActive?: boolean; category?: string; search?: string } = {};

      if (filterActive === 'true') filters.isActive = true;
      if (filterActive === 'false') filters.isActive = false;
      if (filterCategory) filters.category = filterCategory;
      if (searchQuery) filters.search = searchQuery;

      console.log('Cargando imágenes con filtros:', filters);
      const data = await designImagesService.getAll(filters);
      console.log('Imágenes recibidas:', data?.length, 'registros');
      setImages(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Error al cargar las imágenes');
      setImages([]);
      console.error('Error cargando imágenes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await designImagesService.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  };

  // Aplicar filtros cuando cambian
  useEffect(() => {
    const debounce = setTimeout(() => {
      loadImages();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, filterCategory, filterActive]);

  const openCreateModal = () => {
    setEditingImage(null);
    setFormData({
      name: '',
      description: '',
      thumbnailUrl: '',
      fullUrl: '',
      category: '',
      tags: '',
      sortOrder: 0,
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (image: DesignImage) => {
    setEditingImage(image);
    setFormData({
      name: image.name,
      description: image.description || '',
      thumbnailUrl: image.thumbnailUrl,
      fullUrl: image.fullUrl,
      category: image.category || '',
      tags: image.tags?.join(', ') || '',
      sortOrder: image.sortOrder,
      isActive: image.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación manual
    if (!formData.thumbnailUrl) {
      alert('Por favor sube una imagen para mostrar en el personalizador');
      return;
    }

    if (!formData.fullUrl) {
      alert('Por favor ingresa la URL de alta calidad');
      return;
    }

    try {
      const data = {
        name: formData.name,
        description: formData.description || undefined,
        thumbnailUrl: formData.thumbnailUrl,
        fullUrl: formData.fullUrl,
        category: formData.category || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : undefined,
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
      };

      console.log('Enviando datos:', { ...data, thumbnailUrl: data.thumbnailUrl.substring(0, 50) + '...' });

      if (editingImage) {
        await designImagesService.update(editingImage.id, data);
      } else {
        await designImagesService.create(data);
      }

      setShowModal(false);
      loadImages();
      loadCategories();
    } catch (err: any) {
      console.error('Error al guardar:', err);
      alert(`Error al guardar la imagen: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen?')) return;

    try {
      await designImagesService.remove(id);
      loadImages();
    } catch (err) {
      alert('Error al eliminar la imagen');
      console.error(err);
    }
  };

  if (loading && images.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-gray-600">Cargando imágenes de diseño...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Imágenes de Diseño</h1>
            <p className="text-sm text-gray-500 mt-1">
              Catálogo de imágenes prediseñadas para el personalizador
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Imagen
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filtro por categoría */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por estado */}
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Contador de resultados */}
      <div className="mb-4 text-sm text-gray-600">
        {loading ? 'Cargando...' : `${images.length} imagen(es) encontrada(s)`}
      </div>

      {/* Grid de imágenes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {images.length === 0 && !loading ? (
          <div className="col-span-full py-12 text-center">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay imágenes de diseño</p>
            <button
              onClick={openCreateModal}
              className="mt-4 text-purple-600 hover:text-purple-700"
            >
              Crear la primera imagen
            </button>
          </div>
        ) : (
          images.map((image) => (
            <div
              key={image.id}
              className={`bg-white rounded-lg shadow-sm border-2 overflow-hidden hover:shadow-md transition-all ${
                image.isActive ? 'border-gray-200' : 'border-red-200 opacity-60'
              }`}
            >
              {/* Preview */}
              <div className="aspect-square bg-gray-100 relative group">
                <img
                  src={image.thumbnailUrl}
                  alt={image.name}
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=Error';
                  }}
                />
                {/* Overlay con acciones */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => openEditModal(image)}
                    className="p-2 bg-white rounded-full text-blue-600 hover:bg-blue-50"
                    title="Editar"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
                {/* Badge de estado */}
                {!image.isActive && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Inactivo
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-3">
                <h3 className="font-medium text-sm text-gray-900 truncate" title={image.name}>
                  {image.name}
                </h3>
                {image.category && (
                  <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    {image.category}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingImage ? 'Editar Imagen' : 'Nueva Imagen de Diseño'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: Corazón rojo"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Descripción opcional"
                  />
                </div>

                {/* Sección de imagen para mostrar (thumbnail) */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    <Upload className="w-4 h-4 inline mr-1" />
                    Imagen para mostrar en el personalizador *
                  </label>

                  {/* Opción 1: Subir archivo */}
                  <div className="mb-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="thumbnail-upload"
                    />
                    <label
                      htmlFor="thumbnail-upload"
                      className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors ${uploadingFile ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {uploadingFile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-purple-600 font-medium">Subir imagen</span>
                        </>
                      )}
                    </label>
                    <span className="text-xs text-gray-500 ml-2">
                      Se comprimirá automáticamente
                    </span>
                  </div>

                  {/* Vista previa del thumbnail */}
                  {formData.thumbnailUrl && (
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={formData.thumbnailUrl}
                          alt="Preview"
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Error';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-green-600 font-medium">Imagen cargada</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {formData.thumbnailUrl.startsWith('data:') ? 'Archivo subido (base64)' : formData.thumbnailUrl}
                        </p>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, thumbnailUrl: '' })}
                          className="text-xs text-red-500 hover:text-red-700 mt-1"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* URL de alta calidad */}
                <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Link className="w-4 h-4 inline mr-1" />
                    URL de alta calidad (para pedidos) *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.fullUrl}
                    onChange={(e) => setFormData({ ...formData, fullUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://drive.google.com/... o https://dropbox.com/..."
                  />
                  <p className="text-xs text-blue-600 mt-2">
                    Esta URL se usa cuando tomas el pedido para descargar la imagen en alta calidad.
                    Puedes usar Google Drive, Dropbox, OneDrive, etc.
                  </p>
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: Iconos, Logos, Textos..."
                    list="categories-list"
                  />
                  <datalist id="categories-list">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etiquetas
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="amor, corazón, rojo (separadas por coma)"
                  />
                </div>

                {/* Orden y Estado */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Orden
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Activo
                    </label>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4 border-t mt-4">
                  {editingImage && (
                    <Button
                      type="button"
                      variant="admin-danger"
                      onClick={() => {
                        setShowModal(false);
                        handleDelete(editingImage.id);
                      }}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="admin-primary"
                    className="flex-1"
                  >
                    {editingImage ? 'Guardar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
