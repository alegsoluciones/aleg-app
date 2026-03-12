import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
// import type { Layout } from 'react-grid-layout/legacy'; // Avoid ambiguity
import { Activity, Calendar, DollarSign, Users, Bell, Search, GripVertical } from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface LayoutItem {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
}
export type Layout = LayoutItem[];

interface DashboardLayoutBuilderProps {
    initialLayout: Layout | null;
    onSave: (layout: Layout) => void;
    industryType: string;
}

const AVAILABLE_WIDGETS = [
    // Clinical
    { id: 'stats_overview', title: 'Resumen Estadístico', w: 4, h: 1, icon: <Activity size={20} />, color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    { id: 'calendar_today', title: 'Agenda del Día', w: 2, h: 4, icon: <Calendar size={20} />, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { id: 'patients_recent', title: 'Pacientes Recientes', w: 2, h: 2, icon: <Users size={20} />, color: 'bg-blue-50 border-blue-200 text-blue-700' },
    // Business
    { id: 'quick_access', title: 'Accesos Rápidos', w: 2, h: 2, icon: <Search size={20} />, color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { id: 'notifications', title: 'Avisos & Alertas', w: 2, h: 2, icon: <Bell size={20} />, color: 'bg-rose-50 border-rose-200 text-rose-700' },
    { id: 'revenue_chart', title: 'Gráfico de Ingresos', w: 2, h: 3, icon: <DollarSign size={20} />, color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { id: 'active_users', title: 'Usuarios Activos', w: 1, h: 1, icon: <Users size={20} />, color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
    // Prototype Extras
    { id: 'marketing_campaigns', title: 'Campañas Activas', w: 2, h: 2, icon: <Bell size={20} />, color: 'bg-purple-50 border-purple-200 text-purple-700' },
    { id: 'inventory_alert', title: 'Alerta Inventario', w: 1, h: 1, icon: <Activity size={20} />, color: 'bg-red-50 border-red-200 text-red-700' }
];

const DEFAULT_LAYOUT: Layout = [
    { i: 'stats_overview', x: 0, y: 0, w: 4, h: 1 },
    { i: 'calendar_today', x: 0, y: 1, w: 2, h: 4 },
    { i: 'quick_access', x: 2, y: 1, w: 2, h: 2 },
    { i: 'revenue_chart', x: 2, y: 3, w: 2, h: 2 }
];

export const DashboardLayoutBuilder: React.FC<DashboardLayoutBuilderProps> = ({ initialLayout, onSave, industryType }) => {
    const [layout, setLayout] = useState<Layout>(initialLayout || DEFAULT_LAYOUT);

    // Reset to default if initialLayout is null on mount
    useEffect(() => {
        if (initialLayout) setLayout(initialLayout);
    }, [initialLayout]);

    const handleLayoutChange = (currentLayout: any, _allLayouts: any) => {
        // We cast to any to avoid readonly/mutable strict checks from RGL types
        setLayout(currentLayout as Layout);
    };

    const handleSaveClick = () => {
        // Clean layout data before saving (remove internal react-grid-layout props if any)
        const cleanLayout = layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));
        onSave(cleanLayout);
    };

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center border border-blue-100">
                <div className="text-sm text-blue-800">
                    <strong>Constructor de Dashboard:</strong> Arrastra y redimensiona los widgets para definir la vista por defecto de {industryType}.
                </div>
                <button
                    onClick={handleSaveClick}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition"
                >
                    Guardar Distribución
                </button>
            </div>

            <div className="bg-slate-100 p-6 rounded-xl border-2 border-dashed border-slate-300 min-h-[500px]">
                <ResponsiveGridLayout
                    className="layout"
                    layouts={{ lg: layout }}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 4, md: 4, sm: 2, xs: 1, xxs: 1 }}
                    rowHeight={100}
                    onLayoutChange={handleLayoutChange}
                    isDraggable={true}
                    isResizable={true}
                    draggableHandle=".drag-handle"
                    compactType="vertical"
                >
                    {layout.map(item => {
                        const widget = AVAILABLE_WIDGETS.find(w => w.id === item.i) || { title: item.i, color: 'bg-white', icon: <Activity /> };
                        return (
                            <div key={item.i} className={`rounded-xl shadow-sm border p-4 flex flex-col justify-between group ${widget.color}`}>
                                <div className="flex justify-between items-start cursor-move drag-handle">
                                    <div className="flex items-center gap-2 font-bold opacity-80 pointer-events-none">
                                        {widget.icon}
                                        <span className="text-sm">{widget.title}</span>
                                    </div>
                                    <GripVertical size={16} className="opacity-0 group-hover:opacity-50" />
                                </div>
                                <div className="text-[10px] opacity-60 font-mono text-right">
                                    {item.w}x{item.h}
                                </div>
                            </div>
                        );
                    })}
                </ResponsiveGridLayout>
            </div>

            <div className="text-xs text-slate-400 text-center">
                * Los usuarios finales podrán personalizar esto, pero esta será su vista inicial.
            </div>
        </div>
    );
};
