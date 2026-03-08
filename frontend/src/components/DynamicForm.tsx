

export interface FieldDefinition {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'textarea';
    options?: string[]; // For select
    placeholder?: string;
    required?: boolean;
}

interface DynamicFormProps {
    schema: FieldDefinition[];
    value: Record<string, any>;
    onChange: (newValue: Record<string, any>) => void;
    className?: string;
}

export const DynamicForm = ({ schema, value, onChange, className = '' }: DynamicFormProps) => {

    const handleChange = (key: string, val: any) => {
        onChange({ ...value, [key]: val });
    };

    if (!schema || schema.length === 0) return null;

    return (
        <div className={`grid grid-cols-1 gap-4 ${className}`}>
            {schema.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest pl-1">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>

                    {field.type === 'select' ? (
                        <select
                            className="bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all appearance-none"
                            value={value[field.key] || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                        >
                            <option value="">-- Seleccionar --</option>
                            {field.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    ) : field.type === 'textarea' ? (
                        <textarea
                            className="bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all resize-none h-24"
                            placeholder={field.placeholder || `Ingrese ${field.label.toLowerCase()}...`}
                            value={value[field.key] || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                        />
                    ) : (
                        <input
                            type={field.type}
                            className="bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                            placeholder={field.placeholder || `Ingrese ${field.label.toLowerCase()}...`}
                            value={value[field.key] || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};
