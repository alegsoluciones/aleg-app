import { useEffect, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus, X, Stethoscope, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTenantConfig } from '../context/TenantContext';
import { useTerminology } from '../hooks/useTerminology';

const locales = {
    'es': es,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export const CalendarPage = () => {
    const { token } = useAuth();
    const { config } = useTenantConfig();
    const t = useTerminology();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const [events, setEvents] = useState<any[]>([]);
    const [view, setView] = useState<any>(Views.WEEK);
    const [date, setDate] = useState(new Date());
    const [isOpen, setIsOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    // Form State
    const [newEvent, setNewEvent] = useState({ title: '', start: new Date(), end: new Date(), type: 'CONSULTATION', notes: '' });

    // Fetch Events
    const fetchEvents = useCallback(async () => {
        try {
            // Simplified fetch: get current month roughly
            // Ideally use date range based on view/date
            const res = await fetch(`${API_URL}/appointments?start=${new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString()}&end=${new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).toISOString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const formatted = data.map((appt: any) => ({
                    id: appt.id,
                    title: appt.title || 'Cita',
                    start: new Date(appt.start),
                    end: new Date(appt.end),
                    resource: appt,
                }));
                setEvents(formatted);
            }
        } catch (e) {
            console.error(e);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchEvents();
    }, [token, fetchEvents]);

    // Handlers
    const handleSelectSlot = (slotInfo: any) => {
        setNewEvent({ ...newEvent, start: slotInfo.start, end: slotInfo.end, title: '' });
        setSelectedEvent(null);
        setIsOpen(true);
    };

    const handleSelectEvent = (event: any) => {
        setSelectedEvent(event);
        setIsOpen(true);
    };

    const handleCreate = async () => {
        try {
            // Mock Patient ID for now or need input
            // Ideally we select a patient here
            const res = await fetch(`${API_URL}/appointments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...newEvent,
                    // patientId: '...' // NEED PATIENT SELECTION logic
                })
            });
            if (res.ok) {
                setIsOpen(false);
                fetchEvents();
            } else {
                alert('No se pudo crear la cita. Verifique conflictos.');
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Styling
    const eventStyleGetter = () => {
        const brandingColor = (config as any)?.branding?.color || 'blue';
        // Map branding color name to hex or class (react-big-calendar needs style object)
        const colors: any = { 'blue': '#2563EB', 'indigo': '#4F46E5', 'rose': '#E11D48', 'emerald': '#059669' };
        const backgroundColor = colors[brandingColor] || '#2563EB';
        return {
            style: {
                backgroundColor,
                borderRadius: '8px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    return (
        <div className="p-6 h-full flex flex-col bg-slate-50 relative">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <Clock className="text-blue-600" /> Agenda Médica
                </h1>
                <button onClick={() => setIsOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-lg">
                    <Plus size={20} /> Nueva Cita
                </button>
            </div>

            <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 overflow-hidden text-sm">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={setDate}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
                    messages={{
                        next: "Sig",
                        previous: "Ant",
                        today: "Hoy",
                        month: "Mes",
                        week: "Semana",
                        day: "Día"
                    }}
                    culture='es'
                />
            </div>

            {/* MODAL */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition">
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                            {selectedEvent ? 'Detalle de Cita' : 'Nueva Cita'}
                        </h2>

                        {selectedEvent ? (
                            <div className="space-y-6">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="font-bold text-slate-700 text-lg mb-1">{selectedEvent.title}</p>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <Clock size={14} />
                                        {format(selectedEvent.start, 'PP p', { locale: es })}
                                    </div>
                                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide">
                                        {selectedEvent.resource.status}
                                    </div>
                                </div>
                                <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all">
                                    <Stethoscope size={18} /> Iniciar Consulta
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Título / {t.patient}</label>
                                    <input
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="Ej: Consulta General"
                                        value={newEvent.title}
                                        onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Inicio</label>
                                        <div className="p-3 bg-slate-50 rounded-xl font-mono text-sm border border-slate-200 text-slate-600">
                                            {format(newEvent.start, 'HH:mm')}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fin</label>
                                        <div className="p-3 bg-slate-50 rounded-xl font-mono text-sm border border-slate-200 text-slate-600">
                                            {format(newEvent.end, 'HH:mm')}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleCreate} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-lg mt-4">
                                    Agendar Cita
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
