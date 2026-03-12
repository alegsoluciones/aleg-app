import type { Product, CreateProductDto, ProductType } from '../types/inventory';

const API_URL = 'http://localhost:3000/inventory';

export const InventoryService = {
    async getAll(type?: ProductType): Promise<Product[]> {
        const token = localStorage.getItem('token');
        const tenantSlug = localStorage.getItem('currentTenantSlug'); // Or from context

        const url = type ? `${API_URL}?type=${type}` : API_URL;

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-tenant-slug': tenantSlug || '' // Important for multitenancy
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch inventory');
        }

        return response.json();
    },

    async search(query: string): Promise<Product[]> {
        const token = localStorage.getItem('token');
        const tenantSlug = localStorage.getItem('currentTenantSlug');

        // Note: Backend might need to implement ?search=query if not utilizing a separate search endpoint
        // For now, assuming getAll returns everything and we filter client side OR backend supports ?search
        // The user request says: GET /inventory?search={query}&isActive=true
        const url = `${API_URL}?search=${encodeURIComponent(query)}&isActive=true`;

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-tenant-slug': tenantSlug || ''
            }
        });

        if (!response.ok) {
            throw new Error('Failed to search inventory');
        }

        return response.json();
    },

    async create(data: CreateProductDto): Promise<Product> {
        const token = localStorage.getItem('token');
        const tenantSlug = localStorage.getItem('currentTenantSlug');

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-tenant-slug': tenantSlug || ''
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create product');
        }

        return response.json();
    },

    async adjustStock(id: string, quantity: number): Promise<Product> {
        const token = localStorage.getItem('token');
        const tenantSlug = localStorage.getItem('currentTenantSlug');

        const response = await fetch(`${API_URL}/${id}/stock`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-tenant-slug': tenantSlug || ''
            },
            body: JSON.stringify({ quantity })
        });

        if (!response.ok) {
            throw new Error('Failed to adjust stock');
        }

        return response.json();
    }
};
