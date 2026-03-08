import React from 'react';
import type { FieldConfig } from '../../types/config';

interface DynamicFieldProps {
    value: any;
    onChange: (val: any) => void;
    config: FieldConfig;
    placeholder?: string;
}

export const DynamicField: React.FC<DynamicFieldProps> = ({ value, onChange, config, placeholder }) => {

    // --- 1. BADGES (Antecedentes Selector) ---
    if (config.type === 'badge') {
        // value espera string separado por comas o array
        const currentItems = Array.isArray(value)
            ? value
            : (value || '').split(',').map((s: string) => s.trim()).filter(Boolean);

        const toggleItem = (item: string) => {
            const newItems = currentItems.includes(item)
                ? currentItems.filter((i: string) => i !== item)
                : [...currentItems, item];

            // Retornamos como string para mantener compatibilidad con BD simple
            onChange(newItems.join(', '));
        };

        return (
            <div className="flex flex-wrap gap-2">
                {config.options?.map((opt) => {
                    const isActive = currentItems.includes(opt);
                    return (
                        <button
                            key={opt}
                            onClick={() => toggleItem(opt)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all border outline-none
                                ${isActive
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-500'}`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        );
    }

    // --- 2. SELECT (Dropdown) ---
    if (config.type === 'select') {
        return (
            <div className="relative">
                <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold uppercase rounded-xl p-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer"
                >
                    <option value="">-- SELECCIONAR --</option>
                    {config.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                {/* Arrow Icon Mock */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</div>
            </div>
        );
    }

    // --- 3. TEXTAREA (Multiline) ---
    if (config.type === 'textarea') {
        return (
            <textarea
                value={value || ''}
                onChange={(e) => {
                    const val = config.uppercase ? e.target.value.toUpperCase() : e.target.value;
                    onChange(val);
                }}
                placeholder={placeholder}
                className="w-full bg-slate-50 border-2 border-slate-100 text-slate-700 text-xs font-bold uppercase rounded-xl p-3 outline-none focus:border-blue-400 focus:bg-white focus:ring-0 transition-all resize-none min-h-[100px]"
            />
        );
    }

    // --- 4. DEFAULT (Text Input) ---
    return (
        <input
            type="text"
            value={value || ''}
            onChange={(e) => {
                const val = config.uppercase ? e.target.value.toUpperCase() : e.target.value;
                onChange(val);
            }}
            placeholder={placeholder}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold uppercase rounded-xl p-3 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
        />
    );
};
