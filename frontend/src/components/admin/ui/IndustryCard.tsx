import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

interface IndustryCardProps {
    name: string;
    description: string;
    icon: React.ReactNode;
    stats?: {
        modules: number;
        widgets: number;
        plans?: number;
    };
    onEdit?: () => void;
    onDelete?: () => void;
}

export const IndustryCard: React.FC<IndustryCardProps> = ({ name, description, icon, stats, onEdit, onDelete }) => {
    return (
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <div className="flex gap-2">
                    <button onClick={onEdit} className="p-2 bg-slate-50 text-slate-300 rounded-lg hover:text-blue-600 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={onDelete} className="p-2 bg-slate-50 text-slate-300 rounded-lg hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                </div>
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">{name}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 line-clamp-2">{description}</p>

            <div className="mt-8 pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-300 uppercase">Módulos</p>
                    <p className="text-sm font-black text-blue-600">{stats?.modules || 0}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-300 uppercase">Widgets</p>
                    <p className="text-sm font-black text-indigo-600">{stats?.widgets || 0}</p>
                </div>
                {stats?.plans !== undefined && (
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-300 uppercase">Planes</p>
                        <p className="text-sm font-black text-emerald-600">{stats.plans}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
