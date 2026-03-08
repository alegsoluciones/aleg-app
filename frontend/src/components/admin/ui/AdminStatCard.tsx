import React from 'react';
// import { LucideIcon } from 'lucide-react'; // Unused

interface AdminStatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    bg: string;
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({ label, value, icon, color, bg }) => {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-4">
            <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <h4 className="text-3xl font-black text-slate-900 tracking-tighter mt-1">{value}</h4>
            </div>
        </div>
    );
};
