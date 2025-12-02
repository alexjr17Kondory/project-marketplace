import { useState, useEffect } from 'react';
import type { Product, ProductType, ProductCategory } from '../../types/product';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { X } from 'lucide-react';
import { catalogsService } from '../../services/catalogs.service';
import type { Color, Size, Category, ProductType as CatalogProductType } from '../../services/catalogs.service';

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDelete?: () => void;
}

export const ProductForm = ({ product, onSubmit, onDelete }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    typeId: product?.typeId || null as number | null,
    categoryId: product?.categoryId || null as number | null,
    basePrice: product?.basePrice || 0,
    stock: product?.stock || 0,
    featured: product?.featured || false,
    rating: product?.rating || 0,
    reviewsCount: product?.reviewsCount || 0,
    tags: product?.tags?.join(', ') || '',
    frontImage: product?.images.front || '',
    backImage: product?.images.back || '',
    sideImage: product?.images.side || '',
  });

  // Catálogos disponibles
  const [availableColors, setAvailableColors] = useState<Color[]>([]);
  const [availableSizes, setAvailableSizes] = useState<Size[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [availableProductTypes, setAvailableProductTypes] = useState<CatalogProductType[]>([]);

  // IDs seleccionados
  const [selectedColorIds, setSelectedColorIds] = useState<number[]>(
    product?.colors?.map(c => c.id) || []
  );
  const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>(
    Array.isArray(product?.sizes)
      ? product.sizes.map(s => typeof s === 'string' ? 0 : s.id).filter(id => id > 0)
      : []
  );

  // Cargar catálogos al montar
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [colors, categories, productTypes] = await Promise.all([
          catalogsService.getColors(),
          catalogsService.getCategories(),
          catalogsService.getProductTypes(),
        ]);
        setAvailableColors(colors);
        setAvailableCategories(categories);
        setAvailableProductTypes(productTypes);
      } catch (error) {
        console.error('Error cargando catálogos:', error);
      }
    };
    loadCatalogs();
  }, []);

  // Cargar tallas cuando cambia el tipo de producto
  useEffect(() => {
    const loadSizes = async () => {
      if (formData.typeId) {
        try {
          const sizes = await catalogsService.getSizesByProductType(formData.typeId);
          setAvailableSizes(sizes);
          // Limpiar tallas seleccionadas que no estén disponibles para este tipo
          setSelectedSizeIds(prev => prev.filter(id => sizes.some(s => s.id === id)));
        } catch (error) {
          console.error('Error cargando tallas:', error);
          setAvailableSizes([]);
        }
      } else {
        // Si no hay tipo seleccionado, mostrar todas las tallas
        try {
          const sizes = await catalogsService.getSizes();
          setAvailableSizes(sizes);
        } catch (error) {
          console.error('Error cargando tallas:', error);
        }
      }
    };
    loadSizes();
  }, [formData.typeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convertir IDs a objetos completos para el backend
    const selectedColors = availableColors.filter(c => selectedColorIds.includes(c.id));
    const selectedSizes = availableSizes.filter(s => selectedSizeIds.includes(s.id));

    const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name,
      description: formData.description,
      typeId: formData.typeId,
      categoryId: formData.categoryId,
      basePrice: Number(formData.basePrice),
      stock: Number(formData.stock),
      featured: formData.featured,
      rating: formData.rating || undefined,
      reviewsCount: formData.reviewsCount || undefined,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      images: {
        front: formData.frontImage,
        back: formData.backImage || undefined,
        side: formData.sideImage || undefined,
      },
      colors: selectedColors.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        hexCode: c.hexCode,
      })),
      sizes: selectedSizes.map(s => ({
        id: s.id,
        name: s.name,
        abbreviation: s.abbreviation,
      })),
    };

    onSubmit(productData);
  };

  const toggleColor = (colorId: number) => {
    setSelectedColorIds(prev =>
      prev.includes(colorId)
        ? prev.filter(id => id !== colorId)
        : [...prev, colorId]
    );
  };

  const toggleSize = (sizeId: number) => {
    setSelectedSizeIds(prev =>
      prev.includes(sizeId)
        ? prev.filter(id => id !== sizeId)
        : [...prev, sizeId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-12 gap-3">
        {/* Primera fila: Nombre completo */}
        <div className="col-span-12">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Producto *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Segunda fila: Descripción completa */}
        <div className="col-span-12">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            rows={3}
            required
          />
        </div>

        {/* Tercera fila: Categoría, Tipo, Precio, Stock */}
        <div className="col-span-12 md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría *
          </label>
          <select
            value={formData.categoryId || ''}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          >
            <option value="">Selecciona una categoría</option>
            {availableCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-12 md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Producto *
          </label>
          <select
            value={formData.typeId || ''}
            onChange={(e) => setFormData({ ...formData, typeId: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          >
            <option value="">Selecciona un tipo</option>
            {availableProductTypes
              .filter(type => !formData.categoryId || type.categoryId === formData.categoryId)
              .map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
          </select>
        </div>

        <div className="col-span-12 md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio ($) *
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.basePrice}
            onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
            required
          />
        </div>

        <div className="col-span-12 md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock *
          </label>
          <Input
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
            required
          />
        </div>

        {/* Cuarta fila: Imagen Frontal completa */}
        <div className="col-span-12">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Imagen Frontal (URL) *
          </label>
          <Input
            type="url"
            value={formData.frontImage}
            onChange={(e) => setFormData({ ...formData, frontImage: e.target.value })}
            required
            placeholder="https://ejemplo.com/imagen-frontal.jpg"
          />
        </div>

        {/* Quinta fila: Imágenes Trasera y Lateral */}
        <div className="col-span-12 md:col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Imagen Trasera (URL)
          </label>
          <Input
            type="url"
            value={formData.backImage}
            onChange={(e) => setFormData({ ...formData, backImage: e.target.value })}
            placeholder="https://ejemplo.com/imagen-trasera.jpg"
          />
        </div>

        <div className="col-span-12 md:col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Imagen Lateral (URL)
          </label>
          <Input
            type="url"
            value={formData.sideImage}
            onChange={(e) => setFormData({ ...formData, sideImage: e.target.value })}
            placeholder="https://ejemplo.com/imagen-lateral.jpg"
          />
        </div>

        {/* Sexta fila: Rating, Reviews, Tags, Destacado */}
        <div className="col-span-12 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rating (0-5)
          </label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
          />
        </div>

        <div className="col-span-12 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reseñas
          </label>
          <Input
            type="number"
            min="0"
            value={formData.reviewsCount}
            onChange={(e) => setFormData({ ...formData, reviewsCount: parseInt(e.target.value) })}
          />
        </div>

        <div className="col-span-12 md:col-span-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (separados por coma)
          </label>
          <Input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="básico, algodón, unisex"
          />
        </div>

        <div className="col-span-12 md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            &nbsp;
          </label>
          <label className="flex items-center space-x-2 h-10 px-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">Destacado</span>
          </label>
        </div>

        {/* Séptima fila: Colores (selector con checkboxes) */}
        <div className="col-span-12 md:col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Colores * (selecciona al menos uno)
          </label>
          <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
            {availableColors.length === 0 ? (
              <p className="text-sm text-gray-500">Cargando colores...</p>
            ) : (
              <div className="space-y-2">
                {availableColors.map(color => (
                  <label
                    key={color.id}
                    className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColorIds.includes(color.id)}
                      onChange={() => toggleColor(color.id)}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div
                      className="w-8 h-8 rounded border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: color.hexCode }}
                      title={color.hexCode}
                    />
                    <span className="text-sm font-medium text-gray-700 flex-1">
                      {color.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {selectedColorIds.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {selectedColorIds.length} color{selectedColorIds.length !== 1 ? 'es' : ''} seleccionado{selectedColorIds.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Tallas (selector con checkboxes) */}
        <div className="col-span-12 md:col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tallas * (selecciona al menos una)
          </label>
          <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
            {!formData.typeId ? (
              <p className="text-sm text-gray-500">Selecciona un tipo de producto primero para ver las tallas disponibles</p>
            ) : availableSizes.length === 0 ? (
              <p className="text-sm text-gray-500">No hay tallas asignadas a este tipo de producto</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableSizes.map(size => (
                  <label
                    key={size.id}
                    className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSizeIds.includes(size.id)}
                      onChange={() => toggleSize(size.id)}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {size.abbreviation} <span className="text-xs text-gray-500">({size.name})</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {selectedSizeIds.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {selectedSizeIds.length} talla{selectedSizeIds.length !== 1 ? 's' : ''} seleccionada{selectedSizeIds.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-12 gap-3 pt-6 mt-6 border-t border-gray-200">
        {onDelete ? (
          <>
            <div className="col-span-12 sm:col-span-6">
              <Button
                type="button"
                onClick={onDelete}
                variant="admin-danger"
                className="w-full"
              >
                Eliminar Producto
              </Button>
            </div>
            <div className="col-span-12 sm:col-span-6">
              <Button
                type="submit"
                variant="admin-primary"
                className="w-full"
                disabled={selectedColorIds.length === 0 || selectedSizeIds.length === 0}
              >
                Actualizar Producto
              </Button>
            </div>
          </>
        ) : (
          <div className="col-span-12">
            <Button
              type="submit"
              variant="admin-primary"
              className="w-full"
              disabled={selectedColorIds.length === 0 || selectedSizeIds.length === 0}
            >
              Crear Producto
            </Button>
          </div>
        )}
      </div>
    </form>
  );
};
