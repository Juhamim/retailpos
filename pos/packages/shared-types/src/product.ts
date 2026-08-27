import { GSTRate, ProductStatus } from "./enums";

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  brandId?: string;
  description?: string;
  imageUrl?: string;
  purchasePrice: number;
  sellingPrice: number;
  gstRate: GSTRate;
  discountPercent: number;
  stockQuantity: number;
  reorderLevel: number;
  unit: string;
  status: ProductStatus;
  isWeighable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithCategory extends Product {
  categoryName: string;
  brandName?: string;
}
