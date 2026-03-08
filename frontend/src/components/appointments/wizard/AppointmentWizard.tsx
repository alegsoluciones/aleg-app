import React, { useState, useEffect } from 'react';
import {
    X, Search, UserPlus, ChevronRight, Fingerprint, ExternalLink, ArrowRight,
    UserCheck, Clock, Tag, Save, Send, BellRing, RefreshCw, Plus
} from 'lucide-react';
import type { Appointment, AppointmentStatus, Patient, User } from '../../../types';
// import { AppointmentStatus as AppointmentStatusEnum } from '../../../types'; // Removed unused
import { PatientsService } from '../../../services/PatientsService';
import { UsersService } from '../../../services/UsersService';
import { AppointmentsService } from '../../../services/AppointmentsService';
import { useNavigate } from 'react-router-dom';

const INSURANCES = ['PARTICULAR', 'PACÍFICO', 'RÍMAC', 'MAPFRE', 'SANITAS', 'LA POSITIVA'];
const SPECIALTIES = ['DERMATOLOGÍA CLÍNICA', 'ESTÉTICA AVANZADA', 'CIRUGÍA MENOR', 'PEDIATRÍA', 'CONSULTA GENERAL'];

interface AppointmentWizardProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: string;
    onSuccess: () => void;
    initialAppointment?: Appointment | null;
}

export const AppointmentWizard: React.FC<AppointmentWizardProps> = ({
    isOpen, onClose, selectedDate, onSuccess, initialAppointment
}) => {
    const navigate = useNavigate();
    const [bookingStep, setBookingStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<User[]>([]);
    // const [isNotificationLogOpen, setIsNotificationLogOpen] = useState(false); // Unused

    // Form Data
    const [newPatientData, setNewPatientData] = useState<Partial<Patient>>({
        firstName: '', lastName: '', dni: '', ruc: '', phone: '', email: '', address: '', insurance: 'PARTICULAR', birthDate: '1990-01-01'
    });

    const [newApp, setNewApp] = useState<Partial<Appointment & { specialty: string }>>({
        date: selectedDate,
        status: 'PENDING',
        type: 'CONSULTA',
        time: '',
        doctorId: '',
        doctorName: '',
        reason: '',
        specialty: SPECIALTIES[0]
    });

    // Load Doctors
    useEffect(() => {
        if (isOpen) {
            UsersService.findAllByRole('DOCTOR').then(setDoctors);
            setNewApp(prev => ({ ...prev, date: selectedDate }));
            if (initialAppointment) {
                setNewApp({ ...initialAppointment, specialty: SPECIALTIES[0] });
                PatientsService.getById(initialAppointment.patientId).then(p => {
                    if (p) setNewPatientData(p);
                });
                setBookingStep(3);
            } else {
                setBookingStep(1);
                setNewApp(prev => ({ ...prev, date: selectedDate, doctorId: doctors[0]?.id, doctorName: doctors[0]?.name }));
            }
        }
    }, [isOpen, selectedDate, initialAppointment]);

    // Search Patients Debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length > 2) {
                const results = await PatientsService.search(searchTerm);
                setFilteredPatients(results);
            } else {
                setFilteredPatients([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleBooking = async () => {
        setBookingStep(4);

        // 1. Create/Update Patient if needed (Logic simplified, assuming backend handles duplication or explicit create step used)
        let patientId = newApp.patientId;

        if (!patientId && newPatientData.firstName) {
            // Create new patient
            try {
                const createdPatient = await PatientsService.create(newPatientData);
                patientId = createdPatient.id;
            } catch (error) {
                console.error("Error creating patient", error);
                alert("Error creando paciente");
                setBookingStep(2);
                return;
            }
        }

        // 2. Create Appointment
        try {
            const appointmentData = {
                ...newApp,
                patientId: patientId,
                status: 'CONFIRMED' as AppointmentStatus, // Fixed: use string literal
                // Add other necessary fields
            };

            if (initialAppointment) {
                // Update
                await AppointmentsService.update(initialAppointment.id, appointmentData);
            } else {
                // Create
                await AppointmentsService.create(appointmentData);
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error creating appointment", error);
            alert("Error al agendar cita");
            setBookingStep(3);
        }
    };

    // Removed unused handleSendManualReminder

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#0f172a]/70 backdrop-blur-xl z-[5000] flex items-center justify-center p-4">
            <div className={`bg-white rounded-[3rem] w-full ${bookingStep === 3 ? 'max-w-7xl' : 'max-w-2xl'} overflow-hidden shadow-2xl transition-all flex flex-col max-h-[95vh] border border-slate-100`}>

                {/* HEADER */}
                <div className="p-8 pb-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                            {initialAppointment ? <RefreshCw size={28} /> : <Plus size={32} strokeWidth={4} />}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{initialAppointment ? 'Modificación de Cita' : 'Registro de Nueva Cita'}</h3>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-[0.3em]">PROCESO {bookingStep} / 3</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3].map(s => <div key={s} className={`h-1.5 w-10 rounded-full transition-all duration-300 ${bookingStep >= s ? 'bg-blue-600' : 'bg-slate-100'}`} />)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100"><X size={28} /></button>
                </div>

                <div className="px-10 pb-10 overflow-hidden flex-1 flex flex-col min-h-0">

                    {/* STEP 1: PATIENT SEARCH */}
                    {bookingStep === 1 && (
                        <div className="space-y-8 py-4 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={24} />
                                <input type="text" placeholder="BUSCAR PACIENTE POR NOMBRE O DOCUMENTO..." className="w-full pl-16 pr-8 py-8 bg-slate-50 border border-slate-100 rounded-[2rem] text-[18px] font-black text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all uppercase placeholder:text-slate-300 shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
                            </div>
                            <div className="space-y-3">
                                {filteredPatients.slice(0, 4).map(p => (
                                    <button key={p.id} onClick={() => { setNewApp({ ...newApp, patientId: p.id, patientName: `${p.firstName} ${p.lastName}` }); setNewPatientData(p); setBookingStep(2); }} className="w-full p-6 flex items-center justify-between bg-white border border-slate-100 rounded-[2rem] hover:border-blue-500 hover:shadow-xl transition-all group">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-sm uppercase border border-blue-50 shadow-sm">{p.firstName[0]}</div>
                                            <div className="text-left">
                                                <p className="text-base font-black text-slate-900 uppercase leading-none">{p.firstName} {p.lastName}</p>
                                                <p className="text-xs text-slate-400 font-bold uppercase mt-2 tracking-widest">DNI: {p.dni}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={28} />
                                    </button>
                                ))}
                                <button onClick={() => { setNewPatientData({ firstName: '', lastName: '', dni: '', ruc: '', phone: '', email: '', address: '', insurance: 'PARTICULAR', birthDate: '1990-01-01' }); setBookingStep(2); }} className="w-full py-10 mt-6 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex items-center justify-center gap-5 text-slate-400 hover:border-blue-400 hover:bg-blue-50/20 hover:text-blue-600 transition-all font-black text-sm uppercase tracking-[0.2em] shadow-sm"><UserPlus size={28} /> CREAR NUEVA FICHA DIGITAL</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: PATIENT DATA */}
                    {bookingStep === 2 && (
                        <div className="space-y-10 py-6 animate-in slide-in-from-right-10 duration-500 overflow-y-auto no-scrollbar">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-4">
                                    <Fingerprint size={24} className="text-blue-600" />
                                    <h4 className="text-base font-black text-slate-400 uppercase tracking-widest">Identidad del Paciente</h4>
                                </div>
                                {newApp.patientId && (
                                    <button onClick={() => navigate(`/patients/${newApp.patientId}`)} className="text-sm font-black text-blue-600 flex items-center gap-2 hover:underline"><ExternalLink size={18} /> Ver Ficha Completa</button>
                                )}
                            </div>
                            <div className="bg-slate-50/50 p-12 rounded-[3rem] border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
                                <div className="flex flex-col border-b border-slate-200/50 pb-4">
                                    <span className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Nombres</span>
                                    <input className="bg-transparent text-[17px] font-black text-slate-800 uppercase outline-none focus:text-blue-600 transition-colors" value={newPatientData.firstName} onChange={e => setNewPatientData({ ...newPatientData, firstName: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="flex flex-col border-b border-slate-200/50 pb-4">
                                    <span className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Apellidos</span>
                                    <input className="bg-transparent text-[17px] font-black text-slate-800 uppercase outline-none focus:text-blue-600 transition-colors" value={newPatientData.lastName} onChange={e => setNewPatientData({ ...newPatientData, lastName: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="flex flex-col border-b border-slate-200/50 pb-4">
                                    <span className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Nacimiento</span>
                                    <input type="date" className="bg-transparent text-[17px] font-black text-slate-800 outline-none" value={newPatientData.birthDate} onChange={e => setNewPatientData({ ...newPatientData, birthDate: e.target.value })} />
                                </div>
                                <div className="flex flex-col border-b border-slate-200/50 pb-4">
                                    <span className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">DNI / Pasaporte</span>
                                    <input className="bg-transparent text-[17px] font-black text-slate-800 outline-none" value={newPatientData.dni} onChange={e => setNewPatientData({ ...newPatientData, dni: e.target.value })} />
                                </div>
                                <div className="flex flex-col border-b border-slate-200/50 pb-4">
                                    <span className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Móvil Notificable</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[17px] font-black text-slate-400">+51</span>
                                        <input className="flex-1 bg-transparent text-[17px] font-black text-slate-800 outline-none" value={newPatientData.phone} onChange={e => setNewPatientData({ ...newPatientData, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex flex-col border-b border-slate-200/50 pb-4">
                                    <span className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Correo Electrónico</span>
                                    <input className="bg-transparent text-[17px] font-black text-slate-800 outline-none" value={newPatientData.email} onChange={e => setNewPatientData({ ...newPatientData, email: e.target.value })} />
                                </div>
                                <div className="flex flex-col md:col-span-2 pt-4">
                                    <span className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Seguro EPS / Aseguradora</span>
                                    <select className="w-full bg-transparent text-[17px] font-black text-slate-800 uppercase outline-none appearance-none cursor-pointer" value={newPatientData.insurance} onChange={e => setNewPatientData({ ...newPatientData, insurance: e.target.value })}>
                                        {INSURANCES.map(ins => <option key={ins} value={ins}>{ins}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="pt-8">
                                <button onClick={() => setBookingStep(3)} className="w-full py-7 bg-slate-900 text-white rounded-[2rem] font-black text-base uppercase tracking-[0.2em] flex items-center justify-center gap-5 shadow-2xl hover:bg-black transition-all">Siguiente: Datos de Atención <ArrowRight size={24} /></button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: APPOINTMENT DETAILS */}
                    {bookingStep === 3 && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-2 animate-in slide-in-from-right-10 duration-500 overflow-hidden flex-1">
                            {/* COLUMNA IZQUIERDA */}
                            <div className="lg:col-span-7 space-y-4 overflow-y-auto no-scrollbar pr-2 py-2">
                                <div className="space-y-3">
                                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 ml-1"><UserCheck size={18} className="text-blue-500" /> Especialista & Área</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative bg-slate-50 rounded-[1.2rem] border border-slate-100 p-3.5 hover:bg-white transition-all shadow-sm">
                                            <select className="w-full bg-transparent text-sm font-black text-slate-800 uppercase outline-none appearance-none cursor-pointer" value={newApp.doctorId} onChange={e => { const d = doctors.find(doc => String(doc.id) === e.target.value); setNewApp({ ...newApp, doctorId: d ? String(d.id) : '', doctorName: d?.name }); }}>
                                                <option value="">SELECCIONAR...</option>
                                                {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.fullName || doc.name || doc.email}</option>)}
                                            </select>
                                        </div>
                                        <div className="relative bg-slate-50 rounded-[1.2rem] border border-slate-100 p-3.5 hover:bg-white transition-all shadow-sm">
                                            <select className="w-full bg-transparent text-sm font-black text-slate-800 uppercase outline-none appearance-none cursor-pointer" value={newApp.specialty} onChange={e => setNewApp({ ...newApp, specialty: e.target.value })}>
                                                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 ml-1"><Clock size={18} className="text-blue-500" /> Horario de Atención</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 rounded-[1.2rem] border border-slate-100 p-3.5 shadow-sm">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Fecha Programada</p>
                                            <input type="date" className="w-full bg-transparent text-sm font-black text-slate-800 outline-none" value={newApp.date} onChange={e => setNewApp({ ...newApp, date: e.target.value })} />
                                        </div>
                                        <div className="bg-slate-50 rounded-[1.2rem] border border-slate-100 p-3.5 shadow-sm">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Hora de Inicio</p>
                                            <select className="w-full bg-transparent text-sm font-black text-slate-800 uppercase outline-none appearance-none cursor-pointer" value={newApp.time} onChange={e => setNewApp({ ...newApp, time: e.target.value })}>
                                                <option value="">SELECCIONAR...</option>
                                                {['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 ml-1"><Tag size={18} className="text-blue-500" /> Motivo de la Consulta</label>
                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner focus-within:bg-white focus-within:border-blue-500 transition-all">
                                        <textarea className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none resize-none uppercase h-24 placeholder:text-slate-300" placeholder="DESCRIBA BREVEMENTE LA NECESIDAD DEL PACIENTE..." value={newApp.reason} onChange={e => setNewApp({ ...newApp, reason: e.target.value })} />
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-4">
                                    <button onClick={() => setBookingStep(2)} className="px-8 py-5 bg-slate-100 text-slate-600 rounded-[1.2rem] font-black text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-200 transition-all">Ver datos paciente</button>
                                    <button onClick={handleBooking} disabled={!newApp.time || !newApp.doctorId} className="flex-1 py-5 bg-blue-600 text-white rounded-[1.2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 disabled:opacity-50">
                                        {initialAppointment ? <><Save size={20} /> Guardar</> : <><Send size={20} /> Confirmar & Notificar</>}
                                    </button>
                                </div>
                            </div>

                            {/* COLUMNA DERECHA - NOTIFICACIONES */}
                            <div className="lg:col-span-5 flex flex-col h-full overflow-y-auto custom-scrollbar space-y-6 pr-2 py-2">
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg space-y-6 shrink-0">
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-3"><BellRing size={20} className="text-blue-600" /> Notificaciones</h4>

                                    <div className="space-y-4">
                                        {/* WhatsApp */}
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-600 uppercase">WhatsApp</span>
                                            <button
                                                onClick={() => setNewApp(prev => ({ ...prev, notifiedWhatsApp: !prev.notifiedWhatsApp }))}
                                                className={`w-10 h-5 rounded-full p-1 transition-all ${newApp.notifiedWhatsApp ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                            >
                                                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${newApp.notifiedWhatsApp ? 'translate-x-5' : ''}`} />
                                            </button>
                                        </div>

                                        {/* Email */}
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-600 uppercase">Email</span>
                                            <button
                                                onClick={() => setNewApp(prev => ({ ...prev, notifiedEmail: !prev.notifiedEmail }))}
                                                className={`w-10 h-5 rounded-full p-1 transition-all ${newApp.notifiedEmail ? 'bg-blue-500' : 'bg-slate-200'}`}
                                            >
                                                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${newApp.notifiedEmail ? 'translate-x-5' : ''}`} />
                                            </button>
                                        </div>

                                        {/* Phone */}
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-600 uppercase">Llamada</span>
                                            <button
                                                onClick={() => setNewApp(prev => ({ ...prev, notifiedPhone: !prev.notifiedPhone }))}
                                                className={`w-10 h-5 rounded-full p-1 transition-all ${newApp.notifiedPhone ? 'bg-indigo-500' : 'bg-slate-200'}`}
                                            >
                                                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${newApp.notifiedPhone ? 'translate-x-5' : ''}`} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <p className="text-[9px] text-blue-600 font-bold leading-relaxed text-center">
                                            El sistema enviará las notificaciones seleccionadas al confirmar o guardar la cita.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: LOADING */}
                    {bookingStep === 4 && (
                        <div className="py-24 flex flex-col items-center justify-center text-center space-y-12">
                            <div className="w-24 h-24 border-[8px] border-slate-50 border-t-blue-600 rounded-full animate-spin shadow-inner" />
                            <div>
                                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Sincronizando Agenda ALEO</h4>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-4 italic">ACTUALIZANDO BUFFER DE COMUNICACIONES...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
