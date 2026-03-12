import React, { useState } from 'react';
import { Search, UserPlus, ChevronRight, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '../../types';
import { useTenantConfig } from '../../context/TenantContext';

interface PatientListTableProps {
    patients: Patient[];
}

export const PatientListTable: React.FC<PatientListTableProps> = ({ patients }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const { config } = useTenantConfig(); // Assuming this context provides tenant info

    const filteredPatients = patients.filter(p =>
        `${p.name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.internalId && p.internalId.includes(searchTerm))
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-8 md:p-14">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Directorio de Pacientes</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Workspace clínico de {config?.name || 'la empresa'}.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
                    <UserPlus size={16} /> Alta de Paciente
                </button>
            </header>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center bg-slate-50/20">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                            type="text"
                            placeholder="Nombre, Apellidos o ID Interno..."
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
                                <th className="px-10 py-6">ID Interno</th>
                                <th className="px-10 py-6">Última Visita</th>
                                <th className="px-10 py-6">Estado</th>
                                <th className="px-10 py-6 text-right">Acceso</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredPatients.map(patient => (
                                <tr key={patient.id} onClick={() => navigate(`/dashboard/patients/${patient.id}`)} className="hover:bg-blue-50/30 transition-all group cursor-pointer">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-blue-600 flex items-center justify-center font-black text-xs border border-slate-100 uppercase">
                                                {patient.name.slice(0, 2)}
                                            </div>
                                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{patient.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-xs font-bold text-slate-500">{patient.internalId || 'N/A'}</td>
                                    <td className="px-10 py-6">
                                        <span className={`px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1 w-fit`}>
                                            <History size={10} /> {patient.records?.[0]?.date || 'SIN VISITAS'}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-[9px] font-black text-emerald-600 uppercase">{patient.status || 'Activo'}</td>
                                    <td className="px-10 py-6 text-right">
                                        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-all ml-auto" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
