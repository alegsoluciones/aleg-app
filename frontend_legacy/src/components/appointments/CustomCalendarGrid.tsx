import React, { useMemo } from 'react';
import type { Appointment } from '../../types';

interface CustomCalendarGridProps {
    currentDate: string;
    appointments: Appointment[];
    onDateSelect: (date: string) => void;
    onRangeSelect?: (startDate: string, endDate: string) => void;
}

export const CustomCalendarGrid: React.FC<CustomCalendarGridProps> = ({
    currentDate, appointments, onDateSelect, onRangeSelect
}) => {
    const [viewMode, setViewMode] = React.useState<'day' | 'range'>('day');
    const [rangeStart, setRangeStart] = React.useState('');
    const [rangeEnd, setRangeEnd] = React.useState('');

    const daysInMonth = 31; // Simplificado para el ejemplo, deberÃ­a calcularse

    const appointmentCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        appointments.forEach(app => {
            counts[app.date] = (counts[app.date] || 0) + 1;
        });
        return counts;
    }, [appointments]);

    const handleApplyRange = () => {
        if (rangeStart && rangeEnd && onRangeSelect) {
            onRangeSelect(rangeStart, rangeEnd);
        }
    };

    return (
        <div className="space-y-6">
            {/* TABS NAVIGATION */}
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <button
                    onClick={() => setViewMode('day')}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Día Único
                </button>
                <button
                    onClick={() => setViewMode('range')}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'range' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Rango Fechas
                </button>
            </div>

            {/* VIEW CONTENT */}
            {viewMode === 'day' ? (
                <div className="grid grid-cols-7 gap-3 animate-in fade-in zoom-in duration-300">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="text-[10px] font-black text-slate-300 text-center">{d}</div>)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const day = dayNum.toString().padStart(2, '0');
                        // Asumiendo aÃ±o/mes fijos para el ejemplo o extrayendo de currentDate
                        const [year, month] = currentDate.split('-'); // Careful with currentDate format YYYY-MM-DD
                        // Fallback if currentDate is empty or invalid
                        const safeYear = year || new Date().getFullYear();
                        const safeMonth = month || (new Date().getMonth() + 1).toString().padStart(2, '0');

                        const dateStr = `${safeYear}-${safeMonth}-${day}`;

                        const count = appointmentCounts[dateStr] || 0;
                        const isSelected = currentDate === dateStr;

                        return (
                            <button key={i} onClick={() => onDateSelect(dateStr)} className={`relative aspect-[1/1.2] flex flex-col items-center justify-center rounded-2xl transition-all border-2 ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-100 scale-110' : 'bg-white border-slate-50 text-slate-700 hover:border-blue-200 shadow-sm'}`}>
                                <span className="text-[15px] font-black leading-none">{dayNum}</span>
                                <span className={`text-[7px] font-black uppercase mt-1.5 px-1 rounded transition-all ${isSelected ? 'bg-white/20 text-white' : (count > 0 ? 'text-blue-600' : 'text-slate-300')}`}>{count > 0 ? `${count} citas` : 'vacÃ­o'}</span>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Inicio</label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-black text-slate-700 outline-none focus:border-blue-500 transition-all uppercase"
                                value={rangeStart}
                                onChange={(e) => setRangeStart(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Final</label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-black text-slate-700 outline-none focus:border-blue-500 transition-all uppercase"
                                value={rangeEnd}
                                onChange={(e) => setRangeEnd(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleApplyRange}
                        disabled={!rangeStart || !rangeEnd}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                        Aplicar Filtro
                    </button>

                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <p className="text-[10px] text-blue-600 font-bold leading-relaxed text-center">
                            Se mostrarán todas las citas comprendidas entre las fechas seleccionadas.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
