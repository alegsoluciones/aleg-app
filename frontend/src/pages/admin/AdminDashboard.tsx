import React from 'react';
import { Search, TrendingUp, Clock, CheckCircle2, Wallet } from 'lucide-react';
import { AdminStatCard } from '../../components/admin/ui/AdminStatCard';

export const AdminDashboard: React.FC = () => {
    // Mock Data for now, as we don't have a specific endpoint for these aggregate stats yet
    const stats = {
        totalRevenue: 12500,
        pendingAmount: 3200,
        paidCount: 45,
        pendingCount: 12
    };

    return (
        <div className="p-8 md:p-14 space-y-12 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">¡Hola de nuevo, Super! 👋</h1>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.3em] mt-3">Panel de Control Global y Métricas SaaS</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="BUSCAR TENANT O USUARIO..." className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all w-80 shadow-sm" />
                </div>
            </header>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <AdminStatCard
                    label="Ingresos Mensuales"
                    value={`S/ ${stats.totalRevenue.toLocaleString()}`}
                    icon={<TrendingUp />}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
                <AdminStatCard
                    label="Por Cobrar"
                    value={`S/ ${stats.pendingAmount.toLocaleString()}`}
                    icon={<Clock />}
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
                <AdminStatCard
                    label="Tenants Activos"
                    value={stats.paidCount}
                    icon={<CheckCircle2 />}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <AdminStatCard
                    label="Suscripciones Nuevas"
                    value={stats.pendingCount}
                    icon={<Wallet />}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                />
            </div>

            {/* Placeholder for future widgets or graphs */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-10 flex items-center justify-center min-h-[400px]">
                <p className="text-slate-300 font-black uppercase tracking-widest text-sm">Área de Métricas Globales (Próximamente)</p>
            </div>
        </div>
    );
};
