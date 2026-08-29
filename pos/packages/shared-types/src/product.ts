import { GSTRate, ProductStatus } from "./enums";

export interface Category {
  id: string;
  name: string;
  code?: string;
  description?: string;
  parentId?: string;
  defaultGstRate?: GSTRate;
  defaultHsnCode?: string;
  color?: string;
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
  hsnCode?: string;
  mrp?: number;
  categoryId: string;
  brandId?: string;
  supplierId?: string;
  supplierName?: string;
  description?: string;
  imageUrl?: string;
  purchasePrice: number;
  sellingPrice: number;
  gstRate: GSTRate;
  discountPercent: number;
  stockQuantity: number;
  reorderLevel: number;
  unit: string;
  secondaryUnit?: string;
  conversionRatio?: number;
  batchNumber?: string;
  expiryDate?: string;
  rackLocation?: string;
  isTaxInclusive?: boolean;
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
  hsnCode?: string;
  mrp?: number;
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
  supplierName?: string;
}
