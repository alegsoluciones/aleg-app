import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenantConfig } from '../context/TenantContext';
import {
    ShoppingBag,
    Zap,
    Truck,
    DollarSign,
    Package,
    Activity,
    MessageCircle,
    Video,
    FlaskConical,
    FileSpreadsheet,
    Stethoscope,
    Check,
    Calendar,
    Users,
    FileText
} from 'lucide-react';

interface SubscriptionPlan {
    code: string;
    name: string;
    price: number;
    period: 'MES' | 'AÑO';
    features: string[];
    recommended?: boolean;
    color: string;
}

const PLANS: SubscriptionPlan[] = [
    {
        code: 'PLAN_BASIC',
        name: 'Basic',
        price: 9.99,
        period: 'MES',
        features: ['Gestión de Alumnos', '1 Usuario', 'Soporte por Email'],
        color: 'bg-slate-500'
    },
    {
        code: 'PLAN_EMPRENDEDOR',
        name: 'Emprendedor',
        price: 29.99,
        period: 'MES',
        features: ['Gestión de Alumnos + Proyectos', '3 Usuarios', 'Módulo Web', 'Soporte WhatsApp'],
        recommended: true,
        color: 'bg-blue-600'
    },
    {
        code: 'PLAN_PRO',
        name: 'Pro',
        price: 49.99,
        period: 'MES',
        features: ['Todo ilimitado', '10 Usuarios', 'API Access', 'Marca Blanca', 'Soporte 24/7'],
        color: 'bg-purple-600'
    }
];

interface MarketplaceModule {
    code: string;
    name: string;
    description: string;
    price: number;
    icon: string;
}

// 🎨 ICON MAP: Smart mapping based on module code or icon string
const getModuleIcon = (code: string) => {
    switch (code) {
        case 'mod_logistics': return <Truck size={32} />;
        case 'mod_financial': return <DollarSign size={32} />;
        case 'mod_marketing': return <MessageCircle size={32} />;
        case 'mod_vet': return <Activity size={32} />; // Or PawPrint if available
        case 'util_importer': return <FileSpreadsheet size={32} />;
        case 'pharmacy': return <Package size={32} />;
        case 'telemed': return <Video size={32} />;
        case 'lab': return <FlaskConical size={32} />;
        case 'finance': return <DollarSign size={32} />;
        case 'core-std': return <Stethoscope size={32} />;
        case 'mod_agenda': return <Calendar size={32} />;
        case 'mod_patients': return <Users size={32} />;
        case 'mod_medical_records': return <FileText size={32} />;
        default: return <Zap size={32} />;
    }
};

export const MarketplacePage = () => {
    const { token } = useAuth();
    const { config, refreshConfig } = useTenantConfig();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const [modules, setModules] = useState<MarketplaceModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        const fetchModules = async () => {
            const url = `${API_URL}/marketplace/modules`;
            console.log('🛍️ Fetching marketplace modules:', url);
            console.log('Fetching with Slug:', config?.slug);
            try {
                const res = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-tenant-slug': config?.slug || ''
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log('📦 Marketplace Response:', data);
                    const list = Array.isArray(data) ? data : (data.data || []);
                    setModules(list);
                } else {
                    console.error('❌ Marketplace Error:', res.status, await res.text());
                }
            } catch (e) {
                console.error('❌ Connectivity Error:', e);
            } finally {
                setLoading(false);
            }
        };
        if (token && config) fetchModules();
    }, [token, config]);

    const handleSubscribe = async (code: string) => {
        if (!confirm('¿Confirmar suscripción a este módulo? El costo se agregará a tu próxima factura.')) return;
        setProcessing(code);
        const url = `${API_URL}/marketplace/subscribe/${code}`; // 👈 FIXED: No spaces
        console.log('🔌 Subscribing:', url);

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-slug': config?.slug || ''
                }
            });
            if (res.ok) {
                console.log('✅ Subscribe Success');
                await refreshConfig(); // 👈 Update Context
                // window.location.reload(); // Removed
            } else {
                console.error('❌ Subscribe Failed:', res.status, await res.text());
                alert('Error al activar el módulo');
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        } finally {
            setProcessing(null);
        }
    };

    const handleUnsubscribe = async (code: string) => {
        if (!confirm('¿Seguro que deseas desactivar este módulo? Perderás acceso a sus funciones.')) return;
        setProcessing(code);
        const url = `${API_URL}/marketplace/unsubscribe/${code}`;
        console.log('🔌 Unsubscribing:', url);

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-slug': config?.slug || ''
                }
            });
            if (res.ok) {
                console.log('✅ Unsubscribe Success');
                await refreshConfig(); // 👈 Update Context
                // window.location.reload(); // Removed
            } else {
                console.error('❌ Unsubscribe Failed:', res.status, await res.text());
                alert('Error al desactivar el módulo');
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        } finally {
            setProcessing(null);
        }
    };

    const isInstalled = (code: string) => {
        return config?.active_modules?.includes(code);
    };

    console.log('Rendering Marketplace. Modules count:', modules.length, 'Loading:', loading);

    return (
        <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-50 font-sans">
            <div className="mb-10 text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center p-4 bg-indigo-50 text-indigo-600 rounded-3xl mb-6 shadow-sm ring-1 ring-indigo-100">
                    <ShoppingBag size={32} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Marketplace</h1>
                <p className="text-slate-500 text-lg leading-relaxed">
                    Potencia tu plataforma activando módulos adicionales diseñados para escalar tu operación.
                </p>
            </div>

            {/* PLANES SECTION */}
            <div className="max-w-7xl mx-auto mb-20">
                <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">Planes de Suscripción</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {PLANS.map((plan) => (
                        <div key={plan.code} className={`relative bg-white rounded-3xl p-8 shadow-xl border-2 ${plan.recommended ? 'border-blue-500 scale-105 z-10' : 'border-transparent'} flex flex-col`}>
                            {plan.recommended && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                                    Recomendado
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-black text-slate-900">${plan.price}</span>
                                <span className="text-slate-500 font-bold text-sm">/{plan.period}</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                        <div className={`p-1 rounded-full ${plan.recommended ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                            <button className={`w-full py-4 rounded-xl font-bold uppercase text-xs tracking-widest transition-all ${plan.recommended ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                Elegir Plan
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-8 border-b border-slate-200 pb-4">Módulos Adicionales</h2>
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
            ) : modules.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100 max-w-2xl mx-auto">
                    <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                        <ShoppingBag size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Catálogo Vacío</h3>
                    <p className="text-slate-500">No hay módulos disponibles en este momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto min-h-[50vh]">
                    {modules.map((module, idx) => {
                        if (idx === 0) console.log('Rendering Module [0]:', module);
                        const installed = isInstalled(module.code);

                        // 🛡️ PROPIEDADES DEFENSIVAS
                        const mId = module.code || `mod-${idx}`;
                        const mName = module.name || 'Módulo Sin Nombre';
                        const mDesc = module.description || 'Sin descripción disponible.';
                        const mPrice = module.price !== undefined ? Number(module.price) : 0;

                        return (
                            <div
                                key={mId}
                                className={`
bg-white rounded-[2.5rem] p-8 shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden group border
                                    ${installed
                                        ? 'border-emerald-100 shadow-emerald-100/50'
                                        : 'border-slate-100 shadow-slate-200/50 hover:shadow-2xl hover:scale-[1.02] hover:border-indigo-100'
                                    }
`}
                            >
                                {/* Decorative Background Icon */}
                                <div className={`
absolute -top-6 -right-6 p-8 opacity-5 transition-opacity duration-500
                                    ${installed ? 'text-emerald-600 opacity-10' : 'group-hover:opacity-10'}
`}>
                                    {getModuleIcon(module.code)}
                                </div>

                                {/* Header Icon */}
                                <div className={`
w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500
                                    ${installed
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-gradient-to-br from-blue-50 to-indigo-50 text-indigo-600 group-hover:scale-110 group-hover:rotate-3'
                                    }
`}>
                                    {getModuleIcon(module.code)}
                                </div>

                                <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">{mName}</h3>
                                <p className="text-slate-500 font-medium text-sm mb-8 flex-1 leading-relaxed">{mDesc}</p>

                                <div className="mt-auto">
                                    <div className="flex items-end gap-1 mb-6">
                                        <span className={`text-3xl font-black ${installed ? 'text-emerald-600' : 'text-slate-900'} `}>
                                            ${mPrice}
                                        </span>
                                        <span className="text-slate-400 font-bold text-xs mb-1.5 uppercase">/ mes</span>
                                    </div>

                                    {installed ? (
                                        <button
                                            onClick={() => handleUnsubscribe(module.code)}
                                            disabled={processing === module.code}
                                            className="w-full py-4 bg-white text-rose-500 border-2 border-rose-100 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {processing === module.code ? 'Desactivando...' : (
                                                <>
                                                    <Zap size={16} strokeWidth={3} className="text-rose-500" /> Desactivar
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSubscribe(module.code)}
                                            disabled={processing === module.code}
                                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                        >
                                            {processing === module.code ? 'Procesando...' : 'Activar'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
