import React, { useEffect, useState } from 'react'; // Lint trigger
import { Plus, Package, Stethoscope, Dog, Scissors, Ticket, Save } from 'lucide-react';
import { SaasService } from '../../services/SaasService';
import type { IndustryTemplate } from '../../services/SaasService';
import { IndustryCard } from '../../components/admin/ui/IndustryCard';
import { Modal } from '../../components/Modal';
import { DashboardLayoutBuilder } from '../../components/admin/DashboardLayoutBuilder';

const AVAILABLE_MODULES = [
    { code: 'core-std', label: 'Núcleo Estándar (Obligatorio)', description: 'Dashboard, Usuarios, Configuración' },
    { code: 'mod_appointments', label: 'Agenda & Citas', description: 'Calendario, Wizard de Citas, Recordatorios' },
    { code: 'mod_patients', label: 'Pacientes (EMR)', description: 'Historia Clínica, Fichas, Antecedentes' },
    { code: 'mod_financial', label: 'Finanzas & Caja', description: 'Facturación, Gastos, Reportes' },
    { code: 'mod_logistics', label: 'Logística & Inventario', description: 'Productos, Stock, Proveedores' },
    { code: 'mod_marketing', label: 'Marketing CRM', description: 'Campañas, Emailing, Leads' },
    { code: 'mod_vet', label: 'Veterinaria Pro', description: 'Mascotas, Razas, Vacunas' },
    { code: 'lab', label: 'Laboratorio', description: 'Exámenes, Resultados, Muestras' },
    { code: 'pharmacy', label: 'Farmacia', description: 'Recetas, Despacho, Stock' },
    { code: 'telemed', label: 'Telemedicina', description: 'Videollamadas, Receta Digital' },
];

export const IndustriesPage: React.FC = () => {
    const [industries, setIndustries] = useState<IndustryTemplate[]>([]);
    const [activeTab, setActiveTab] = useState<'rubrics' | 'modules'>('rubrics');
    const [loading, setLoading] = useState(true);

    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedIndustry, setSelectedIndustry] = useState<IndustryTemplate | null>(null);
    const [editTab, setEditTab] = useState<'general' | 'dashboard'>('general');
    const [layout, setLayout] = useState<any[]>([]);
    const [editForm, setEditForm] = useState<{
        defaultModules: string[];
        theme: string;
        terminology: string;
    }>({ defaultModules: [], theme: '', terminology: '' });

    useEffect(() => {
        loadIndustries();
    }, []);

    const loadIndustries = async () => {
        setLoading(true);
        try {
            const data = await SaasService.getIndustries();
            setIndustries(data);
        } catch (error) {
            console.error('Error loading industries:', error);
        } finally {
            setLoading(false);
        }
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'CLINICAL': return <Stethoscope size={24} />;
            case 'VET': return <Dog size={24} />;
            case 'CRAFT': return <Scissors size={24} />;
            case 'EVENTS': return <Ticket size={24} />;
            default: return <Package size={24} />;
        }
    };

    const handleEdit = (industry: IndustryTemplate) => {
        setSelectedIndustry(industry);
        setEditForm({
            defaultModules: industry.defaultModules || [],
            theme: industry.defaultSettings?.theme || 'blue',
            terminology: industry.defaultSettings?.terminology || 'default'
        });
        setLayout(industry.defaultLayout || []);
        setEditTab('general');
        setIsEditModalOpen(true);
    };

    const handleToggleModule = (moduleCode: string) => {
        if (moduleCode === 'core-std') return; // Cannot disable core
        setEditForm(prev => {
            const exists = prev.defaultModules.includes(moduleCode);
            if (exists) {
                return { ...prev, defaultModules: prev.defaultModules.filter(m => m !== moduleCode) };
            } else {
                return { ...prev, defaultModules: [...prev.defaultModules, moduleCode] };
            }
        });
    };

    const handleCreate = () => {
        setSelectedIndustry(null);
        setEditForm({
            defaultModules: ['core-std'],
            theme: 'blue',
            terminology: 'human'
        });
        setLayout([]);
        setEditTab('general');
        setIsEditModalOpen(true);
    };

    const handleDelete = async (type: string) => {
        if (!confirm(`¿Eliminar perfil de industria ${type}?`)) return;
        // implementation would go here if backend supported delete, for now just log
        console.log('Delete feature pending backend implementation for:', type);
        alert('Eliminación no implementada en backend aún.');
    };

    const handleSave = async () => {
        try {
            if (selectedIndustry) {
                // UPDATE
                await SaasService.updateIndustry(selectedIndustry.type, {
                    defaultModules: editForm.defaultModules,
                    defaultSettings: {
                        ...selectedIndustry.defaultSettings,
                        theme: editForm.theme,
                        terminology: editForm.terminology
                    },
                    defaultLayout: layout
                });
            } else {
                // CREATE - We need a TYPE for creation. For now, we might need to add a "Type" selector in the form if creating new types is allowed.
                // Assuming for this phase we only edit existing or create with a generated type. 
                // Let's add a basic prompt for Type since it's a key.
                const newType = prompt("Ingrese el CÓDIGO único para el nuevo rubro (ej. DENTAL, LEGAL):");
                if (!newType) return;

                await SaasService.createIndustry({
                    type: newType.toUpperCase() as any,
                    name: newType.toUpperCase(), // Default name
                    defaultModules: editForm.defaultModules,
                    defaultSettings: { theme: editForm.theme, terminology: editForm.terminology },
                    defaultLayout: layout
                });
            }

            setIsEditModalOpen(false);
            loadIndustries();
            console.log('✅ Operación exitosa');
        } catch (error) {
            alert('Error al guardar cambios');
        }
    };

    if (loading) return <div className="p-14 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Cargando perfiles...</div>;

    return (
        <div className="p-8 md:p-14 space-y-12 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Arquitecto de Sistema</h1>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.3em] mt-3">Configuración global de perfiles y rubros de negocio</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button onClick={() => setActiveTab('rubrics')} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'rubrics' ? 'bg-white shadow-lg text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Perfiles</button>
                    <button onClick={() => setActiveTab('modules')} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'modules' ? 'bg-white shadow-lg text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Módulos</button>
                </div>
            </header>

            {activeTab === 'rubrics' && (
                <div className="space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Perfiles Maestros</h2>
                        <button
                            onClick={handleCreate}
                            className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-blue-700 transition-all">
                            <Plus size={18} /> Nuevo Perfil
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {industries.map((ind) => (
                            <IndustryCard
                                key={ind.id}
                                name={ind.name}
                                description={`Perfil configurado para ${ind.name.toLowerCase()}.`}
                                icon={getIconForType(ind.type)}
                                stats={{
                                    modules: ind.defaultModules?.length || 0,
                                    widgets: ind.defaultLayout?.length || 0,
                                    plans: 3 // Mocked for now, strictly visual requirement
                                }}
                                onEdit={() => handleEdit(ind)}
                                onDelete={() => handleDelete(ind.type)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Configurar: ${selectedIndustry?.name}`}>
                <div className="flex gap-4 mb-4 border-b border-slate-200">
                    <button
                        onClick={() => setEditTab('general')}
                        className={`pb-2 px-4 font-bold text-sm transition-colors ${editTab === 'general' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        General & Módulos
                    </button>
                    <button
                        onClick={() => setEditTab('dashboard')}
                        className={`pb-2 px-4 font-bold text-sm transition-colors ${editTab === 'dashboard' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Diseño del Dashboard
                    </button>
                </div>

                <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                    {editTab === 'general' ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Tema Visual (Color)</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={editForm.theme}
                                        onChange={e => setEditForm(prev => ({ ...prev, theme: e.target.value }))}
                                    >
                                        <option value="blue">Blue (Clinical)</option>
                                        <option value="orange">Orange (Vet)</option>
                                        <option value="purple">Purple (Craft)</option>
                                        <option value="dark">Dark (Events)</option>
                                        <option value="green">Green (Nature)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Terminología</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={editForm.terminology}
                                        onChange={e => setEditForm(prev => ({ ...prev, terminology: e.target.value }))}
                                    >
                                        <option value="human">Humana (Paciente)</option>
                                        <option value="pet">Veterinaria (Mascota)</option>
                                        <option value="student">Academia (Alumno)</option>
                                        <option value="guest">Eventos (Invitado)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">Módulos Activados por Defecto</h4>
                                <div className="space-y-2">
                                    {AVAILABLE_MODULES.map(module => {
                                        const isActive = editForm.defaultModules.includes(module.code);
                                        const isCore = module.code === 'core-std';
                                        return (
                                            <div
                                                key={module.code}
                                                onClick={() => handleToggleModule(module.code)}
                                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isActive ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'hover:bg-slate-50 border-slate-200'} ${isCore && 'opacity-60 cursor-not-allowed'}`}
                                            >
                                                <div>
                                                    <div className={`font-bold text-sm ${isActive ? 'text-indigo-700' : 'text-slate-600'}`}>{module.label}</div>
                                                    <div className="text-xs text-slate-500">{module.description}</div>
                                                </div>
                                                <div className={`w-10 h-6 rounded-full relative transition-colors ${isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isActive ? 'left-5' : 'left-1'}`} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <DashboardLayoutBuilder
                                initialLayout={layout}
                                onSave={(newLayout) => setLayout(newLayout as any[])}
                                industryType={selectedIndustry?.type || 'UNKNOWN'}
                            />
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3 border-t">
                        <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-700">Cancelar</button>
                        <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2">
                            <Save size={18} /> Guardar Cambios
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
