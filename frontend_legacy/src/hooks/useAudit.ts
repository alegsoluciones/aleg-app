import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { AuditLog } from '../utils/auditAdapter'; // 👈 explicit type import

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAudit = (limit: number = 20) => {
    const { token, user } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/audit?limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-slug': user?.tenant?.slug || ''
                }
            });

            if (!res.ok) {
                if (res.status === 403) throw new Error('Acceso denegado (Solo Admin)');
                throw new Error('Error cargando auditoría');
            }

            const data = await res.json();
            setLogs(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token, limit]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return { logs, loading, error, refresh: fetchLogs };
};
