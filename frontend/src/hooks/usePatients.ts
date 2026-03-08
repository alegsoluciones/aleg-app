import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext'; // 👈 Importamos el contexto
import type { Patient } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function usePatients() {
    const { user } = useAuth(); // 👈 Accedemos al usuario en tiempo real
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // 👇 FUNCIONES INTELIGENTES: Priorizan la info del usuario en memoria
    const getTenantSlug = () => {
        if (user?.tenant?.slug) return user.tenant.slug;
        return localStorage.getItem('currentTenantSlug'); // Fallback
    };

    const getTenantId = () => {
        if (user?.tenant?.id) return user.tenant.id.toString();
        // Si el usuario tiene tenantId directo en la raíz (depende de tu modelo)
        if (user?.tenantId) return user.tenantId.toString(); 
        return localStorage.getItem('currentTenantId'); // Fallback
    };

    const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
        const tenantSlug = getTenantSlug();
        const tenantId = getTenantId();

        if (!tenantSlug || !tenantId) {
            console.warn("⛔ Faltan datos de sesión (Tenant).");
            throw new Error("Missing Tenant Data");
        }

        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${API_URL}${endpoint}${separator}tenant=${tenantSlug}`;
        
        const headers: any = { 
            'x-tenant-slug': tenantSlug,
            'x-tenant-id': tenantId,
            'Authorization': `Bearer ${localStorage.getItem('token')}`, 
            ...options.headers 
        };

        if (options.body && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        if (options.body instanceof FormData) delete headers['Content-Type'];

        const res = await fetch(url, { ...options, headers });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || `Error ${res.status}`);
        }
        return res;
    };

    const fetchPatients = useCallback(async () => {
        // Validamos usando los datos en memoria
        const tenantSlug = user?.tenant?.slug || localStorage.getItem('currentTenantSlug');
        
        if (!tenantSlug) {
            // Si no hay usuario cargado aún, esperamos sin dar error
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await apiFetch('/patients');
            const rawData = await res.json();
            let finalData: Patient[] = [];
            if (Array.isArray(rawData)) finalData = rawData;
            else if (rawData && Array.isArray(rawData.data)) finalData = rawData.data;
            setPatients(finalData);
        } catch (err) { 
            console.error("🔥 Error cargando pacientes:", err); 
            setPatients([]);
        } finally { 
            setLoading(false); 
        }
    }, [user]); // 👈 CLAVE: Se ejecuta cada vez que el usuario cambia (Login/Logout)

    // Ejecutar fetch cuando cambia el fetchPatients (que depende del user)
    useEffect(() => { fetchPatients(); }, [fetchPatients]);

    const createPatient = async (data: any) => {
        try {
            const res = await apiFetch('/patients', { method: 'POST', body: JSON.stringify(data) });
            const newPatient = await res.json();
            await fetchPatients();
            return newPatient;
        } catch (e) {
            console.error("Error creating patient:", e);
            return null;
        }
    };

    const createRecord = async (patientId: string, data: any) => {
        try {
            const res = await apiFetch(`/patients/${patientId}/records`, { 
                method: 'POST', 
                body: JSON.stringify(data) 
            });
            const newRecord = await res.json(); 
            await fetchPatients(); 
            return newRecord; 
        } catch (e) {
            throw e;
        }
    };

    const updatePatient = async (id: string, data: Partial<Patient>) => {
        try {
            await apiFetch(`/patients/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
            await fetchPatients();
            return true;
        } catch (e) { return false; }
    };

    const revertStatus = async (id: string) => {
        try {
            await apiFetch(`/patients/${id}/revert-status`, { method: 'POST' });
            await fetchPatients();
            return true;
        } catch (e) { return false; }
    };

    const deletePatient = async (id: string) => {
        try {
            await apiFetch(`/patients/${id}`, { method: 'DELETE' });
            await fetchPatients();
            return true;
        } catch(e) { return false; }
    };

    const deletePatientsBulk = async (ids: string[]) => {
        try {
            await apiFetch(`/patients/bulk-delete`, { method: 'POST', body: JSON.stringify({ ids }) });
            await fetchPatients();
            return true;
        } catch(e) { return false; }
    };

    const updateRecord = async (recordId: string, data: any) => {
        try {
            await apiFetch(`/patients/records/${recordId}`, { method: 'PATCH', body: JSON.stringify(data) });
            await fetchPatients();
            return true;
        } catch (e) { return false; }
    };

    const deleteRecord = async (recordId: string) => {
        try {
            await apiFetch(`/patients/records/${recordId}`, { method: 'DELETE' });
            await fetchPatients();
            return true;
        } catch (e) { return false; }
    };

    const uploadPhotos = async (recordId: string, files: FileList) => {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) formData.append('files', files[i]);
        try {
            await apiFetch(`/patients/records/${recordId}/photos`, { method: 'POST', body: formData });
            await fetchPatients();
            return true;
        } catch (e) { return false; }
    };

    const deletePhoto = async (recordId: string, photoUrl: string) => {
        try {
            await apiFetch(`/patients/records/${recordId}/photos`, { method: 'DELETE', body: JSON.stringify({ photoUrl }) });
            await fetchPatients();
            return true;
        } catch (e) { return false; }
    };

    const deletePhotosBulk = async (recordId: string, photoUrls: string[]) => {
        try {
            for (const url of photoUrls) {
                await apiFetch(`/patients/records/${recordId}/photos`, { method: 'DELETE', body: JSON.stringify({ photoUrl: url }) });
            }
            await fetchPatients();
            return true;
        } catch (e) { return false; }
    };

    const importExcels = async (files: FileList) => {
        setIsProcessing(true);
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) formData.append('files', files[i]);
        try {
            const res = await apiFetch(`/migration/import`, { method: 'POST', body: formData });
            const result = await res.json();
            alert(`✅ Importación completada.\nProcesados: ${result.count || result.processed}`);
            await fetchPatients();
        } catch(e: any) { alert(`❌ Error: ${e.message}`); } finally { setIsProcessing(false); }
    };

    const markReady = async (id: string) => { setIsProcessing(true); try { await apiFetch(`/migration/mark-ready/${id}`, { method: 'POST' }); await fetchPatients(); } catch(e) { alert('Error'); } finally { setIsProcessing(false); } };
    const markReadyBatch = async (ids: string[]) => { setIsProcessing(true); try { await apiFetch(`/migration/mark-ready-batch`, { method: 'POST', body: JSON.stringify({ ids }) }); await fetchPatients(); } catch(e) { alert('Error'); } finally { setIsProcessing(false); } };
    const finalizeBatch = async () => { setIsProcessing(true); try { await apiFetch(`/migration/finalize-batch`, { method: 'POST' }); await fetchPatients(); return true; } catch(e) { alert('Error'); } finally { setIsProcessing(false); } };

    return { 
        patients, loading, isProcessing, API_URL, 
        createPatient, updatePatient, deletePatient, deletePatientsBulk, revertStatus,
        createRecord, updateRecord, deleteRecord, 
        uploadPhotos, deletePhoto, deletePhotosBulk,
        importExcels, markReady, markReadyBatch, finalizeBatch 
    };
}