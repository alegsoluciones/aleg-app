import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

interface QuickActionCardProps {
    to?: string;
    onClick?: () => void;
    icon: ReactNode;
    label: string;
    value?: string | number;
    sub?: string;
    color: 'blue' | 'emerald' | 'amber' | 'slate' | 'rose' | 'indigo' | 'purple';
    className?: string;
}

export const QuickActionCard = ({ to, onClick, icon, label, value, sub, color, className = '' }: QuickActionCardProps) => {
    const content = (
        <>
            <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-${color}-50 flex items-center justify-center text-${color}-600 shadow-sm group-hover:bg-${color}-600 group-hover:text-white transition-all duration-300`}>
                    {icon}
                </div>
                {to && (
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                        <ArrowUpRight size={20} />
                    </div>
                )}
            </div>

            <div className="mt-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
                {(value || sub) && (
                    <div>
                        {value && <span className="text-4xl font-black text-slate-900 tracking-tighter block mb-1">{value}</span>}
                        {sub && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{sub}</span>}
                    </div>
                )}
            </div>
        </>
    );

    const baseClasses = `bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full relative overflow-hidden ${className}`;

    if (to) {
        return <Link to={to} className={baseClasses}>{content}</Link>;
    }

    return <div onClick={onClick} className={`${baseClasses} cursor-pointer`}>{content}</div>;
};
