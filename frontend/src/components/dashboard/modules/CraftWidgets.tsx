
import { Calendar, Users, Package, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { KpiGrid, type KpiItem } from '../ui/KpiGrid';

export const CraftWidgets = () => {
    // Stats Mock for Craft
    const stats = {
        activeWorkshops: 3,
        pendingOrders: 12,
        totalEvents: 5
    };

    const kpiItems: KpiItem[] = [
        { label: 'Eventos Activos', value: stats.activeWorkshops, sub: 'Talleres en curso', icon: <Calendar className="text-purple-600" />, link: '/dashboard/events', color: 'purple' },
        { label: 'Pedidos Pendientes', value: stats.pendingOrders, sub: 'Por despachar', icon: <Package className="text-indigo-600" />, link: '/dashboard/orders', color: 'indigo' },
        { label: 'Participantes', value: 156, sub: 'Registrados este mes', icon: <Users className="text-slate-600" />, link: '/dashboard/participants', color: 'slate' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Sección de Bienvenida Específica Craft (The Purple Block) */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Panel de Taller Creativo</h2>
                    <p className="text-white/80 font-medium max-w-xl">Gestiona tus eventos, inscripciones y materiales desde un solo lugar.</p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 mt-6 flex gap-4">
                    <Link to="/dashboard/events/new" className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-2">
                        <Plus size={16} strokeWidth={3} /> Nuevo Evento
                    </Link>
                </div>
            </div>

            {/* Quick Actions specific for Craft if needed, or just rely on the Banner buttons + KPI Grid */}
            {/* For now, just the KPI Grid as per instructions to move the "purple block" logic here */}

            {/* KPI Grid */}
            <KpiGrid items={kpiItems} />
        </div>
    );
};
