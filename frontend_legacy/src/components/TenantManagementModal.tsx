import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Zap, Loader2, ShieldCheck, Box, Check } from 'lucide-react';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    active_modules?: string[];
}

interface MarketplaceModule {
    code: string;
    name: string;
    description: string;
    price: number;
}

interface TenantManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenant: Tenant | null;
    onUpdate?: () => void;
}

export const TenantManagementModal = ({ isOpen, onClose, tenant, onUpdate }: TenantManagementModalProps) => {
    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const [modules, setModules] = useState<MarketplaceModule[]>([]);
    const [activeModules, setActiveModules] = useState<string[]>([]);
    const [loadingCatalog, setLoadingCatalog] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    // Fetch Catalog
    useEffect(() => {
        if (!isOpen) return;
        const fetchModules = async () => {
            try {
                // Using current user's token (Super Admin)
                // Note: We use any valid tenant slug for the fetch, or just the subject tenant's slug
                const res = await fetch(`${API_URL}/marketplace/admin/modules`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-tenant-slug': tenant?.slug || ''
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setModules(Array.isArray(data) ? data : data.data || []);
                }
            } catch (e) { console.error(e); } finally { setLoadingCatalog(false); }
        };
        fetchModules();
    }, [isOpen]);

    // Initialize Active Modules & Safety Reset
    useEffect(() => {
        if (tenant) {
            // Force reset of active modules when tenant switches
            setActiveModules(tenant.active_modules || []);
        } else {
            setActiveModules([]);
        }
    }, [tenant, isOpen]); // Depend on isOpen to ensure fresh paint on reopen

    const handleToggle = async (code: string, currentStatus: boolean) => {
        if (code === 'core-std') return; // 🛡️ CORE PROTECTION
        if (!tenant?.slug) {
            alert('Error: No se identificó el slug del Tenant objetivo.');
            return;
        }

        setProcessing(code);
        const action = !currentStatus ? 'subscribe' : 'unsubscribe';
        const url = `${API_URL}/marketplace/${action}/${code}`;

        try {
            // CRITICAL: Send context of the TARGET tenant via Header
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-tenant-slug': tenant.slug
                }
            });

            if (res.ok) {
                // Optimistic Update
                if (!currentStatus) {
                    setActiveModules(prev => [...prev, code]);
                } else {
                    setActiveModules(prev => prev.filter(m => m !== code));
                }
                if (onUpdate) onUpdate(); // Trigger parent refresh if needed
            } else {
                const text = await res.text();
                console.error("Backend Error:", text);
                alert(`Error del Servidor: ${text}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión con el servidor');
        } finally {
            setProcessing(null);
        }
    };

    if (!isOpen || !tenant) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Zap className="text-blue-600" size={24} /> Gestión de Módulos
                        </h2>
                        <p className="text-sm text-slate-500">Configurando: <span className="font-bold text-slate-700">{tenant.name}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {loadingCatalog ? (
                        <div className="flex justify-center p-8 text-slate-400"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="grid gap-3">
                            {modules.map(mod => {
                                const isActive = activeModules.includes(mod.code);
                                const isCore = mod.code === 'core-std';
                                const isBusy = processing === mod.code;

                                return (
                                    <div key={mod.code} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isActive ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-80'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-lg ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                                {/* Simple Icon Logic */}
                                                <Box size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                    {mod.name}
                                                    {isCore && <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded border border-amber-200 font-mono">CORE</span>}
                                                </h4>
                                                <p className="text-xs text-slate-500 line-clamp-1">{mod.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {isActive && !isCore && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 flex items-center gap-1"><Check size={10} /> ACTIVO</span>}

                                            <button
                                                onClick={() => handleToggle(mod.code, isActive)}
                                                disabled={isCore || isBusy}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isActive ? 'bg-blue-600' : 'bg-slate-300'} ${isCore ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                                <span className={`${isActive ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={14} /> Acceso Seguro de Super Admin
                    </div>
                    <button onClick={onClose} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors">
                        Cerrar Panel
                    </button>
                </div>
            </div>
        </div>
    );
};
