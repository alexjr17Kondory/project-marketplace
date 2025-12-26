import { useState, useEffect, useMemo } from 'react';
import { Search, Package, Boxes, X, Plus, Minus } from 'lucide-react';
import { Button } from '../shared/Button';
import { productsService } from '../../services/products.service';
import { inputsService, type Input } from '../../services/inputs.service';
import * as variantsService from '../../services/variants.service';
import type { Product } from '../../types/product';

export interface PurchaseItem {
  type: 'variant' | 'input';
  variantId?: number;
  inputId?: number;
  productName: string;
  variantInfo?: string; // e.g., "Rojo - M"
  sku?: string;
  quantity: number;
  unitCost: number;
}

interface Props {
  onItemsSelected: (items: PurchaseItem[]) => void;
  onClose: () => void;
}

export function PurchaseItemSelector({ onItemsSelected, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'products' | 'inputs'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [inputs, setInputs] = useState<Input[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected product for matrix view
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productVariants, setProductVariants] = useState<variantsService.ProductVariant[]>([]);
  const [variantQuantities, setVariantQuantities] = useState<Record<number, number>>({});
  const [unitCost, setUnitCost] = useState(0);

  // For inputs - direct quantity selection
  const [selectedInputs, setSelectedInputs] = useState<Record<number, { quantity: number; unitCost: number }>>({});

  // Load products on search
  useEffect(() => {
    const searchProducts = async () => {
      if (activeTab !== 'products') return;
      setLoading(true);
      try {
        const result = await productsService.getAll({ search: searchTerm, limit: 20 });
        setProducts(result.data);
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchProducts, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, activeTab]);

  // Load inputs on search
  useEffect(() => {
    const searchInputs = async () => {
      if (activeTab !== 'inputs') return;
      setLoading(true);
      try {
        const result = await inputsService.getAll({ search: searchTerm });
        setInputs(result);
      } catch (error) {
        console.error('Error searching inputs:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchInputs, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, activeTab]);

  // Load variants when product is selected
  useEffect(() => {
    const loadVariants = async () => {
      if (!selectedProduct) return;
      try {
        const variants = await variantsService.getVariants({
          productId: Number(selectedProduct.id),
          isActive: true
        });
        setProductVariants(variants);
        setVariantQuantities({});
        setUnitCost(selectedProduct.basePrice);
      } catch (error) {
        console.error('Error loading variants:', error);
      }
    };
    loadVariants();
  }, [selectedProduct]);

  // Get unique colors and sizes from variants
  const { colors, sizes } = useMemo(() => {
    const colorMap = new Map<number, { id: number; name: string; hexCode: string }>();
    const sizeMap = new Map<number, { id: number; name: string; abbreviation: string }>();

    productVariants.forEach(v => {
      if (v.color) {
        colorMap.set(v.color.id, v.color);
      }
      if (v.size) {
        sizeMap.set(v.size.id, v.size);
      }
    });

    return {
      colors: Array.from(colorMap.values()),
      sizes: Array.from(sizeMap.values()),
    };
  }, [productVariants]);

  // Find variant by color and size
  const findVariant = (colorId: number | null, sizeId: number | null) => {
    return productVariants.find(v =>
      (colorId === null ? v.colorId === null : v.colorId === colorId) &&
      (sizeId === null ? v.sizeId === null : v.sizeId === sizeId)
    );
  };

  // Update quantity for a variant
  const updateVariantQuantity = (variantId: number, delta: number) => {
    setVariantQuantities(prev => {
      const current = prev[variantId] || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        const { [variantId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [variantId]: newQty };
    });
  };

  // Set exact quantity for variant
  const setVariantQuantity = (variantId: number, quantity: number) => {
    setVariantQuantities(prev => {
      if (quantity <= 0) {
        const { [variantId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [variantId]: quantity };
    });
  };

  // Toggle input selection
  const toggleInput = (input: Input) => {
    setSelectedInputs(prev => {
      if (prev[input.id]) {
        const { [input.id]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [input.id]: {
          quantity: 1,
          unitCost: Number(input.unitCost) || 0
        }
      };
    });
  };

  // Update input quantity
  const updateInputQuantity = (inputId: number, quantity: number) => {
    setSelectedInputs(prev => ({
      ...prev,
      [inputId]: { ...prev[inputId], quantity: Math.max(1, quantity) }
    }));
  };

  // Update input cost
  const updateInputCost = (inputId: number, cost: number) => {
    setSelectedInputs(prev => ({
      ...prev,
      [inputId]: { ...prev[inputId], unitCost: cost }
    }));
  };

  // Calculate total items selected
  const totalVariantQty = Object.values(variantQuantities).reduce((a, b) => a + b, 0);
  const totalInputQty = Object.values(selectedInputs).reduce((a, b) => a + b.quantity, 0);

  // Add selected items
  const handleAddItems = () => {
    const items: PurchaseItem[] = [];

    // Add variant items
    Object.entries(variantQuantities).forEach(([variantId, quantity]) => {
      const variant = productVariants.find(v => v.id === Number(variantId));
      if (variant && quantity > 0) {
        const colorName = variant.color?.name || '';
        const sizeName = variant.size?.abbreviation || variant.size?.name || '';
        const variantInfo = [colorName, sizeName].filter(Boolean).join(' - ');

        items.push({
          type: 'variant',
          variantId: variant.id,
          productName: variant.product.name,
          variantInfo: variantInfo || undefined,
          sku: variant.sku,
          quantity,
          unitCost,
        });
      }
    });

    // Add input items
    Object.entries(selectedInputs).forEach(([inputId, data]) => {
      const input = inputs.find(i => i.id === Number(inputId));
      if (input) {
        items.push({
          type: 'input',
          inputId: input.id,
          productName: input.name,
          sku: input.code,
          quantity: data.quantity,
          unitCost: data.unitCost,
        });
      }
    });

    if (items.length > 0) {
      onItemsSelected(items);
    }
  };

  // Check if product has variants (colors or sizes)
  const hasVariants = colors.length > 0 || sizes.length > 0;

  return (
    <div className="flex flex-col h-[600px]">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => { setActiveTab('products'); setSelectedProduct(null); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 -mb-px ${
            activeTab === 'products'
              ? 'text-orange-600 border-orange-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Package className="w-4 h-4" />
          Productos
        </button>
        <button
          onClick={() => { setActiveTab('inputs'); setSelectedProduct(null); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 -mb-px ${
            activeTab === 'inputs'
              ? 'text-orange-600 border-orange-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Insumos
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={`Buscar ${activeTab === 'products' ? 'productos' : 'insumos'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'products' ? (
          selectedProduct ? (
            /* Matrix View for Product */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div>
                    <p className="font-medium">{selectedProduct.name}</p>
                    <p className="text-sm text-gray-500">Selecciona cantidades por variante</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Costo unitario:</label>
                  <input
                    type="number"
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    min="0"
                  />
                </div>
              </div>

              {hasVariants ? (
                /* Color x Size Matrix */
                <div className="overflow-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-sm font-medium text-gray-600 border-b bg-gray-50 sticky left-0">
                          {colors.length > 0 ? 'Color' : ''}
                        </th>
                        {sizes.length > 0 ? (
                          sizes.map(size => (
                            <th key={size.id} className="p-2 text-center text-sm font-medium text-gray-600 border-b bg-gray-50 min-w-[80px]">
                              {size.abbreviation || size.name}
                            </th>
                          ))
                        ) : (
                          <th className="p-2 text-center text-sm font-medium text-gray-600 border-b bg-gray-50 min-w-[100px]">
                            Cantidad
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(colors.length > 0 ? colors : [null]).map((color, colorIndex) => (
                        <tr key={color?.id ?? 'no-color'} className={colorIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-2 border-b sticky left-0 bg-inherit">
                            {color && (
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"
                                  style={{ backgroundColor: color.hexCode }}
                                />
                                <span className="text-sm">{color.name}</span>
                              </div>
                            )}
                          </td>
                          {(sizes.length > 0 ? sizes : [null]).map((size) => {
                            const variant = findVariant(color?.id ?? null, size?.id ?? null);
                            const quantity = variant ? (variantQuantities[variant.id] || 0) : 0;

                            if (!variant) {
                              return (
                                <td key={size?.id ?? 'no-size'} className="p-2 border-b text-center">
                                  <span className="text-gray-300">—</span>
                                </td>
                              );
                            }

                            return (
                              <td key={size?.id ?? 'no-size'} className="p-2 border-b">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => updateVariantQuantity(variant.id, -1)}
                                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                                    disabled={quantity === 0}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <input
                                    type="number"
                                    value={quantity || ''}
                                    onChange={(e) => setVariantQuantity(variant.id, Number(e.target.value))}
                                    className={`w-12 px-1 py-0.5 text-center border rounded text-sm ${
                                      quantity > 0 ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                                    }`}
                                    min="0"
                                    placeholder="0"
                                  />
                                  <button
                                    onClick={() => updateVariantQuantity(variant.id, 1)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Single variant (no colors/sizes) */
                <div className="p-4 bg-gray-50 rounded-lg">
                  {productVariants.length > 0 ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cantidad a comprar:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateVariantQuantity(productVariants[0].id, -1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={variantQuantities[productVariants[0].id] || ''}
                          onChange={(e) => setVariantQuantity(productVariants[0].id, Number(e.target.value))}
                          className="w-20 px-2 py-1 text-center border border-gray-300 rounded"
                          min="0"
                          placeholder="0"
                        />
                        <button
                          onClick={() => updateVariantQuantity(productVariants[0].id, 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">Este producto no tiene variantes disponibles</p>
                  )}
                </div>
              )}

              {totalVariantQty > 0 && (
                <div className="bg-orange-50 p-3 rounded-lg flex items-center justify-between">
                  <span className="font-medium text-orange-800">
                    {totalVariantQty} unidades seleccionadas
                  </span>
                  <span className="font-bold text-orange-800">
                    Subtotal: ${(totalVariantQty * unitCost).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Product List */
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Buscando...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No se encontraron productos' : 'Busca un producto para comenzar'}
                </div>
              ) : (
                products.map(product => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-orange-300 transition-colors text-left"
                  >
                    {product.images?.front && (
                      <img
                        src={product.images.front}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {product.sku && <span className="mr-2">{product.sku}</span>}
                        <span className="text-orange-600">${product.basePrice.toLocaleString()}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">
                        {product.colors?.length || 0} colores · {(product.sizes as any[])?.length || 0} tallas
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )
        ) : (
          /* Inputs List */
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Buscando...</div>
            ) : inputs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No se encontraron insumos' : 'Busca un insumo para comenzar'}
              </div>
            ) : (
              inputs.map(input => {
                const isSelected = !!selectedInputs[input.id];
                return (
                  <div
                    key={input.id}
                    className={`p-3 border rounded-lg transition-colors ${
                      isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleInput(input)}
                        className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <span className="text-xs">✓</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{input.name}</p>
                        <p className="text-sm text-gray-500">
                          {input.code} · {input.unitOfMeasure}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <label className="text-xs text-gray-500">Cant:</label>
                            <input
                              type="number"
                              value={selectedInputs[input.id].quantity}
                              onChange={(e) => updateInputQuantity(input.id, Number(e.target.value))}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                              min="1"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <label className="text-xs text-gray-500">Costo:</label>
                            <input
                              type="number"
                              value={selectedInputs[input.id].unitCost}
                              onChange={(e) => updateInputCost(input.id, Number(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              min="0"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {totalInputQty > 0 && (
              <div className="bg-orange-50 p-3 rounded-lg flex items-center justify-between mt-4">
                <span className="font-medium text-orange-800">
                  {Object.keys(selectedInputs).length} insumos · {totalInputQty} unidades
                </span>
                <span className="font-bold text-orange-800">
                  Subtotal: ${Object.values(selectedInputs).reduce((sum, s) => sum + s.quantity * s.unitCost, 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {totalVariantQty + totalInputQty > 0
            ? `${totalVariantQty + totalInputQty} items seleccionados`
            : 'Selecciona items para agregar'
          }
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddItems}
            disabled={totalVariantQty + totalInputQty === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Items
          </Button>
        </div>
      </div>
    </div>
  );
}
