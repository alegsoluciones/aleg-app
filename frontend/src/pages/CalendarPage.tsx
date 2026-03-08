
import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar as CalendarIcon, Clock, User as UserIcon, Phone, Mail,
    MessageCircle, Plus, ChevronLeft, ChevronRight,
    Search, CheckCircle2, AlertTriangle, X, ArrowRight,
    MoreVertical, FileText, CalendarDays, History, Activity,
    Loader2, UserPlus, Check, Send, Smartphone, Edit2,
    MapPin, CreditCard, ShieldCheck, Briefcase, Tag, Eye,
    CalendarRange, MailOpen, UserCircle2, Info, ChevronDown,
    ClipboardList, Fingerprint, Map, UserCheck, Timer,
    Stethoscope, ExternalLink, GraduationCap, Shield, BellRing, Share2,
    MailCheck, MessageSquare, PhoneCall, RefreshCw, Zap, Bell, Save,
    ListTree, History as HistoryIcon, SendHorizontal, Search as Lupa
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppointmentsService } from '../services/AppointmentsService';
import { usePatients } from '../hooks/usePatients';
import type { Appointment, Patient } from '../types';

enum AppointmentStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    RESCHEDULED = 'RESCHEDULED' // Note: This might not be in backend types yet, but supported in UI
}

const DOCTORS = [
    { id: 'u1', name: 'DR. ALEJANDRO GÓMEZ' },
    { id: 'u2', name: 'DRA. ROSE MOTIN' }
];

const SPECIALTIES = [
    'DERMATOLOGÍA CLÍNICA',
    'DERMATOLOGÍA ESTÉTICA',
    'TRATAMIENTOS LÁSER',
    'DEPILACIÓN MÉDICA',
    'NUTRICIÓN & SKINCARE',
    'CONSULTA PEDIÁTRICA'
];

export const CalendarPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { patients } = usePatients(); // Use hook to get patients for search

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    // States for filters
    // Default to today
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [startDate, setStartDate] = useState<string | null>(today);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [filterMode, setFilterMode] = useState<'single' | 'range'>('single');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);

    // Date Navigation
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    // New Appointment Form State
    const [patientSearch, setPatientSearch] = useState('');
    const [newAppForm, setNewAppForm] = useState({
        patientId: '',
        time: '09:00',
        doctorId: 'u1',
        reason: '',
        specialty: 'DERMATOLOGÍA CLÍNICA',
        date: today
    });

    // Load appointments
    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                // Fetch broad range or specific date based on view? 
                // Better to fetch by month to populate the calendar counts, or fetch all for now if volume is low.
                // Let's fetch for the current month view at least.
                // Or just fetch all.
                const allApps = await AppointmentsService.getAll();
                setAppointments(allApps);
            } catch (err) {
                console.error(err);
            }
        };
        fetchAppointments();

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [viewMonth, viewYear]); // dependency regarding fetching logic could be improved

    const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

    const filteredAppointments = useMemo(() => {
        let result = appointments;

        if (filterMode === 'single') {
            result = result.filter(a => a.date === selectedDate);
        } else if (filterMode === 'range') {
            if (startDate && endDate) {
                const [start, end] = [startDate, endDate].sort();
                result = result.filter(a => a.date >= start && a.date <= end);
            } else if (startDate) {
                result = result.filter(a => a.date === startDate);
            }
        }

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(a =>
                a.patientName.toLowerCase().includes(lower) ||
                a.time.includes(lower)
            );
        }

        return result.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.time.localeCompare(b.time);
        });
    }, [appointments, selectedDate, startDate, endDate, filterMode, searchTerm]);

    const appointmentCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        appointments.forEach(app => {
            counts[app.date] = (counts[app.date] || 0) + 1;
        });
        return counts;
    }, [appointments]);

    const handleDayClick = (dateStr: string) => {
        if (filterMode === 'single') {
            setSelectedDate(dateStr);
            setStartDate(dateStr);
            setEndDate(null);
        } else {
            if (!startDate || (startDate && endDate)) {
                setStartDate(dateStr);
                setEndDate(null);
            } else {
                setEndDate(dateStr);
            }
        }
    };

    const updateAppointmentStatus = async (appId: string, newStatus: string) => {
        try {
            const updated = await AppointmentsService.update(appId, { status: newStatus as any });
            setAppointments(prev => prev.map(a => a.id === appId ? updated : a));
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const handleOpenEdit = (app: Appointment) => {
        setEditingAppointment({ ...app });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingAppointment) return;
        try {
            const updated = await AppointmentsService.update(editingAppointment.id, editingAppointment);
            setAppointments(prev => prev.map(a => a.id === editingAppointment.id ? updated : a));
            setIsEditModalOpen(false);
        } catch (err) {
            console.error("Failed to save edit", err);
        }
    };

    const handleOpenNew = () => {
        setNewAppForm({
            patientId: '',
            time: '09:00',
            doctorId: 'u1',
            reason: '',
            specialty: 'DERMATOLOGÍA CLÍNICA',
            date: selectedDate
        });
        setPatientSearch('');
        setIsNewModalOpen(true);
    };

    const handleSaveNew = async () => {
        if (!newAppForm.patientId) return alert("Por favor, seleccione un paciente.");

        const patient = patients.find(p => p.id === newAppForm.patientId);
        const doctor = DOCTORS.find(d => d.id === newAppForm.doctorId);

        const newAppPayload: Partial<Appointment> = {
            patientId: newAppForm.patientId,
            patientName: patient?.name || 'Desconocido', // Use name from backend
            date: newAppForm.date,
            time: newAppForm.time,
            status: 'PENDING',
            doctorName: doctor?.name || 'No asignado',
            doctorId: doctor?.id,
            reason: newAppForm.reason,
            // specialty: newAppForm.specialty, // Check if backend supports specialty field on Appointment
            notes: newAppForm.reason, // Map reason to notes if needed
            notifiedWhatsApp: false,
            notifiedEmail: false
        };

        try {
            const created = await AppointmentsService.create(newAppPayload);
            setAppointments(prev => [...prev, created]);
            setIsNewModalOpen(false);
        } catch (err) {
            console.error("Failed to create appointment", err);
            alert("Error al crear cita");
        }
    };

    // Helper for notifications (Mock for now, as backend support might vary)
    // const handleResend = ... same as prototype but maybe no backend call yet

    const getStatusDropdown = (app: Appointment) => {
        const colors: Record<string, string> = {
            'PENDING': 'bg-amber-50 text-amber-600 border-amber-200',
            'CONFIRMED': 'bg-blue-50 text-blue-600 border-blue-200',
            'COMPLETED': 'bg-emerald-50 text-emerald-600 border-emerald-200',
            'CANCELLED': 'bg-rose-50 text-rose-600 border-rose-200',
            'RESCHEDULED': 'bg-indigo-50 text-indigo-600 border-indigo-200',
        };

        return (
            <select
                value={app.status}
                onChange={(e) => updateAppointmentStatus(app.id, e.target.value)}
                className={`w-full p-2.5 rounded-xl text-[8.5px] font-black uppercase tracking-widest border transition-all cursor-pointer outline-none shadow-sm ${colors[app.status] || colors['PENDING']}`}
            >
                <option value="PENDING">PENDIENTE</option>
                <option value="CONFIRMED">CONFIRMADA</option>
                <option value="COMPLETED">ATENDIDO</option>
                <option value="RESCHEDULED">REPROGRAMAR</option>
                <option value="CANCELLED">CANCELAR</option>
            </select>
        );
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const filteredPatientResults = patients.filter(p =>
        p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
        (p.dni && p.dni.includes(patientSearch)) ||
        (p.internalId && p.internalId.includes(patientSearch))
    ).slice(0, 5);

    return (
        <div className="min-h-screen bg-white font-['Plus_Jakarta_Sans']">
            <header className="py-8 md:py-10 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center max-w-[1600px] mx-auto border-b border-slate-50">
                <div className="flex items-center gap-6">
                    <div className="bg-[#2563eb] text-white w-16 h-16 rounded-[1.2rem] flex items-center justify-center shadow-xl">
                        <CalendarDays size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter leading-none">Agenda & Gestión Clínica</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <Clock size={14} className="text-blue-600" />
                            <p className="text-[#64748b] font-bold uppercase tracking-[0.2em] text-[10px]">Control en tiempo real</p>
                            <span className="text-blue-600 font-black text-[11px] ml-2 tabular-nums">{currentTime.toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleOpenNew}
                    className="px-10 py-5 bg-[#2563eb] text-white rounded-[1.2rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-4 hover:bg-blue-700 transition-all"
                >
                    <Plus size={18} strokeWidth={4} /> Agendar Nueva Cita
                </button>
            </header>

            <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* SIDEBAR CALENDAR */}
                <aside className="lg:col-span-4 space-y-8">
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl space-y-8">
                        <div className="flex bg-[#f1f5f9] p-1.5 rounded-2xl border border-slate-200">
                            <button onClick={() => setFilterMode('single')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${filterMode === 'single' ? 'bg-white shadow-lg text-blue-600' : 'text-slate-400'}`}>Día Único</button>
                            <button onClick={() => setFilterMode('range')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${filterMode === 'range' ? 'bg-white shadow-lg text-blue-600' : 'text-slate-400'}`}>Rango Fechas</button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2 relative">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navegar Agenda</h3>
                                <button
                                    onClick={() => setShowDatePicker(!showDatePicker)}
                                    className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-blue-100 shadow-sm"
                                >
                                    {months[viewMonth]} DE {viewYear} <ChevronDown size={14} strokeWidth={3} />
                                </button>

                                {showDatePicker && (
                                    <div className="absolute top-full right-0 mt-3 w-72 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 p-6 animate-in fade-in zoom-in-95 backdrop-blur-xl">
                                        <div className="grid grid-cols-3 gap-2 mb-6 pb-6 border-b border-slate-50">
                                            {[2024, 2025, 2026, 2027].map(y => (
                                                <button key={y} onClick={() => setViewYear(y)} className={`py-2 rounded-xl text-[10px] font-black ${viewYear === y ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>{y}</button>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {months.map((m, idx) => (
                                                <button key={m} onClick={() => { setViewMonth(idx); setShowDatePicker(false); }} className={`py-2 rounded-xl text-[8.5px] font-black ${viewMonth === idx ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{m.substring(0, 3)}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-7 gap-3">
                                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="text-[10px] font-black text-slate-300 text-center uppercase">{d}</div>)}
                                {Array.from({ length: getDaysInMonth(viewYear, viewMonth) }).map((_, i) => {
                                    const day = i + 1;
                                    const dateStr = `${viewYear}-${(viewMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                    const count = appointmentCounts[dateStr] || 0;

                                    const isSelected = filterMode === 'single'
                                        ? selectedDate === dateStr
                                        : (startDate === dateStr || endDate === dateStr);

                                    const isInRange = filterMode === 'range' && startDate && endDate && (() => {
                                        const [s, e] = [startDate, endDate].sort();
                                        return dateStr > s && dateStr < e;
                                    })();

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handleDayClick(dateStr)}
                                            className={`aspect-[1/1.2] flex flex-col items-center justify-center rounded-2xl transition-all border ${isSelected
                                                    ? 'bg-[#2563eb] border-blue-600 text-white shadow-xl shadow-blue-100 scale-105 z-10'
                                                    : isInRange
                                                        ? 'bg-blue-50 border-blue-100 text-blue-700'
                                                        : 'bg-white border-transparent text-slate-700 hover:bg-slate-50'
                                                }`}
                                        >
                                            <span className="text-[14px] font-black leading-none">{day}</span>
                                            <span className={`text-[7px] font-black uppercase mt-1 ${isSelected ? 'text-white/60' : (count > 0 ? 'text-blue-500' : 'text-slate-300')}`}>
                                                {count > 0 ? `${count} CITAS` : 'VACÍO'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50">
                            <div className="flex justify-between items-end px-2">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{filterMode === 'single' ? 'Total en Vista' : 'Citas en Rango'}</p>
                                    <p className="text-2xl font-black text-[#0f172a] mt-2">{filteredAppointments.length} Citas</p>
                                </div>
                                <Activity size={24} className="text-blue-200" />
                            </div>
                        </div>
                    </div>
                </aside>

                {/* MAIN LISTING */}
                <main className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
                        <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/20 backdrop-blur-sm sticky top-0 z-20">
                            <div>
                                <h2 className="text-xl font-black text-[#0f172a] uppercase tracking-tighter">
                                    {filterMode === 'single'
                                        ? `Citas del Día – ${selectedDate.split('-').reverse().join('/')}`
                                        : `Citas del Rango – ${startDate?.split('-').reverse().join('/')} ${endDate ? `al ${endDate.split('-').reverse().join('/')}` : '(Seleccionando fin...)'}`}
                                </h2>
                            </div>
                            <div className="flex items-center gap-4">
                                {isSearchVisible && (
                                    <input
                                        autoFocus
                                        type="text"
                                        className="bg-white border border-slate-200 px-5 py-3 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner w-56 animate-in slide-in-from-right-2"
                                        placeholder="BUSCAR PACIENTE..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                )}
                                <button
                                    onClick={() => setIsSearchVisible(!isSearchVisible)}
                                    className={`w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all ${isSearchVisible ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-400 hover:text-blue-600'}`}
                                >
                                    <Lupa size={20} />
                                </button>
                                <div className="bg-[#2563eb] text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100">{filteredAppointments.length} REGISTROS</div>
                            </div>
                        </div>

                        <div className="p-10 space-y-12 flex-1">
                            {filteredAppointments.length > 0 ? filteredAppointments.map((app, idx) => (
                                <div key={idx} className="flex gap-8 items-start group">
                                    {/* TIME AND STATUS COLUMN */}
                                    <div className="w-32 text-center pt-4 shrink-0 space-y-4">
                                        <p className="text-3xl font-black text-[#0f172a] tracking-tighter leading-none">{app.time}</p>
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{app.date.split('-').reverse().join('/')}</p>

                                        <div className="px-1">{getStatusDropdown(app)}</div>
                                    </div>

                                    {/* MAIN APPOINTMENT CARD (FULL WIDTH) */}
                                    <div className="flex-1 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all flex flex-col hover:shadow-2xl hover:border-blue-100 relative overflow-hidden group/card">
                                        {/* HEADER ROW: Patient + Doctor + History button */}
                                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50/50">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-[1.2rem] bg-[#f8fafc] text-slate-200 flex items-center justify-center font-black text-xl border border-slate-50 group-hover/card:bg-blue-600 group-hover/card:text-white transition-all shadow-inner shrink-0 uppercase">
                                                    {app.patientName.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight leading-none mb-2">{app.patientName}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase size={12} className="text-blue-500" />
                                                        <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">{app.doctorName || 'Dr. Alejandro Gómez'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => navigate(`/dashboard/medical-records/${app.patientId}`)}
                                                    className="px-8 py-4 bg-[#0f172a] text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center gap-3 hover:bg-black hover:-translate-y-1 transition-all"
                                                >
                                                    <FileText size={18} /> Historia Clínica
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEdit(app)}
                                                    className="w-12 h-12 flex items-center justify-center bg-[#f8fafc] text-slate-300 hover:text-blue-600 rounded-[1.2rem] transition-all shadow-sm border border-slate-50"
                                                >
                                                    <Edit2 size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* CONTENT ROW: Reason & Specialty (Full width) */}
                                        <div className="w-full p-8 bg-[#f8fafc] rounded-[2rem] border border-slate-50 group-hover/card:bg-white transition-all shadow-inner space-y-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-lg border border-blue-100 uppercase tracking-widest">
                                                    {/* Mock specialty if missing */}
                                                    {(app as any).specialty || 'DERMATOLOGÍA GENERAL'}
                                                </span>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-200 rounded-full group-hover/card:bg-blue-600 transition-colors" />
                                                <p className="pl-6 text-[14px] font-bold text-[#1e293b] uppercase leading-relaxed tracking-tight">
                                                    {app.reason || app.notes || 'S/ Motivo especificado'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-40 opacity-20">
                                    <CalendarIcon size={64} className="text-slate-300" />
                                    <p className="text-xl font-black uppercase tracking-[0.4em]">Sin registros agendados</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* MODAL DE GESTIÓN DE CITA (EDICIÓN Y NOTIFICACIONES) */}
            {isEditModalOpen && editingAppointment && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[1000] flex items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-5xl h-fit max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
                        <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.8rem] flex items-center justify-center shadow-xl">
                                    <Edit2 size={30} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Gestionar Cita</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                                        {editingAppointment.patientName} • {editingAppointment.date}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 grid grid-cols-1 md:grid-cols-12 gap-12 custom-scrollbar">
                            <div className="md:col-span-8 space-y-10">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora de Cita</label>
                                        <input type="time" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all" value={editingAppointment.time} onChange={e => setEditingAppointment({ ...editingAppointment, time: e.target.value })} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado de Cita</label>
                                        <select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:bg-white transition-all" value={editingAppointment.status} onChange={e => setEditingAppointment({ ...editingAppointment, status: e.target.value as any })}>
                                            <option value="PENDING">PENDIENTE</option>
                                            <option value="CONFIRMED">CONFIRMADA</option>
                                            <option value="COMPLETED">ATENDIDO</option>
                                            <option value="RESCHEDULED">REPROGRAMADA</option>
                                            <option value="CANCELLED">CANCELADA</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo de Consulta / Procedimiento</label>
                                    <textarea rows={4} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-black uppercase outline-none focus:bg-white transition-all resize-none" value={editingAppointment.reason || editingAppointment.notes} onChange={e => setEditingAppointment({ ...editingAppointment, reason: e.target.value })} placeholder="DESCRIBA EL MOTIVO O TRATAMIENTO..." />
                                </div>
                            </div>
                        </div>

                        <div className="p-10 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <button onClick={handleSaveEdit} className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center gap-4">
                                <Save size={20} /> Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: AGENDAR NUEVA CITA */}
            {isNewModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[1000] flex items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-4xl h-fit max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
                        <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-[#2563eb] text-white rounded-[1.8rem] flex items-center justify-center shadow-xl">
                                    <Plus size={30} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Agendar Nueva Cita</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Programación de servicios y especialistas</p>
                                </div>
                            </div>
                            <button onClick={() => setIsNewModalOpen(false)} className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar Paciente (Nombre o DNI)</label>
                                <div className="relative">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    <input
                                        type="text"
                                        placeholder="ESCRIBA PARA BUSCAR..."
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all"
                                        value={patientSearch}
                                        onChange={e => setPatientSearch(e.target.value)}
                                    />

                                    {patientSearch && !newAppForm.patientId && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-60 overflow-y-auto">
                                            {filteredPatientResults.length > 0 ? filteredPatientResults.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => {
                                                        setNewAppForm({ ...newAppForm, patientId: p.id });
                                                        setPatientSearch(p.name);
                                                    }}
                                                    className="w-full p-6 flex items-center gap-4 hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0"
                                                >
                                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black text-xs uppercase">{(p.name.split(' ')[0] || '')[0] || 'P'}</div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-black text-slate-800 uppercase leading-none mb-1">{p.name}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">DNI {p.dni || p.internalId || 'S/D'} • ID: {p.id}</p>
                                                    </div>
                                                </button>
                                            )) : (
                                                <div className="p-10 text-center opacity-30">
                                                    <p className="text-xs font-black uppercase tracking-widest">No se encontraron pacientes</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {newAppForm.patientId && (
                                        <div className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-2">
                                            <CheckCircle2 size={14} /> Paciente seleccionado: {patients.find(p => p.id === newAppForm.patientId)?.name}
                                            <button onClick={() => { setNewAppForm({ ...newAppForm, patientId: '' }); setPatientSearch(''); }} className="text-slate-400 hover:text-rose-500"><X size={14} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Cita</label>
                                    <input type="date" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none focus:bg-white transition-all" value={newAppForm.date} onChange={e => setNewAppForm({ ...newAppForm, date: e.target.value })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora Estimada</label>
                                    <input type="time" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none focus:bg-white transition-all" value={newAppForm.time} onChange={e => setNewAppForm({ ...newAppForm, time: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidad</label>
                                    <select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:bg-white transition-all" value={newAppForm.specialty} onChange={e => setNewAppForm({ ...newAppForm, specialty: e.target.value })}>
                                        {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asignar Especialista</label>
                                    <select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:bg-white transition-all" value={newAppForm.doctorId} onChange={e => setNewAppForm({ ...newAppForm, doctorId: e.target.value })}>
                                        {DOCTORS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo de Consulta</label>
                                <textarea rows={3} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-black uppercase outline-none focus:bg-white transition-all resize-none" value={newAppForm.reason} onChange={e => setNewAppForm({ ...newAppForm, reason: e.target.value })} placeholder="DESCRIBA EL PROCEDIMIENTO O MOTIVO..." />
                            </div>
                        </div>

                        <div className="p-10 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <button onClick={() => setIsNewModalOpen(false)} className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-900 transition-all">Cancelar</button>
                            <button onClick={handleSaveNew} className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center gap-4">
                                <Check size={20} /> Confirmar Agendamiento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
