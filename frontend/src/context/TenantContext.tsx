import React, { createContext, useContext, useEffect, useState } from 'react';
import type { TenantConfig } from '../types/config';
import { useAuth } from './AuthContext';

interface TenantContextProps {
    config: TenantConfig | null;
    loading: boolean;
    error: string | null;
    refreshConfig: () => Promise<void>;
}

const TenantContext = createContext<TenantContextProps | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading: authLoading } = useAuth();
    const [config, setConfig] = useState<TenantConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConfig = async () => {
        // Bloquear fetch si Auth aún está cargando (evita race conditions)
        if (authLoading) return;

        try {
            setLoading(true);

            // 1. Prioridad: Tenant explícito en LocalStorage (SÓLO PARA SUPER ADMIN)
            const storedSlug = localStorage.getItem('currentTenantSlug');

            // 2. Prioridad: Usuario Logueado (Contexto Reactivo)
            let userSlug = null;
            let isSuperAdmin = false;

            if (user) {
                userSlug = user.tenant?.slug;
                isSuperAdmin = user.role === 'SUPER_ADMIN';
            }

            // 3. Fallback: Configuración de Desarrollo
            const devTenant = null;

            // DECISIÓN FINAL:
            // Si es Super Admin, permitimos override por storedSlug.
            // Si es usuario normal, IGNORAMOS storedSlug y forzamos userSlug.
            let slug;
            if (isSuperAdmin && storedSlug) {
                slug = storedSlug;
            } else if (userSlug) {
                slug = userSlug;
            } else {
                slug = devTenant;
            }

            if (!slug) {
                setConfig(null); // Guest State
                setLoading(false);
                return;
            }


            const response = await fetch('http://localhost:3000/tenants/config', {
                headers: {
                    'x-tenant-slug': slug,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // Si el tenant no existe, volvemos a modo Guest
                console.warn(`⚠️ Tenant [${slug}] not found, reverting to Guest.`);
                setConfig(null);
            } else {
                const data = await response.json();
                setConfig(data);
            }

        } catch (err: any) {
            console.error(err);
            // En caso de error de red, permitimos entrar como Guest (o mostramos error en UI)
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Reactivity: Re-fetch when USER changes (Login/Logout)
    useEffect(() => {
        if (!authLoading) {
            fetchConfig();
        }
    }, [user, authLoading]); // <--- Clave de la Reactividad

    // 🔍 OPTIMIZATION: Removed Focus Handler to prevent UI Refresh/State Loss on Tab Switch.
    // The app will only fetch config on Mount or Auth Change.
    /* 
    useEffect(() => {
        const handleFocus = () => {
            if (!authLoading) fetchConfig();
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [authLoading]); 
    */

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium pb-20 flex-col gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-xs uppercase tracking-widest opacity-50">Cargando Plataforma...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen flex items-center justify-center text-red-500">
                Error Crítico: {error}
            </div>
        );
    }

    return (
        <TenantContext.Provider value={{ config, loading, error, refreshConfig: fetchConfig }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenantConfig = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenantConfig must be used within a TenantProvider');
    }
    return context;
};
