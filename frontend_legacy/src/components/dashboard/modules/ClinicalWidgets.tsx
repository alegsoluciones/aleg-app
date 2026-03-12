import { Calendar, CheckCircle2, Bell, Users, Clock, MessageSquare, Mail, CalendarDays, TrendingUp, Activity, XCircle, PawPrint, Plus, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../routes/paths';
import { KpiGrid, type KpiItem } from '../ui/KpiGrid';
import { useTerminology } from '../../../hooks/useTerminology';
import { useTenantConfig } from '../../../context/TenantContext';
import { QuickActionCard } from '../ui/QuickActionCard';
import { DashboardWidgetCard } from '../ui/DashboardWidgetCard';

// Types for internal component use
interface Appointment {
    id: string;
    patientName: string;
    doctorName?: string;
    date: string;
    time: string;
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED' | 'NOSHOW';
    notifiedWhatsApp: boolean;
    notifiedEmail: boolean;
}

export const ClinicalWidgets = () => {
    // 1. Hooks for Dynamic Logic
    const t = useTerminology(); // Returns dictionary (Patient vs Mascota)
    const { config } = useTenantConfig();
    const isVet = config?.industry === 'VET';

    const hasAppointments = config?.active_modules?.includes('mod_appointments');

    const hasPatients = config?.active_modules?.includes('mod_patients');



    // Stats Mock
    const stats = {
        todayApps: 12,
        confirmedToday: 8,
        notifiedToday: 12,
        activePatients: 1450,
        visitsMonth: 342,
        cancelledMonth: 15,
        nextAppointments: [
            { id: '1', time: '09:00', patientName: isVet ? 'Bobby (Perro)' : 'Maria Rodriguez', doctorName: 'Dr. House', status: 'CONFIRMED', notifiedWhatsApp: true, notifiedEmail: true },
            { id: '2', time: '10:30', patientName: isVet ? 'Luna (Gato)' : 'Carlos Perez', doctorName: 'Dra. Cuddy', status: 'PENDING', notifiedWhatsApp: true, notifiedEmail: false },
            { id: '3', time: '11:15', patientName: isVet ? 'Max (Perro)' : 'Ana Gomez', doctorName: 'Dr. Wilson', status: 'CONFIRMED', notifiedWhatsApp: true, notifiedEmail: true },
            { id: '4', time: '14:00', patientName: isVet ? 'Thor (Hamster)' : 'Luis Torres', doctorName: 'Dr. Foreman', status: 'CANCELLED', notifiedWhatsApp: false, notifiedEmail: true },
            { id: '5', time: '16:45', patientName: isVet ? 'Mia (Gato)' : 'Sofia Lopez', doctorName: 'Dr. Chase', status: 'CONFIRMED', notifiedWhatsApp: true, notifiedEmail: true },
        ] as Appointment[]
    };

    const kpiItems: KpiItem[] = [
        ...(hasAppointments ? [
            { label: 'Citas Hoy', value: stats.todayApps, sub: 'Agenda del día', icon: <Calendar className="text-blue-600" />, link: '/dashboard/calendar', color: 'blue' } as KpiItem,
            { label: 'Confirmadas', value: stats.confirmedToday, sub: `${((stats.confirmedToday / (stats.todayApps || 1)) * 100).toFixed(0)}% efectividad`, icon: <CheckCircle2 className="text-emerald-600" />, link: '/dashboard/calendar', color: 'emerald' } as KpiItem,
            { label: 'Notificadas', value: stats.notifiedToday, sub: 'WhatsApp / Email', icon: <Bell className="text-amber-600" />, link: '/dashboard/calendar', color: 'amber' } as KpiItem,
        ] : []),
        ...(hasPatients ? [
            {
                label: `${t.patients} Activos`,
                value: stats.activePatients,
                sub: 'Base de datos total',
                icon: isVet ? <PawPrint className="text-slate-600" /> : <Users className="text-slate-600" />,
                link: ROUTES.DASHBOARD.MEDICAL_RECORDS,
                color: 'slate'
            } as KpiItem
        ] : []),
    ];

    return (
        <div className="space-y-8">

            {/* Quick Actions for Clinical - Only Visible here */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {hasAppointments && (
                    <QuickActionCard
                        to="/dashboard/calendar"
                        icon={<Plus size={24} />}
                        label="Nueva Cita"
                        sub="Agendar visita"
                        color="blue"
                        className="h-auto py-5"
                    />
                )}

                {hasPatients && (
                    <QuickActionCard
                        to={ROUTES.DASHBOARD.MEDICAL_RECORDS}
                        icon={isVet ? <PawPrint size={24} /> : <Users size={24} />}
                        label={`Crear ${t.patient}`}
                        sub="Nuevo registro"
                        color="emerald"
                        className="h-auto py-5"
                    />
                )}

                <QuickActionCard
                    to={ROUTES.DASHBOARD.MEDICAL_RECORDS}
                    icon={<Stethoscope size={24} />}
                    label={t.history}
                    sub="Ver expedientes"
                    color="indigo"
                    className="h-auto py-5"
                />
            </div>

            {/* KPI Grid */}
            <KpiGrid items={kpiItems} />

            {/* SECCIÓN: Monitor de Citas y Rendimiento Mensual */}
            {hasAppointments && (
                <div className="grid grid-cols-1 lg:col-span-12 gap-8">
                    <div className="lg:col-span-8">
                        <DashboardWidgetCard
                            title="Monitor de Agenda"
                            subtitle="Actividad en Tiempo Real"
                            icon={<Clock size={24} />}
                            headerAction={<Link to="/dashboard/calendar" className="text-[10px] font-black text-blue-600 uppercase hover:underline">Ver Agenda Completa</Link>}
                            color="blue"
                            className="h-full"
                        >
                            <div className="overflow-x-auto -mx-8 mt-4">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            <th className="px-8 py-5">Hora</th>
                                            <th className="px-8 py-5">{t.patient}</th>
                                            <th className="px-8 py-5">Doctor / Especialidad</th>
                                            <th className="px-8 py-5">Estado</th>
                                            <th className="px-8 py-5 text-center">Notificado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {stats.nextAppointments.length > 0 ? stats.nextAppointments.map((app, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <span className="text-sm font-black text-slate-900 tracking-tighter">{app.time}</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-xs font-black text-slate-800 uppercase truncate">{app.patientName}</p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{app.doctorName}</p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${app.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' :
                                                        app.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600' :
                                                            'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {app.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex justify-center gap-3">
                                                        <MessageSquare size={16} className={app.notifiedWhatsApp ? 'text-emerald-500' : 'text-slate-200'} />
                                                        <Mail size={16} className={app.notifiedEmail ? 'text-blue-500' : 'text-slate-200'} />
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="p-20 text-center opacity-20">
                                                    <CalendarDays size={48} className="mx-auto mb-4" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Sin citas registradas para hoy</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </DashboardWidgetCard>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <DashboardWidgetCard
                            title="Rendimiento Mensual"
                            subtitle="Visitas vs Cancelaciones"
                            icon={<TrendingUp size={24} />}
                            color="indigo"
                        >
                            <div className="space-y-6 mt-2">
                                <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Visitas Concretadas</p>
                                        <div className="flex items-end justify-between">
                                            <h3 className="text-5xl font-black tracking-tighter">{stats.visitsMonth}</h3>
                                            <div className="text-right">
                                                <p className="text-emerald-400 text-xs font-black uppercase flex items-center justify-end gap-1">
                                                    <TrendingUp size={14} /> +12%
                                                </p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">vs Mes anterior</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Activity className="absolute -right-8 -bottom-8 text-white/5 w-40 h-40 transition-transform group-hover:scale-110" />
                                </div>
                                <div className="bg-slate-50 rounded-[2rem] border border-slate-100 p-8 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Citas Canceladas</p>
                                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.cancelledMonth}</p>
                                        <p className="text-[9px] text-rose-500 font-bold uppercase mt-1 flex items-center gap-1">
                                            <XCircle size={10} /> {((stats.cancelledMonth / (stats.visitsMonth + stats.cancelledMonth || 1)) * 100).toFixed(1)}% de la agenda
                                        </p>
                                    </div>
                                    <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500">
                                        <Activity size={24} />
                                    </div>
                                </div>
                            </div>
                        </DashboardWidgetCard>
                    </div>
                </div>
            )}
        </div>
    );
};
