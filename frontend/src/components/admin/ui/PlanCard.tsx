import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface PlanCardProps {
    name: string;
    price: number;
    billingCycle: string;
    features: string[];
    rubric?: string;
    isActive?: boolean;
    onSelect?: () => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ name, price, billingCycle, features, rubric, isActive, onSelect }) => {
    return (
        <button
            onClick={onSelect}
            className={`flex flex-col text-left p-8 rounded-[3rem] border-2 transition-all relative w-full ${isActive ? 'bg-white border-blue-600 shadow-2xl scale-105' : 'bg-slate-50 border-transparent opacity-60 hover:opacity-100'
                }`}
        >
            {isActive && <div className="absolute top-6 right-6 text-blue-600"><CheckCircle2 size={24} /></div>}
            {rubric && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{rubric}</p>}
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">{billingCycle === 'MONTHLY' ? 'Suscripción Mensual' : 'Suscripción Anual'}</p>
            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">{name}</h4>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">${price}<span className="text-xs text-slate-400">/{billingCycle === 'MONTHLY' ? 'mes' : 'año'}</span></p>
            <div className="mt-8 space-y-3 flex-1">
                {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> {feature}
                    </div>
                ))}
            </div>
        </button>
    );
};
