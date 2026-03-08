import { useEffect, useState, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Plus, Search, MoreVertical, Loader2, CheckCircle, Save, Upload, FileSpreadsheet, LayoutDashboard, Zap, Activity, Dog, PenTool, Calendar } from 'lucide-react';
import { Modal } from '../components/Modal';
import { TenantManagementModal } from '../components/TenantManagementModal';
import { SaasService, type IndustryTemplate } from '../services/SaasService';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    industry?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    plan: string;
    active_modules?: string[];
}

export const TenantsPage = () => {
    const { token, user } = useAuth();
    // const navigate = useNavigate(); // Unused
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Estados
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modales
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newSlug, setNewSlug] = useState('');
    const [newIndustry, setNewIndustry] = useState('CLINICAL');

    // SaaS Genesis
    const [availableIndustries, setAvailableIndustries] = useState<IndustryTemplate[]>([]);

    // Importación
    const [importTenant, setImportTenant] = useState<Tenant | null>(null);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Gestión de Módulos
    const [managingTenant, setManagingTenant] = useState<Tenant | null>(null);

    // Menú acciones
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Cargar Empresas e Industrias
    useEffect(() => {
        fetchTenants();
        loadIndustries();
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadIndustries = async () => {
        try {
            const data = await SaasService.getIndustries();
            setAvailableIndustries(data);
        } catch (e) {
            console.error("Error loading industries", e);
        }
    };

    const fetchTenants = async () => {
        try {
            const res = await fetch(`${API_URL}/tenants/admin/all`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-slug': user?.tenant?.slug || ''
                }
            });
            if (res.ok) {
                const data = await res.json();
                setTenants(data);
            }
        } catch (error) {
            console.error("Error cargando tenants:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNameChange = (val: string) => {
        setNewName(val);
        const generatedSlug = val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
        setNewSlug(generatedSlug);
    };

    const handleCreateTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await fetch(`${API_URL}/tenants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-slug': user?.tenant?.slug || ''
                },
                body: JSON.stringify({ name: newName, slug: newSlug, industry: newIndustry as any }),
            });
            if (res.ok) {
                await fetchTenants();
                closeCreateModal();
            } else {
                alert("Error al crear. Verifica el código.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importTenant || !importFile) return;

        setIsImporting(true);
        const formData = new FormData();
        formData.append('files', importFile);

        try {
            const res = await fetch(`${API_URL}/migration/import?tenant=${importTenant.slug}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-slug': user?.tenant?.slug || ''
                },
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                alert(`✅ Importación Exitosa! Se procesaron ${data.processed} pacientes.`);
                closeImportModal();
            } else {
                const err = await res.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            alert("Error de conexión al importar.");
        } finally {
            setIsImporting(false);
        }
    };

    // --- PUNTO CRÍTICO DE OPTIMIZACIÓN ---
    const enterTenant = (tenant: Tenant) => {
        console.log(`[TenantsPage] Entering tenant: ${tenant.name} (${tenant.slug})`);

        // 1. Persistencia Crítica
        localStorage.setItem('currentTenantSlug', tenant.slug);
        localStorage.setItem('currentTenantId', tenant.id);

        // 2. Evento para notificar a otras pestañas/componentes (opcional pero recomendado)
        window.dispatchEvent(new Event('storage'));

        // 3. Forzar recarga para limpiar estado de memoria
        window.location.href = '/dashboard';
    };

    const closeCreateModal = () => { setIsCreateModalOpen(false); setNewName(''); setNewSlug(''); setNewIndustry('CLINICAL'); };
    const closeImportModal = () => { setImportTenant(null); setImportFile(null); };

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <div className="bg-white border-b border-slate-200 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="text-blue-600" /> Empresas Registradas
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión multitenant de clínicas.</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95">
                    <Plus size={20} /> Nueva Empresa
                </button>
            </div>

            <div className="flex-1 p-8 overflow-hidden flex flex-col">
                <div className="mb-6 relative max-w-md">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                    <input type="text" placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 overflow-visible">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Nombre Comercial</th>
                                <th className="px-6 py-4">Slug</th>
                                <th className="px-6 py-4">Rubro</th>
                                <th className="px-6 py-4">Suscripciones</th>
                                <th className="px-6 py-4">Plan</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2" /> Cargando...</td></tr>
                            ) : filteredTenants.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800">{tenant.name}</td>
                                    <td className="px-6 py-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono border border-slate-200">{tenant.slug}</span></td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded border ${tenant.industry === 'VET' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                            tenant.industry === 'EVENTS' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                tenant.industry === 'CRAFT' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                    'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                            {tenant.industry || 'CLINICAL'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800 text-lg">{(tenant.active_modules || []).length}</span>
                                            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Activos</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase">{tenant.plan}</span></td>
                                    <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle size={12} /> ACTIVO</span></td>
                                    <td className="px-6 py-4 text-right relative">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === tenant.id ? null : tenant.id); }}
                                            className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {activeMenuId === tenant.id && (
                                            <div ref={menuRef} className="absolute right-8 top-8 w-56 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                <button
                                                    onClick={() => enterTenant(tenant)}
                                                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors border-b border-slate-50 font-medium"
                                                >
                                                    <LayoutDashboard size={16} className="text-blue-600" /> Gestionar Clínica
                                                </button>
                                                <button
                                                    onClick={() => { setManagingTenant(tenant); setActiveMenuId(null); }}
                                                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-slate-50"
                                                >
                                                    <Zap size={16} className="text-amber-500" /> Configurar Módulos
                                                </button>
                                                <button
                                                    onClick={() => { setImportTenant(tenant); setActiveMenuId(null); }}
                                                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                                >
                                                    <Upload size={16} className="text-slate-400" /> Importar Pacientes
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} title="Registrar Nueva Empresa">
                <form onSubmit={handleCreateTenant} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Comercial</label>
                        <input autoFocus type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Clínica San Felipe" value={newName} onChange={(e) => handleNameChange(e.target.value)} required />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Rubro / Industria</label>
                        <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                            {availableIndustries.map(ind => {
                                const isSelected = newIndustry === ind.type;
                                return (
                                    <div
                                        key={ind.id}
                                        onClick={() => setNewIndustry(ind.type)}
                                        className={`cursor-pointer rounded-xl border p-4 transition-all relative ${isSelected ? 'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {ind.type === 'CLINICAL' && <Activity size={20} />}
                                                {ind.type === 'VET' && <Dog size={20} />}
                                                {ind.type === 'CRAFT' && <PenTool size={20} />}
                                                {ind.type === 'EVENTS' && <Calendar size={20} />}
                                            </div>
                                            <span className={`font-bold text-sm ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>{ind.name}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 line-clamp-2">
                                            Incluye: {ind.defaultModules.length} módulos
                                        </div>
                                        {isSelected && <div className="absolute top-2 right-2 text-blue-600"><CheckCircle size={16} /></div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Slug (Automático)</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 bg-slate-100 text-slate-500 rounded-lg outline-none font-mono text-sm" value={newSlug} readOnly />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={closeCreateModal} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={isCreating} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition disabled:opacity-70">
                            {isCreating ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {isCreating ? 'Creando...' : 'Guardar Empresa'}
                        </button>
                    </div>
                </form>
            </Modal>
            <Modal isOpen={!!importTenant} onClose={closeImportModal} title={`Importar a ${importTenant?.name}`}>
                <form onSubmit={handleImport} className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="text-sm text-blue-800">Sube el archivo Excel (.xlsx) con el historial histórico de pacientes.</p>
                    </div>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-slate-50 transition cursor-pointer relative">
                        <input type="file" accept=".xlsx, .xls" onChange={(e) => setImportFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="bg-blue-100 p-3 rounded-full mb-3 text-blue-600"><FileSpreadsheet size={32} /></div>
                        {importFile ? <div><p className="font-bold text-slate-800">{importFile.name}</p></div> : <div><p className="font-bold text-slate-600">Haz clic para seleccionar</p></div>}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={closeImportModal} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={!importFile || isImporting} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            {isImporting ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />} {isImporting ? 'Procesando...' : 'Iniciar Importación'}
                        </button>
                    </div>
                </form>
            </Modal>

            <TenantManagementModal
                isOpen={!!managingTenant}
                tenant={managingTenant}
                onClose={() => setManagingTenant(null)}
                onUpdate={fetchTenants}
            />
        </div >
    );
};