import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, UserPlus, ChevronRight } from 'lucide-react';
import { usePatients } from '../../hooks/usePatients';
import { useAuth } from '../../context/AuthContext';
import { PatientDetailPage } from './PatientDetailPage';
import type { Patient } from '../../types';

export const ClinicalRecordsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { patients, loading } = usePatients();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    if (id) {
        return <PatientDetailPage />;
    }

    if (loading) return <div className="p-20 text-center font-black uppercase text-slate-300 tracking-widest">Cargando Directorio...</div>;

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.internalId && p.internalId.includes(searchTerm)) ||
        (p.dni && p.dni.includes(searchTerm))
    );

    // Helper to get initials and split name for UI
    const getPatientDisplay = (p: Patient) => {
        const parts = p.name.split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        return { firstName, lastName };
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-8 md:p-14 mb-20 bg-slate-50/50 min-h-screen">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Directorio de Pacientes</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Workspace clínico de {user?.tenant?.name || 'la empresa'}.</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard/patients/new')} // Assuming a new route or modal. Adjust as needed.
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                    <UserPlus size={16} /> Alta de Paciente
                </button>
            </header>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center bg-slate-50/20">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                            type="text"
                            placeholder="Nombre, Apellidos o DNI..."
                            className="w-full pl-12 pr-4 py-4 border border-slate-100 bg-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all text-xs font-bold uppercase tracking-widest"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50">
                                <th className="px-10 py-6">Paciente</th>
                                <th className="px-10 py-6">DNI / HC</th>
                                <th className="px-10 py-6">Último Análisis</th>
                                <th className="px-10 py-6">Estado</th>
                                <th className="px-10 py-6 text-right">Acceso</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredPatients.map(patient => {
                                const { firstName, lastName } = getPatientDisplay(patient);
                                const lastAnalysis = (patient.records && patient.records.length > 0)
                                    ? patient.records[0].title || 'VER REGISTROS'
                                    : 'SIN ANÁLISIS';

                                return (
                                    <tr key={patient.id} onClick={() => navigate(`/dashboard/medical-records/${patient.id}`)} className="hover:bg-blue-50/30 transition-all group cursor-pointer">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 text-blue-600 flex items-center justify-center font-black text-xs border border-slate-100 uppercase">
                                                    {(firstName[0] || '')}{(lastName[0] || '')}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{firstName} {lastName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-xs font-bold text-slate-500">{patient.dni || patient.internalId || 'S/D'}</td>
                                        <td className="px-10 py-6">
                                            <span className={`px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100 truncate max-w-[150px] block`}>
                                                {lastAnalysis}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="text-[9px] font-black text-emerald-600 uppercase">Activo</span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-all ml-auto" />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredPatients.length === 0 && (
                        <div className="p-10 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                            No se encontraron pacientes que coincidan con la búsqueda.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};