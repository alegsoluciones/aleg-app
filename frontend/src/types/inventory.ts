export type ProductType = 'SERVICE' | 'PRODUCT';

export interface Product {
    id: string;
    tenantId: string;
    name: string;
    type: ProductType;
    price: number;
    cost?: number; // Optional on frontend
    stock?: number | null;
    sku?: string;
    minStock?: number;
    isActive: boolean;
    createdAt?: string;
}

export interface CreateProductDto {
    name: string;
    type: ProductType;
    price: number;
    cost?: number;
    stock?: number;
    sku?: string;
    minStock?: number;
    isActive?: boolean;
}
