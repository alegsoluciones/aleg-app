import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

export interface TenantInfo {
    id: number;
    name: string;
    slug: string;
    logoUrl?: string; // <--- Agregado para que Sidebar no falle
    modules?: string[]; // <--- Módulos activos del tenant
}

import type { User } from '../types';

export interface TenantInfo {
    id: number;
    name: string;
    slug: string;
    logoUrl?: string;
    modules?: string[];
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                try {
                    const decoded: any = jwtDecode(storedToken);
                    if (decoded.exp < Date.now() / 1000) {
                        logout();
                    } else {
                        setToken(storedToken);
                        setUser(JSON.parse(storedUser));
                    }
                } catch (error) {
                    logout();
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email: string, pass: string) => {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: pass }),
            });
            const data = await res.json();

            if (!res.ok) return { success: false, message: data.message };

            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // 🟢 CRITICAL FIX: Persist Tenant Context for non-Super Admins
            if (data.user?.tenant?.slug) {
                localStorage.setItem('currentTenantSlug', data.user.tenant.slug);
                if (data.user.tenant.id) localStorage.setItem('currentTenantId', data.user.tenant.id);
            }

            setToken(data.access_token);
            setUser(data.user);
            return { success: true };
        } catch (error) {
            return { success: false, message: 'Error de conexión' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('currentTenantSlug'); // 👈 Limpiar contexto de tenant al salir
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
    return context;
};