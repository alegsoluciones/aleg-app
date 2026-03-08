import React, { useState, useEffect } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { DynamicField } from './dynamic/DynamicField'; // 👈 Import Dynamic
// import { EditableField } from './EditableField'; // Removed

interface SectionEditorProps {
    id: string;
    title: string;
    data: any;
    onSave: (data: any) => void;
    icon: React.ReactNode;
    colorClass: string;
    fieldsConfig?: any; // To maintain compatibility or we can change this type
    globalEditing: string | null;
    setGlobalEditing: (id: string | null) => void;
    className?: string;
    // New: Allow passing full schema from config
    dynamicSchema?: Record<string, any>; // Should be FieldConfig
}

export const SectionEditor: React.FC<SectionEditorProps> = ({
    id, title, data, onSave, icon, colorClass, fieldsConfig = {}, globalEditing, setGlobalEditing, className, dynamicSchema
}) => {
    const isEditing = globalEditing === id;
    const isBlocked = globalEditing !== null && globalEditing !== id;
    const [formData, setFormData] = useState(data || {});

    // If dynamicSchema is provided, use its keys. Otherwise use data keys (legacy fallback)
    const activeKeys = dynamicSchema ? Object.keys(dynamicSchema) : Object.keys(data || {});

    useEffect(() => { if (!isEditing) setFormData(data || {}); }, [data, isEditing]);

    const startEditing = () => {
        if (globalEditing) return;
        setFormData(data || {});
        setGlobalEditing(id);
    };

    const cancelEditing = () => {
        setGlobalEditing(null);
        setFormData(data || {});
    };

    const handleChange = (key: string, val: string) => {
        // Uppercase logic moved to DynamicField? Or keep here?
        // DynamicField handles UI uppercase. We just save.
        setFormData((prev: any) => ({ ...prev, [key]: val }));
    };

    const handleSave = () => {
        onSave(formData);
        setGlobalEditing(null);
    };

    const renderContent = (key: string, val: any) => {
        // Custom logic for badges?
        if (dynamicSchema && dynamicSchema[key]?.type === 'badge') {
            if (!val) return '---';
            const items = Array.isArray(val) ? val : val.split(',').filter(Boolean);
            return (
                <div className="flex flex-wrap gap-1 mt-1">
                    {items.map((it: any, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-black uppercase tracking-wide border border-slate-200">{it}</span>
                    ))}
                </div>
            );
        }

        if (!val) return '---';
        const strVal = val.toString();

        // Basic list detection
        const items = strVal.split(/[,|\n]/).map((s: string) => s.trim()).filter((s: string) => s !== '');
        if (items.length > 0 && items.length <= 5 && !dynamicSchema) { // Only for legacy list view
            // ... existing list render ...
        }

        return <div className="text-[11px] font-bold text-slate-700 uppercase break-words leading-snug whitespace-pre-wrap mt-2">{strVal}</div>;
    };

    // Helper to merge config
    const getConfig = (key: string) => {
        if (dynamicSchema && dynamicSchema[key]) return dynamicSchema[key];
        // Legacy fallback
        const leg = fieldsConfig[key] || {};
        return {
            type: leg.multiline ? 'textarea' : 'text',
            label: formatLabel(key),
            uppercase: leg.uppercase
        };
    };

    if (!data && !dynamicSchema) return null; // No data and no schema... nothing to show.
    // However, if we have schema, we might want to show empty fields to EDIT.

    return (
        <div className={`mb-4 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all duration-300 ${isEditing ? 'ring-2 ring-blue-100 shadow-md z-10 relative' : ''} ${isBlocked ? 'opacity-50 grayscale-[30%]' : 'opacity-100'} ${className}`}>
            <div className={`px-6 py-4 flex justify-between items-center border-b border-slate-100 ${colorClass}`}>
                <div className="flex items-center gap-3 text-sm">{icon} <span className="font-black uppercase tracking-widest">{title}</span></div>
                {!isEditing ? (
                    <button onClick={startEditing} className={`transition ${isBlocked ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600'}`}><Edit2 size={16} /></button>
                ) : (
                    <div className="flex gap-3">
                        <button onClick={cancelEditing} className="text-slate-400 hover:text-red-500 transition" title="Cancelar (Esc)"><X size={18} /></button>
                        <button onClick={handleSave} className="text-emerald-600 hover:text-emerald-700 transition" title="Guardar"><Save size={18} /></button>
                    </div>
                )}
            </div>

            <div className={`p-8 flex flex-col gap-8 ${!isEditing ? 'md:grid md:grid-cols-2 lg:grid-cols-4' : ''}`}>
                {activeKeys.map((k) => {
                    const config = getConfig(k);
                    // Determine colSpan based on validation or type
                    const isWide = config.type === 'textarea' || config.colSpan === 2;

                    return (
                        <div key={k} className={`flex flex-col gap-2 ${isWide && !isEditing ? 'col-span-2' : ''}`}>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{config.label || formatLabel(k)}</label>
                            <div className="w-full">
                                {isEditing ? (
                                    <DynamicField
                                        config={config}
                                        value={formData[k]}
                                        onChange={(val) => handleChange(k, val)}
                                        placeholder={`Escriba ${config.label?.toLowerCase() || k}...`}
                                    />
                                ) : (
                                    renderContent(k, formData[k])
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const formatLabel = (key: string) => {
    const labels: Record<string, string> = {
        diagnostico: 'DIAGNÓSTICO PRINCIPAL',
        tratamiento: 'TRATAMIENTO SUGERIDO',
        tipo_piel: 'TIPO DE PIEL',
        aspecto: 'ASPECTO',
        color: 'COLOR',
        textura: 'TEXTURA',
        medicos: 'ANTECEDENTES MÉDICOS',
        alergicos: 'ALERGIAS',
        quirurgicos: 'QUIRÚRGICOS',
        medicamentos: 'MEDICACIÓN ACTUAL'
    };
    return labels[key] || key.replace(/_/g, ' ').toUpperCase();
};