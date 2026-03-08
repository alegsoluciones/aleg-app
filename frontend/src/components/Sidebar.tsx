import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    Settings,
    Building2,
    FileText,
    Store,
    CreditCard,
    CalendarCheck,
    ShieldAlert,
    Archive,
    X,
    LogOut,
    ChevronDown,
    ShoppingBag, // Para módulo Logística
    FlaskConical, // Para Laboratorio
    Pill, // Para Farmacia
    Receipt, // Para Finanzas
    Megaphone, // Para Marketing
    Video, // Para Telemedicina
    Dog, // Para Veterinaria
    Boxes, // Para Inventario
    PenTool,
    Palette,
    Activity,
    ShieldCheck,
    ChevronRight,
    ChevronLeft,
    HeartPulse,
    ChevronUp,
    UserCircle,
    Shield
} from 'lucide-react';
import { ROUTES } from '../routes/paths';

import { useTenantConfig } from '../context/TenantContext';
import { useTerminology } from '../hooks/useTerminology';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
    title: string;
    icon?: any;
    path: string;
    requiredModule?: string;
    children?: MenuItem[]; // Submenu support
}

interface MenuSection {
    label?: string;
    items: MenuItem[];
}

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
    onLogout: () => void;
}

export const Sidebar = ({ isCollapsed, setIsCollapsed, onLogout }: SidebarProps) => {
    const location = useLocation();
    const { config } = useTenantConfig();
    const t = useTerminology();
    const { user } = useAuth();
    const [isOpenMobile, setIsOpenMobile] = useState(false);

    // Submenu state
    const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
        'config': true
    });

    const toggleSubmenu = (key: string) => {
        setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    // 2. MENU: CLINIC (Tenant) - REORGANIZED
    const CLINIC_SECTIONS: MenuSection[] = [
        {
            label: "APPS",
            items: [
                { title: 'Monitoreo', icon: <LayoutDashboard size={20} />, path: ROUTES.DASHBOARD.ROOT, requiredModule: 'core-std' },
                { title: 'Agenda', icon: <CalendarCheck size={20} />, path: '/dashboard/calendar', requiredModule: 'mod_agenda' },
                {
                    title: t.patients,
                    icon: config?.industry === 'CRAFT' ? <Users size={20} /> : config?.industry === 'VET' ? <Dog size={20} /> : <Users size={20} />,
                    path: ROUTES.DASHBOARD.MEDICAL_RECORDS,
                    // 🟢 FIX: Allow access if EITHER 'mod_patients' OR 'mod_medical_records' is active
                    requiredModule: (config?.active_modules?.includes('mod_medical_records')) ? 'mod_medical_records' : 'mod_patients'
                },
                // CRAFT SPECIFIC
                ...(config?.slug === 'el-mundo-de-sara' ? [
                    { title: 'Proyectos', icon: <PenTool size={20} />, path: '/dashboard/projects', requiredModule: 'core-std' },
                    { title: 'Materiales', icon: <Palette size={20} />, path: '/dashboard/materials', requiredModule: 'core-std' }
                ] : []),

                // Specific Modules
                { title: 'Laboratorio', icon: <FlaskConical size={20} />, path: '/dashboard/laboratory', requiredModule: 'lab' },
                { title: 'Farmacia', icon: <Pill size={20} />, path: '/dashboard/pharmacy', requiredModule: 'pharmacy' },
                { title: 'Finanzas', icon: <Receipt size={20} />, path: '/dashboard/finance', requiredModule: 'mod_financial' },
                { title: 'Logística', icon: <ShoppingBag size={20} />, path: '/dashboard/logistics', requiredModule: 'mod_logistics' },
                { title: 'Inventario', icon: <Boxes size={20} />, path: '/dashboard/inventory', requiredModule: 'mod_logistics' },
                { title: 'Marketing', icon: <Megaphone size={20} />, path: '/dashboard/marketing', requiredModule: 'mod_marketing' },
                { title: 'Telemedicina', icon: <Video size={20} />, path: '/dashboard/telemed', requiredModule: 'telemed' },
                { title: 'Veterinaria', icon: <Dog size={20} />, path: '/dashboard/vet', requiredModule: 'mod_vet' },
                { title: 'Migración', icon: <Archive size={20} />, path: '/dashboard/services/migration', requiredModule: 'util_importer' },
            ]
        },
        {
            label: "ECOSISTEMA",
            items: [
                { title: 'Tienda', icon: <Store size={20} />, path: '/dashboard/marketplace', requiredModule: 'core-std' },
            ]
        },
        {
            label: "ADMINISTRACIÓN",
            items: [
                {
                    title: 'Configuración',
                    icon: <Settings size={20} />,
                    path: '#config',
                    requiredModule: 'core-std',
                    children: [
                        { title: 'Perfil Clínica', path: '/dashboard/settings', icon: <Building2 size={16} /> },
                        { title: 'Usuarios', path: '/dashboard/staff', icon: <Users size={16} /> },
                        { title: 'Suscripción', path: '/dashboard/billing', icon: <FileText size={16} /> },
                        { title: 'Auditoría', path: '/dashboard/audit', icon: <ShieldAlert size={16} /> },
                    ]
                }
            ]
        }
    ];

    // SAAS Adapting to Sections for consistency
    const SAAS_SECTIONS: MenuSection[] = [
        {
            label: "GLOBAL",
            items: [
                { title: 'Dashboard Global', icon: <Activity size={20} />, path: ROUTES.DASHBOARD.ROOT },
                { title: 'Empresas', icon: <Building2 size={20} />, path: ROUTES.DASHBOARD.TENANTS || '/dashboard/tenants' },
                { title: 'Planes', icon: <CreditCard size={20} />, path: '/admin/plans' },
                { title: 'Industrias', icon: <Boxes size={20} />, path: '/admin/industries' }, // 👈 Added Industries
                { title: 'Logs & Audit', icon: <ShieldCheck size={20} />, path: '/dashboard/audit' },
                { title: 'Config. Plataforma', icon: <Settings size={20} />, path: '/dashboard/platform-settings' },
            ]
        },
        // Adding CLINIC sections for SAAS too so they can navigate? Or just SAAS sections?
        // Usually SAAS admin sees everything or specific SAAS things. keeping simple as per existing code.
    ];

    const targetSections = isSuperAdmin ? SAAS_SECTIONS : CLINIC_SECTIONS;
    const isActive = (path: string) => location.pathname === path;

    // Mobile Event Listener
    useEffect(() => {
        const handleOpen = () => setIsOpenMobile(true);
        window.addEventListener('open-sidebar', handleOpen);
        return () => window.removeEventListener('open-sidebar', handleOpen);
    }, []);

    return (
        <>
            <aside
                className={`hidden xl:flex bg-[#020617] text-white flex-col h-screen shrink-0 transition-all duration-700 ease-in-out relative z-[60] border-r border-white/5 shadow-2xl ${isCollapsed ? 'w-20' : 'w-72'
                    }`}
            >
                {/* Collapse Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-12 w-6 h-6 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-2xl z-50"
                >
                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                </button>

                {/* BRANDING HEADER */}
                <div className={`transition-all duration-700 bg-white flex items-center justify-center overflow-hidden border-b border-slate-100 ${isCollapsed ? 'h-24 p-2' : 'h-44 p-0'
                    }`}>
                    {isSuperAdmin ? (
                        <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50">
                            <Activity size={40} className="text-blue-600 mb-2" />
                            {!isCollapsed && <span className="font-black text-xs tracking-[0.2em] text-slate-900">SYSTEM ADMIN</span>}
                        </div>
                    ) : (
                        <img
                            src={config?.theme?.logoUrl || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop'}
                            className={`w-full h-full object-cover transition-all duration-700 ${isCollapsed ? 'scale-110 rounded-xl' : 'scale-100'}`}
                            alt="Logo"
                        />
                    )}
                </div>

                {/* NAVIGATION AREA */}
                <nav className="flex-1 px-3 space-y-2 mt-6 overflow-y-auto no-scrollbar">
                    {targetSections.map((section, idx) => {
                        // Filter items logic
                        const visibleItems = section.items.filter(item => {
                            if (!item.requiredModule || isSuperAdmin) return true;
                            if (item.requiredModule === 'core-std') return true;
                            return config?.active_modules?.includes(item.requiredModule);
                        });
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={idx}>
                                {section.label && !isCollapsed && (
                                    <h3 className="px-4 text-[10px] font-black tracking-widest text-slate-500/80 uppercase mb-2 mt-4">{section.label}</h3>
                                )}
                                {visibleItems.map(item => {
                                    // Submenu Logic
                                    if (item.children) {
                                        const isOpen = openSubmenus[item.title] || false;
                                        const isActiveParent = item.children.some(child => isActive(child.path));
                                        return (
                                            <div key={item.title} className="space-y-1">
                                                <button
                                                    onClick={() => toggleSubmenu(item.title)}
                                                    className={`w-full flex items-center gap-4 py-3.5 rounded-xl transition-all ${isCollapsed ? 'justify-center' : 'px-4'} ${isActiveParent ? 'text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                                >
                                                    <div className="shrink-0">{item.icon}</div>
                                                    {!isCollapsed && (
                                                        <>
                                                            <span className="text-[10px] font-black uppercase tracking-widest truncate flex-1 text-left">{item.title}</span>
                                                            {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                        </>
                                                    )}
                                                </button>
                                                {isOpen && !isCollapsed && (
                                                    <div className="ml-4 pl-4 border-l border-white/10 space-y-1 mt-1">
                                                        {item.children.map(child => (
                                                            <Link key={child.path} to={child.path} className={`block py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${isActive(child.path) ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
                                                                {child.title}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    }

                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`flex items-center gap-4 py-3.5 rounded-2xl transition-all relative group ${isCollapsed ? 'justify-center' : 'px-4'
                                                } ${isActive(item.path) ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500 hover:text-slate-100'}`}
                                        >
                                            {isActive(item.path) && (
                                                <div className="absolute left-0 w-1 h-5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                            )}
                                            <div className={`shrink-0 transition-transform duration-300 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`}>
                                                {item.icon}
                                            </div>
                                            {!isCollapsed && (
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] truncate">
                                                    {item.title}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>

                {/* USER PROFILE (Bottom) */}
                <div className="p-5 border-t border-white/5 bg-black/5 shrink-0 space-y-4">
                    <Link
                        to="/dashboard/settings"
                        className={`flex items-center gap-3 group ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 group-hover:bg-blue-600/20 transition-all">
                            <UserCircle size={20} />
                        </div>
                        {!isCollapsed && (
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-black text-white uppercase truncate tracking-tighter leading-tight group-hover:text-blue-400 transition-colors">{user?.fullName}</p>
                                <p className="text-[8px] font-bold text-blue-400 uppercase flex items-center gap-1.5 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <Shield size={10} /> {user?.role || 'USER'}
                                </p>
                            </div>
                        )}
                    </Link>

                    <button onClick={onLogout} className={`w-full flex items-center gap-4 py-3 text-slate-500 hover:text-rose-400 transition-colors ${isCollapsed ? 'justify-center' : 'px-4'}`}>
                        <LogOut size={18} />
                        {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* MOBILE OVERLAY (Hidden by default, used on small screens) */}
            <div className={`fixed inset-0 z-[1000] xl:hidden transition-all duration-300 ${isOpenMobile ? 'visible' : 'invisible'}`}>
                <div
                    className={`absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300 ${isOpenMobile ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsOpenMobile(false)}
                />
                <div className={`absolute left-0 top-0 bottom-0 w-[85%] sm:w-[400px] bg-[#0f172a] shadow-2xl p-8 flex flex-col transition-transform duration-500 ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-3">
                            <HeartPulse size={32} className="text-blue-500" />
                            <span className="text-white font-black uppercase text-xl tracking-tighter">{config?.name || "ALEO MEDIC"}</span>
                        </div>
                        <button onClick={() => setIsOpenMobile(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 text-slate-400 rounded-2xl border border-white/10 hover:text-white transition-all"><X size={28} /></button>
                    </div>

                    {/* Mobile Nav Content simplified for now */}
                    <nav className="flex-1 space-y-3 overflow-y-auto">
                        <p className="text-slate-500 text-center uppercase tracking-widest text-xs">Menú Móvil</p>
                        {/* Add full mobile menu mapping if needed, for now just close button to show it works */}
                    </nav>
                </div>
            </div>
        </>
    );
};
