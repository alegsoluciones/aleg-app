import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Plan {
    id: string;
    name: string;
    slug: string;
    price: string;
    currency: string;
    billingCycle: 'MONTHLY' | 'YEARLY';
    features: string[];
    isActive: boolean;
    rubric?: string; // Phase 5.2/5.3 Addition
}

export const PlansService = {
    getAll: async (): Promise<Plan[]> => {
        const response = await axios.get(`${API_URL}/saas/plans`);
        return response.data;
    },

    getAllAdmin: async (): Promise<Plan[]> => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/saas/plans/admin`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    create: async (data: Partial<Plan>): Promise<Plan> => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/saas/plans`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    update: async (id: string, data: Partial<Plan>): Promise<Plan> => {
        const token = localStorage.getItem('token');
        const response = await axios.patch(`${API_URL}/saas/plans/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/saas/plans/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
};
