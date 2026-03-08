import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTenantConfig } from '../context/TenantContext'; // 👈 Import
import { useTerminology } from '../hooks/useTerminology'; // 👈 Import Terminology
import { Lock, Mail, Loader2, AlertCircle, Zap, Eye, EyeOff } from 'lucide-react'; // 👈 Imports limpios

export const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const t = useTerminology(); // 👈 Consumir Terminology

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // 👈 Nuevo estado
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const doLogin = async (e: string, p: string) => {
        setIsSubmitting(true);
        setErrorMsg('');
        const result = await login(e, p);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setErrorMsg(result.message || 'Error de autenticación');
            setIsSubmitting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        doLogin(email, password);
    };

    // 👇 BOTONES DE DESARROLLO (Acceso Rápido)
    const devLoginSuper = () => doLogin('superadmin@alegapp.com', '123456');
    const devLoginClient = () => doLogin('administradora@solderma.com', '123456'); // 👈 Credenciales corregidas

    const { config } = useTenantConfig(); // 👈 Consumir Config

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* SECCIÓN IZQUIERDA (DYNAMIC BRANDING) */}
            <div className={`hidden lg:flex lg:w-1/2 flex-col justify-center px-12 relative overflow-hidden transition-colors duration-500
                ${config ? 'bg-slate-900' : 'bg-blue-900'}
            `}>
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                {config ? (
                    /* 🏢 BRANDING DEL INQUILINO */
                    <div className="relative z-10 text-white space-y-6 animate-in fade-in slide-in-from-left-4 duration-700">
                        {config.theme?.logoUrl ? (
                            <img src={config.theme.logoUrl} className="h-16 w-auto object-contain mb-4" alt="Logo Tenant" />
                        ) : (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold tracking-wide mb-4">
                                {config.name}
                            </div>
                        )}
                        <h1 className="text-5xl font-bold tracking-tight">Bienvenido a <br /> <span className="text-blue-400">{config.name}</span>.</h1>
                        <p className="text-slate-400 text-lg max-w-md">
                            Gestiona tus {t.patients.toLowerCase()} y {t.history.toLowerCase()}s con el panel especializado {
                                config.industry === 'CLINICAL' ? 'clínico' :
                                    config.industry === 'VET' ? 'veterinario' :
                                        config.industry === 'CRAFT' ? 'de taller' :
                                            'de gestión'
                            }.
                        </p>
                    </div>
                ) : (
                    /* 🌍 BRANDING DE PLATAFORMA (GUEST) */
                    <div className="relative z-10 text-white space-y-6 animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-wide">
                            <Zap size={10} className="text-yellow-400 fill-yellow-400" /> PLATAFORMA SaaS
                        </div>
                        <h1 className="text-5xl font-bold tracking-tight">ALEG <br /> <span className="text-blue-300">APP</span>.</h1>
                        <p className="text-blue-100/80 text-lg max-w-md">
                            Sistema Multi-Tenant Inteligente. Gestiona Clínicas, Veterinarias y Eventos con una sola base de código.
                        </p>
                    </div>
                )}
            </div>

            {/* SECCIÓN DERECHA */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 bg-white relative">

                {/* 🚧 DEV TOOLKIT */}
                {/* 🚧 DEV TOOLKIT */}
                <div className="absolute top-4 right-4 flex gap-2 flex-wrap justify-end">
                    {/* 1. Super Admin */}
                    <button onClick={devLoginSuper} className="bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                        <Zap size={12} /> Super Admin
                    </button>

                    {/* 2. Solderma (Medical) */}
                    <button onClick={devLoginClient} className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                        <Zap size={12} /> Derma
                    </button>

                    {/* 3. Dr. Pets (Vet) */}
                    <button onClick={() => doLogin('veterinaria@drpets.com', '123456')} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                        <Zap size={12} /> Vet
                    </button>

                    {/* 4. Sara (Craft) */}
                    <button onClick={() => doLogin('sara@elmundodesara.com', '123456')} className="bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                        <Zap size={12} /> Craft
                    </button>

                    {/* 5. Aspeten (Events) */}
                    <button onClick={() => doLogin('events@aspeten.com', '123456')} className="bg-pink-100 hover:bg-pink-200 text-pink-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                        <Zap size={12} /> Events
                    </button>
                </div>

                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-2xl font-bold text-slate-900">Iniciar Sesión</h2>
                        <p className="text-slate-500 text-sm mt-2">Ingresa tus credenciales para acceder al panel.</p>
                    </div>

                    {errorMsg && (
                        <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <span className="text-sm font-medium">{errorMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700">Correo Electrónico</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm" placeholder="usuario@empresa.com" required />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700">Contraseña</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all">
                            {isSubmitting ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Validando...</span> : config?.industry === 'CRAFT' ? 'Ingresar al Taller' : 'Ingresar al Sistema'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};