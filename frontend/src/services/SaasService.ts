import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface IndustryTemplate {
    id: string;
    type: 'CLINICAL' | 'VET' | 'CRAFT' | 'EVENTS';
    name: string;
    defaultModules: string[];
    defaultSettings: Record<string, any>;
    defaultLayout?: any[]; // Added for Phase 5.3
    createdAt: string;
    updatedAt: string;
}

export const SaasService = {
    getIndustries: async (): Promise<IndustryTemplate[]> => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/saas/industries`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    createIndustry: async (data: Partial<IndustryTemplate>): Promise<IndustryTemplate> => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/saas/industries`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    updateIndustry: async (type: string, data: Partial<IndustryTemplate>): Promise<IndustryTemplate> => {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${API_URL}/saas/industries/${type}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    updateLayout: async (layout: any[]): Promise<void> => {
        const token = localStorage.getItem('token');
        await axios.patch(`${API_URL}/tenants/me/layout`, { dashboardLayout: layout }, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
};
