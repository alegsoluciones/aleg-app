import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ModulePlaceholderProps {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    color?: string;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
    title,
    subtitle = "Módulo Activo. Panel en construcción.",
    icon: Icon,
    color = "text-blue-500"
}) => {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
            <div className={`p-6 rounded-full bg-white shadow-xl mb-6 ${color.replace('text-', 'bg-').replace('500', '100')}`}>
                <Icon size={64} className={color} strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">{title}</h1>
            <p className="text-slate-500 text-lg max-w-md">{subtitle}</p>
            <div className="mt-8 px-4 py-2 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full uppercase tracking-widest border border-yellow-200">
                🚧 Work In Progress
            </div>
        </div>
    );
};
