import api from '../api/axios';
import type { Appointment } from '../types';

export const AppointmentsService = {
    create: async (data: Partial<Appointment>): Promise<Appointment> => {
        const response = await api.post<Appointment>('/appointments', data);
        return response.data;
    },

    getAll: async (params?: { startDate?: string; endDate?: string; date?: string; month?: number; year?: number }): Promise<Appointment[]> => {
        const response = await api.get<Appointment[]>('/appointments', { params });
        return response.data;
    },

    update: async (id: string, data: Partial<Appointment>): Promise<Appointment> => {
        const response = await api.patch<Appointment>(`/appointments/${id}`, data);
        return response.data;
    }
};
