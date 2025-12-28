import api from './api.service';

export interface TemplateRecipe {
  id: number;
  variantId: number;
  inputVariantId: number;
  quantity: number;
  variant: {
    id: number;
    sku: string;
    color: {
      id: number;
      name: string;
      slug: string;
      hexCode: string;
    } | null;
    size: {
      id: number;
      name: string;
      abbreviation: string;
    } | null;
    product: {
      id: number;
      name: string;
      sku: string;
    };
  };
  inputVariant: {
    id: number;
    sku: string;
    currentStock: number;
    unitCost: number;
    color: {
      id: number;
      name: string;
      slug: string;
      hexCode: string;
    } | null;
    size: {
      id: number;
      name: string;
      abbreviation: string;
    } | null;
    input: {
      id: number;
      code: string;
      name: string;
      unitOfMeasure: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariantStock {
  variantId: number;
  sku: string;
  color: string;
  size: string;
  recipe: {
    inputName: string;
    inputColor: string;
    inputSize: string;
    inputStock: number;
    quantity: number;
  } | null;
  availableStock: number;
}

export interface CreateTemplateRecipeInput {
  variantId: number;
  inputVariantId: number;
  quantity?: number;
}

class TemplateRecipesService {
  private baseUrl = '/template-recipes';

  /**
   * Crear o actualizar receta para una variante de template
   */
  async createRecipe(data: CreateTemplateRecipeInput): Promise<TemplateRecipe> {
    const response = await api.post<TemplateRecipe>(this.baseUrl, data);
    return response.data;
  }

  /**
   * Obtener receta de una variante específica
   */
  async getRecipe(variantId: number): Promise<TemplateRecipe | null> {
    try {
      const response = await api.get<TemplateRecipe>(`${this.baseUrl}/variant/${variantId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Obtener todas las recetas de un template
   */
  async getRecipesByProduct(productId: number): Promise<TemplateRecipe[]> {
    const response = await api.get<TemplateRecipe[]>(`${this.baseUrl}/product/${productId}`);
    return response.data;
  }

  /**
   * Obtener stock disponible para todas las variantes de un template
   */
  async getAvailableStock(productId: number): Promise<TemplateVariantStock[]> {
    const response = await api.get<TemplateVariantStock[]>(`${this.baseUrl}/product/${productId}/stock`);
    return response.data;
  }

  /**
   * Eliminar receta de una variante
   */
  async deleteRecipe(variantId: number): Promise<void> {
    await api.delete(`${this.baseUrl}/variant/${variantId}`);
  }

  /**
   * Asociar insumos a un template
   */
  async associateInputs(productId: number, inputIds: number[]): Promise<{ created: number; templateVariants: number }> {
    const response = await api.post<{ created: number; templateVariants: number }>(`${this.baseUrl}/product/${productId}/associate`, { inputIds });
    return response as any;
  }

  /**
   * Obtener IDs de insumos asociados a un template
   */
  async getAssociatedInputIds(productId: number): Promise<number[]> {
    const response = await api.get<{ inputIds: number[] }>(`${this.baseUrl}/product/${productId}/inputs`);
    return (response as any).inputIds;
  }
}

export const templateRecipesService = new TemplateRecipesService();
