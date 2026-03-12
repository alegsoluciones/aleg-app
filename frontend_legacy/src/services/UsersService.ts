import api from '../api/axios';
import type { User } from '../types';

export const UsersService = {
    findAllByRole: async (role: string): Promise<User[]> => {
        const response = await api.get<User[]>(`/users?role=${role}`);
        return response.data;
    },

    findAll: async (): Promise<User[]> => {
        const response = await api.get<User[]>('/users');
        return response.data;
    }
};
