import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenantConfig } from '../context/TenantContext';
import { WelcomeBanner } from '../components/dashboard/ui/WelcomeBanner';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import type { Layout } from 'react-grid-layout/legacy';
const ResponsiveGridLayout = WidthProvider(Responsive);

import { DashboardWidgets } from '../components/dashboard/WidgetRegistry';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Pencil, Save, X, LayoutDashboard } from 'lucide-react';
import { SaasService } from '../services/SaasService';

// Widget Imports (We need individual components now)
import { CoreWidgets } from '../components/dashboard/modules/CoreWidgets';



export const TenantHome = () => {
    const { user } = useAuth();
    const { config, loading } = useTenantConfig();
    const [isEditing, setIsEditing] = useState(false);
    const [layout, setLayout] = useState<Layout>([]);
    const [isSaving, setIsSaving] = useState(false);

    const tenantName = config?.name || user?.tenant?.name || 'Clínica';
    const isTenantAdmin = user?.role === 'TENANT_ADMIN'; // Removed SUPER_ADMIN to avoid 403 / confusion

    // Initialize Layout from Config
    useEffect(() => {
        if (config?.dashboardLayout && config.dashboardLayout.length > 0) {
            setLayout(config.dashboardLayout as Layout);
        } else {
            // Default Layout (Vertical Stack)
            const defaultL: Layout = [
                { i: 'welcome', x: 0, y: 0, w: 12, h: 4, static: true }, // Banner is usually static
                { i: 'core', x: 0, y: 4, w: 12, h: 6 },
                { i: 'industry', x: 0, y: 10, w: 12, h: 8 },
            ];
            setLayout(defaultL);
        }
    }, [config]);

    const handleLayoutChange = (currentLayout: Layout) => {
        setLayout(currentLayout);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await SaasService.updateLayout(layout as any[]);
            // Optimistic update of config could be handled here or via context reload
            alert("✅ Diseño guardado exitosamente");
            setIsEditing(false);
            window.location.reload(); // Simple reload to refresh context for now
        } catch (error) {
            console.error("Error saving layout", error);
            alert("❌ Error al guardar el diseño");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div>Cargando dashboard...</div>;

    // Industry Logic (Simplified from Registry)
    const industry = config?.industry || 'CLINICAL';
    const showClinical = ['CLINICAL', 'VET', 'DENTAL'].includes(industry);
    const showCraft = industry === 'CRAFT';

    return (
        <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-50 min-h-screen">

            {/* TOOLBAR (Admin Only) */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <LayoutDashboard className="text-blue-600" />
                    {isEditing ? 'Personalizando Diseño' : 'Dashboard'}
                </h1>

                {isTenantAdmin && (
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition">
                                    <X size={18} /> Cancelar
                                </button>
                                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white font-bold hover:bg-emerald-700 rounded-lg transition shadow-lg shadow-emerald-500/30">
                                    <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 rounded-lg transition shadow-sm">
                                <Pencil size={16} /> Personalizar
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* EDIT MODE: GRID */}
            {isEditing ? (
                <div className="bg-slate-200/50 p-4 rounded-xl border-2 border-dashed border-slate-300 min-h-[600px]">
                    <div className="mb-4 text-center text-slate-500 text-sm italic">
                        Arrastra y redimensiona los bloques. El bloque "Bienvenida" es fijo.
                    </div>
                    <ResponsiveGridLayout
                        className="layout"
                        layouts={{ lg: layout }}
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                        rowHeight={30}
                        onLayoutChange={handleLayoutChange}
                        isDraggable={true}
                        isResizable={true}
                    >
                        <div key="welcome" className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200/60 opacity-80 pointer-events-none">
                            <WelcomeBanner title={`¡Hola, ${user?.fullName?.split(' ')[0]}!`} subtitle="Vista Previa" />
                        </div>
                        <div key="core" className="bg-white rounded-2xl shadow-sm p-4 border border-blue-200 cursor-move relative group hover:shadow-md transition">
                            <div className="absolute top-2 right-2 bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-bold">CORE WIDGETS</div>
                            <div className="pointer-events-none opacity-50"><CoreWidgets /></div>
                        </div>
                        <div key="industry" className="bg-white rounded-2xl shadow-sm p-4 border border-purple-200 cursor-move relative group hover:shadow-md transition">
                            <div className="absolute top-2 right-2 bg-purple-100 text-purple-600 px-2 py-1 rounded text-xs font-bold">INDUSTRIA ({industry})</div>
                            <div className="pointer-events-none opacity-50">
                                {showClinical && <div className="p-4 bg-slate-50 text-center">Widgets Clínicos</div>}
                                {showCraft && <div className="p-4 bg-slate-50 text-center">Widgets Taller</div>}
                            </div>
                        </div>
                    </ResponsiveGridLayout>
                </div>
            ) : (
                /* VIEW MODE: STANDARD STACK (Or Custom Layout if we parse it) */
                /* For Phase 5.5, we will keep the standard stack if not editing, 
                   OR apply the saved layout statically. Since WidgetRegistry assumes standard stack,
                   we will use standard stack for VIEW mode for now, to ensure stability. 
                   Real customization in view mode requires breaking down WidgetRegistry. */
                <div className="space-y-8 animate-in fade-in duration-500">
                    <WelcomeBanner
                        title={`¡Hola de nuevo, ${user?.fullName?.split(' ')[0]}!`}
                        subtitle={<span>Sincronizado con {tenantName} • {new Date().toLocaleDateString('es-ES')}</span>}
                    />

                    {/* Render standard flow - TODO: Parse Custom Layout in View Mode */}
                    <CoreWidgets />

                    {/* Industry Widgets */}
                    {/* Temporary manual logic until Registry is fully Grid-aware */}
                    <DashboardWidgets />
                </div>
            )}
        </div>
    );
};

