import React, { useEffect, useState } from 'react';
import { PlansService } from '../../services/PlansService';
import type { Plan } from '../../services/PlansService';
import { Plus, X, Edit2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PlanCard } from '../../components/admin/ui/PlanCard';
import { Modal } from '../../components/Modal';

export const PlansPage: React.FC = () => {
    const { user } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Plan>>({
        name: '',
        slug: '',
        price: '0.00',
        currency: 'USD',
        billingCycle: 'MONTHLY',
        features: [],
        isActive: true,
        rubric: 'CLINICAL' // Default rubric
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const [featureInput, setFeatureInput] = useState('');

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            const data = user?.role === 'SUPER_ADMIN'
                ? await PlansService.getAllAdmin()
                : await PlansService.getAll();
            setPlans(data);
        } catch (err) {
            setError('Error al cargar los planes.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await PlansService.update(editingId, formData);
            } else {
                await PlansService.create(formData);
            }
            setIsModalOpen(false);
            loadPlans();
            resetForm();
        } catch (err) {
            alert('Error al guardar el plan');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            price: '0.00',
            currency: 'USD',
            billingCycle: 'MONTHLY',
            features: [],
            isActive: true,
            rubric: 'CLINICAL'
        });
        setEditingId(null);
    };

    const handleEdit = (plan: Plan) => {
        setFormData({
            name: plan.name,
            slug: plan.slug,
            price: plan.price.toString(),
            currency: plan.currency,
            billingCycle: plan.billingCycle,
            features: plan.features || [],
            isActive: plan.isActive,
            rubric: plan.rubric || 'CLINICAL'
        });
        setEditingId(plan.id);
        setIsModalOpen(true);
    };

    const handleAddFeature = () => {
        if (featureInput.trim()) {
            setFormData({
                ...formData,
                features: [...(formData.features || []), featureInput.trim()]
            });
            setFeatureInput('');
        }
    };

    const handleRemoveFeature = (index: number) => {
        const newFeatures = [...(formData.features || [])];
        newFeatures.splice(index, 1);
        setFormData({ ...formData, features: newFeatures });
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Desactivar este plan?')) {
            try {
                await PlansService.delete(id);
                loadPlans();
            } catch (error) {
                alert('Error al desactivar el plan');
            }
        }
    };

    if (loading) return <div className="p-14 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Cargando Motor de Precios...</div>;

    return (
        <div className="p-8 md:p-14 space-y-12 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Motor de Planes</h1>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.3em] mt-3">Gestión centralizada de suscripciones, precios y rubros</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl"
                >
                    <Plus size={18} /> Nuevo Plan
                </button>
            </header>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200 flex items-center gap-2">
                    <X size={20} /> {error}
                </div>
            )}

            {/* TABLA VS CARDS - Using Grid of Cards as requested */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {plans.map((plan) => (
                    <div key={plan.id} className="relative group">
                        <PlanCard
                            name={plan.name}
                            price={Number(plan.price)}
                            billingCycle={plan.billingCycle}
                            features={plan.features || []}
                            rubric={plan.rubric}
                            isActive={plan.isActive}
                            onSelect={() => console.log('Select', plan.id)} // Admin view, just inspect
                        />
                        {/* Admin Overlays */}
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEdit(plan)}
                                className="p-2 bg-white text-slate-400 hover:text-blue-600 rounded-full shadow-lg border border-slate-100"
                                title="Editar Plan"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => handleDelete(plan.id)}
                                className="p-2 bg-white text-slate-400 hover:text-red-500 rounded-full shadow-lg border border-slate-100"
                                title="Desactivar Plan"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Crear Plan */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nuevo Plan de Suscripción">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Plan</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                                    placeholder="Ej. Plan Emprendedor"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Slug (Identificador)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm text-slate-600"
                                    placeholder="ej. emprendedor-mensual"
                                    value={formData.slug}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rubro de Negocio</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                                    value={formData.rubric}
                                    onChange={e => setFormData({ ...formData, rubric: e.target.value })}
                                >
                                    <option value="CLINICAL">Salud & Clínicas</option>
                                    <option value="VET">Veterinaria</option>
                                    <option value="CRAFT">Talleres & Craft</option>
                                    <option value="EVENTS">Eventos & Tickets</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Precio</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-slate-700"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ciclo</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                                        value={formData.billingCycle}
                                        onChange={e => setFormData({ ...formData, billingCycle: e.target.value as any })}
                                    >
                                        <option value="MONTHLY">Mensual</option>
                                        <option value="YEARLY">Anual</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Características</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="Ej. 10 GB Almacenamiento"
                                        value={featureInput}
                                        onChange={e => setFeatureInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddFeature}
                                        className="bg-slate-200 text-slate-600 px-4 py-3 rounded-xl hover:bg-slate-300 transition-colors"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                    {formData.features?.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
                                            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> {f}</span>
                                            <button type="button" onClick={() => handleRemoveFeature(i)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                                        </div>
                                    ))}
                                    {(!formData.features || formData.features.length === 0) && (
                                        <p className="text-center text-xs text-slate-400 italic py-2">Sin características aún.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                        >
                            Crear Plan
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
