import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para agregar Token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // 4. Agregar Tenant Slug para Super Admins (Masquerading)
    const currentTenantSlug = localStorage.getItem('currentTenantSlug');
    console.log(`[Axios] Request to ${config.url}. Token: ${!!token}, TenantSlug: ${currentTenantSlug}`);

    if (currentTenantSlug && config.headers) {
        config.headers['x-tenant-slug'] = currentTenantSlug;
    }

    return config;
}, (error: AxiosError) => {
    return Promise.reject(error);
});

// Interceptor para manejar 401 (Logout)
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Token vencido o inválido
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirigir a login si es necesario, o dejar que AuthContext maneje el estado
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
