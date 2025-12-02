export interface Size {
  id: number;
  name: string;
  abbreviation: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Color {
  id: number;
  name: string;
  slug: string;
  hexCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductType {
  id: number;
  name: string;
  slug: string;
  description?: string;
  categoryId?: number | null;
  categorySlug?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
