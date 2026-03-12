import { useNavigate } from 'react-router-dom';

import { useTenantConfig } from '../../context/TenantContext';
import { CreditCard, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export const SubscriptionPage = () => {
    const navigate = useNavigate();
    const { config } = useTenantConfig();

    // Simulate fetching prices from backend or config
    // For now we map codes to prices manually or fetching modules (omitted for brevity)
    const MODULE_PRICES: Record<string, number> = {
        'pharmacy': 15,
        'whatsapp': 10,
        'telemed': 20,
        'lab': 12,
        'finance': 18
    };

    const modulesCost = (config?.active_modules || []).reduce((acc, code) => acc + (MODULE_PRICES[code] || 0), 0);
    const basePlanCost = 50; // SaaS Starter
    const totalCost = basePlanCost + modulesCost;

    return (
        <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-50 font-sans">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-xs hover:text-slate-600 mb-8 transition-colors">
                    <ArrowLeft size={16} /> Volver al Dashboard
                </button>

                <h1 className="text-4xl font-black text-slate-800 mb-8 tracking-tight">Facturación & Suscripción</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* PLAN SUMMARY */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Current Plan Card */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Plan Actual</p>
                                    <h2 className="text-3xl font-black text-slate-800">SaaS Starter</h2>
                                </div>
                                <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-wide border border-emerald-100 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Activo
                                </span>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center py-4 border-b border-slate-50">
                                    <span className="font-bold text-slate-600">Plan Base (Mensual)</span>
                                    <span className="font-black text-slate-800">${basePlanCost}.00</span>
                                </div>
                                {config?.active_modules?.map(code => (
                                    <div key={code} className="flex justify-between items-center py-2">
                                        <span className="font-medium text-slate-500 text-sm flex items-center gap-2">
                                            <CheckCircle size={14} className="text-indigo-500" /> Módulo: {code.toUpperCase()}
                                        </span>
                                        <span className="font-bold text-slate-700">+ ${MODULE_PRICES[code] || 0}.00</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <span className="font-black text-slate-400 uppercase text-xs tracking-widest">Total Estimado</span>
                                <span className="text-4xl font-black text-slate-900">${totalCost}.00</span>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">Visa terminada en 4242</p>
                                    <p className="text-xs font-medium text-slate-400">Expira 12/28</p>
                                </div>
                            </div>
                            <button className="text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline">Cambiar</button>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="space-y-6">
                        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-xl font-black uppercase tracking-tight mb-2">Próximo Pago</h3>
                                <p className="text-indigo-200 text-sm mb-8 font-medium">Su próximo cargo automático se procesará el 01 de Febrero.</p>
                                <button
                                    onClick={() => alert('Simulación: Pago procesado exitosamente. Su cuenta está al día.')}
                                    className="w-full py-4 bg-white text-indigo-600 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all shadow-lg active:scale-95"
                                >
                                    Pagar Ahora
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                <CreditCard size={120} />
                            </div>
                        </div>

                        <div className="bg-white text-slate-500 p-8 rounded-[2.5rem] border border-slate-200/60 text-center">
                            <AlertCircle size={32} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-xs font-bold uppercase tracking-wide mb-2">¿Necesitas Ayuda?</p>
                            <p className="text-xs font-medium leading-relaxed mb-4">Contacta a soporte para temas de facturación.</p>
                            <a href="#" className="text-blue-600 font-black text-xs uppercase hover:underline">Soporte ALEG</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
