import api from '../api/axios';
import type { Patient } from '../types';

export const PatientsService = {
  search: async (query: string): Promise<Patient[]> => {
    const response = await api.get<Patient[]>(`/patients/search?q=${query}`);
    return response.data;
  },

  create: async (data: Partial<Patient>): Promise<Patient> => {
    const response = await api.post<Patient>('/patients', data);
    return response.data;
  },

  getById: async (id: string): Promise<Patient> => {
    const response = await api.get<Patient>(`/patients/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<Patient>): Promise<Patient> => {
    const response = await api.put<Patient>(`/patients/${id}`, data);
    return response.data;
  }
};
