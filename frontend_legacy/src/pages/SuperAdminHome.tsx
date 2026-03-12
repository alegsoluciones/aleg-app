import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { Modal } from '../components/Modal';
import {
    Server, Users, DollarSign, Activity, HardDrive, RefreshCw,
    Trash2, Upload, UserCheck, ShieldAlert, Plus, Building
} from 'lucide-react';
import type { Tenant } from '../types';

interface AuditLog {
    id: number;
    action: string;
    userEmail: string;
    level: string;
    timestamp: string;
    details?: any;
}

export const SuperAdminHome = () => {
    const { token, user } = useAuth(); // 👈 Get user for tenant slug
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // State
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [tenants, setTenants] = useState<Tenant[]>([]);

    // Form State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTenant, setNewTenant] = useState({
        name: '',
        slug: '',
        adminEmail: '',
        industry: 'CLINICAL'
    });
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        try {
            const res = await fetch(`${API_URL}/audit?limit=20`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-slug': user?.tenant?.slug || ''
                }
            });
            if (res.ok) setLogs(await res.json());
        } catch (error) { console.error("Error logs", error); }
    };

    const fetchTenants = async () => {
        try {
            const res = await fetch(`${API_URL}/tenants`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-slug': user?.tenant?.slug || ''
                }
            });
            if (res.ok) setTenants(await res.json());
        } catch (error) { console.error("Error tenants", error); }
    };

    useEffect(() => {
        if (!user?.tenant?.slug) return; // Wait for user data
        fetchLogs();
        fetchTenants();
        const interval = setInterval(() => { fetchLogs(); fetchTenants(); }, 5000);
        return () => clearInterval(interval);
    }, [user]); // Depend on user

    const handleCreateTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/tenants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-slug': user?.tenant?.slug || ''
                },
                body: JSON.stringify(newTenant)
            });

            if (!res.ok) throw new Error('Error al crear tenant');

            alert(`✅ Clínica ${newTenant.name} creada exitosamente. Admin: ${newTenant.adminEmail}`);
            setIsCreateModalOpen(false);
            setNewTenant({ name: '', slug: '', adminEmail: '', industry: 'CLINICAL' });
            fetchTenants(); // Refresh list
        } catch (error) {
            alert('❌ Error al crear clínica. Revise consola.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Helper functions (keep existing logic)
    const formatTime = (iso: string) => new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const translateLog = (actionString: string) => {
        if (!actionString) return { text: 'Desconocido', icon: <Activity size={14} />, bg: 'bg-slate-100 text-slate-500' };
        const parts = actionString.split(' ');
        const method = parts[0] || 'UNKNOWN';
        const url = parts[1] || '';
        if (url.includes('/photos')) {
            if (method === 'POST') return { text: 'Subió Evidencia', icon: <Upload size={14} className="text-blue-400" />, bg: 'bg-blue-500/10 text-blue-400' };
            if (method === 'DELETE') return { text: 'Eliminó Evidencia', icon: <Trash2 size={14} className="text-red-400" />, bg: 'bg-red-500/10 text-red-400' };
        }
        if (url.includes('/patients')) {
            if (method === 'POST') return { text: 'Creó Paciente', icon: <UserCheck size={14} className="text-emerald-400" />, bg: 'bg-emerald-500/10 text-emerald-400' };
        }
        if (url.includes('/tenants') && method === 'POST') return { text: 'SaaS Genesis', icon: <Building size={14} className="text-purple-400" />, bg: 'bg-purple-500/10 text-purple-400' };
        return { text: `${method} Sistema`, icon: <Server size={14} className="text-slate-500" />, bg: 'bg-slate-800 text-slate-400' };
    };

    return (
        <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto overflow-x-hidden font-sans">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Panel Global ALEG MEDIC</h1>
                    <p className="text-slate-500 text-sm">Administración SaaS & Monitoreo</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg shadow-blue-500/30 transition">
                    <Plus size={18} /> Nueva Clínica
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="MRR (Mensual)" value="$ 12,450" icon={<DollarSign size={24} />} trend="+12%" trendUp={true} color="emerald" />
                <StatCard title="Clínicas Activas" value={tenants.length.toString()} icon={<Users size={24} />} color="blue" />
                <StatCard title="Estado del Sistema" value="99.9%" icon={<Activity size={24} />} color="indigo" />
                <StatCard title="Estado del Sistema" value="99.9%" icon={<Activity size={24} />} color="indigo" />
                <StatCard title="Almacenamiento" value="45 GB" icon={<HardDrive size={24} />} color="amber" />

                {/* ACCESOS RÁPIDOS SAAS */}
                <div onClick={() => window.location.href = '/admin/plans'} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-300 transition group">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400">CONFIG</span>
                    </div>
                    <h3 className="font-bold text-slate-800">Motor de Precios</h3>
                    <p className="text-xs text-slate-500 mt-1">Gestión de Planes y Suscripciones</p>
                </div>

                <div className="space-y-8">
                    {/* TENANTS LIST */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Building size={18} className="text-blue-500" /> Gestión de Clínicas (Tenants)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Empresa / Slug</th>
                                        <th className="px-4 py-3">Industria</th>
                                        <th className="px-4 py-3">Estado</th>
                                        <th className="px-4 py-3">Config</th>
                                        <th className="px-4 py-3 rounded-r-lg">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-600">
                                    {tenants.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-4 text-slate-400">No hay clínicas registradas</td></tr>
                                    ) : tenants.map(t => (
                                        <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-slate-800">{t.name}</div>
                                                <div className="text-xs text-slate-400 font-mono">/{t.slug}</div>
                                            </td>
                                            <td className="px-4 py-3"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">{t.config?.industry || 'N/A'}</span></td>
                                            <td className="px-4 py-3">
                                                <span className={`flex items-center gap-1 font-bold text-xs ${t.status === 'ACTIVE' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    ● {t.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-mono text-slate-400 max-w-[150px] truncate">
                                                {JSON.stringify(t.config)}
                                            </td>
                                            <td className="px-4 py-3 text-blue-600 cursor-pointer hover:underline">Gestionar</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* AUDIT LOGS (Reduced height) */}
                    <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col h-[400px]">
                        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg"><ShieldAlert className="text-emerald-400" size={20} /></div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">Auditoría del Sistema</h3>
                                    <p className="text-slate-500 text-xs">Monitoreo en tiempo real</p>
                                </div>
                            </div>
                            <button onClick={fetchLogs} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition flex items-center gap-2 text-xs font-medium border border-slate-800"><RefreshCw size={14} /> Actualizar</button>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 p-2 space-y-1 bg-slate-900">
                            {logs.map((log) => {
                                const info = translateLog(log.action);
                                return (
                                    <div key={log.id} onClick={() => setSelectedLog(log)} className="grid grid-cols-12 items-center px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors border-l-2 border-transparent hover:border-blue-500 group cursor-pointer">
                                        <div className="col-span-2 text-slate-400 font-mono text-xs">{formatTime(log.timestamp)}</div>
                                        <div className="col-span-3 flex items-center gap-2 overflow-hidden pr-4">
                                            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0 uppercase">{log.userEmail.charAt(0)}</div>
                                            <span className="text-slate-300 text-xs truncate font-medium">{log.userEmail}</span>
                                        </div>
                                        <div className="col-span-5"><span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium border border-transparent ${info.bg}`}>{info.icon}{info.text}</span></div>
                                        <div className="col-span-2 text-right"><span className="text-slate-500">Ver</span></div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* CREATE TENANT MODAL */}
                <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Nueva Clínica (SaaS Genesis)">
                    <form onSubmit={handleCreateTenant} className="space-y-4">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800 text-xs mb-4">
                            ℹ️ <strong>SaaS Genesis Protocol:</strong> Se creará automáticamente un usuario administrador y una suscripción TRIAL de 30 días.
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Comercial</label>
                            <input required type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Ej: Clínica San Felipe"
                                value={newTenant.name} onChange={e => setNewTenant({ ...newTenant, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Slug (URL)</label>
                                <input required type="text" className="w-full px-3 py-2 border rounded-lg font-mono text-xs" placeholder="san-felipe"
                                    value={newTenant.slug} onChange={e => setNewTenant({ ...newTenant, slug: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Industria</label>
                                <select className="w-full px-3 py-2 border rounded-lg"
                                    value={newTenant.industry} onChange={e => setNewTenant({ ...newTenant, industry: e.target.value })}
                                >
                                    <option value="CLINICAL">Salud Humana</option>
                                    <option value="VET">Veterinaria</option>
                                    <option value="DENTAL">Odontología</option>
                                    <option value="CRAFT">Taller (Sara)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Email del Administrador</label>
                            <input required type="email" className="w-full px-3 py-2 border rounded-lg" placeholder="admin@clinica.com"
                                value={newTenant.adminEmail} onChange={e => setNewTenant({ ...newTenant, adminEmail: e.target.value })}
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold text-sm">Cancelar</button>
                            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-500/30 transition disabled:opacity-50">
                                {loading ? 'Creando...' : 'Inicializar Protocolo'}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* AUDIT DETAIL MODAL (Keep existing) */}
                <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Detalle Forense">
                    {selectedLog && (
                        <div className="space-y-4 font-sans text-slate-600">
                            <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-4">
                                <div className="p-3 bg-slate-200 rounded-full"><Users size={20} /></div>
                                <div>
                                    <h4 className="font-bold">{selectedLog.action}</h4>
                                    <p className="text-xs text-slate-500">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                            <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-[10px] overflow-auto">
                                {JSON.stringify(selectedLog.details || {}, null, 2)}
                            </pre>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
};