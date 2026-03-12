import { useState } from 'react';
import { Terminal, Filter, Printer, Shield, Database, Trash2, MapPin, Eye, ChevronUp, ChevronDown, ShieldAlert, X, Download, Fingerprint, FileJson, History as HistoryIcon, ShieldCheck, Users, Crown } from 'lucide-react';
import { QuickActionCard } from '../ui/QuickActionCard';
import { DashboardWidgetCard } from '../ui/DashboardWidgetCard';

// Using a simplified local interface to avoid dependencies on TenantHome types if not exported
interface AuditLog {
    id: string;
    timestamp: string;
    userName: string;
    action: string;
    entity: string;
    details?: any;
    humanNarrative: string;
    patientName?: string;
    visitDate?: string;
    entityName?: string;
    technicalData?: any;
}

export const AuditConsole = () => {
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isTechExpanded, setIsTechExpanded] = useState(false);

    // Mock Data internal to the generic widget for now
    const auditLogs: AuditLog[] = [
        {
            id: 'LOG-001', timestamp: new Date().toISOString(), userName: 'System',
            action: 'LOGIN', entity: 'USER', humanNarrative: 'Inicio de sesión exitoso desde nueva IP',
            details: { ip: '192.168.1.1' }, technicalData: { userAgent: 'Mozilla/5.0' }
        },
        {
            id: 'LOG-002', timestamp: new Date(Date.now() - 3600000).toISOString(), userName: 'System',
            action: 'BACKUP', entity: 'SYSTEM', humanNarrative: 'Copia de seguridad automática completada',
            details: { size: '45MB' }, technicalData: { status: 'OK' }
        }
    ];

    const handleDownloadPDF = (log: AuditLog) => {
        alert(`Generando Certificado Probatorio de Auditoría...\nEvento ID: ${log.id}\nFirmado digitalmente por ALEO Core Chain.`);
    };

    return (
        <>
            <section className="space-y-6 pt-10 border-t border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
                    <div>
                        <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-4">
                            <Terminal size={24} className="text-slate-900" /> Consola de Auditoría Forense
                        </h2>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Trazabilidad de integridad de datos y peritaje de acciones de personal</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all shadow-sm"><Filter size={14} /> Filtrar Logs</button>
                        <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg"><Printer size={14} /> Certificado Global</button>
                    </div>
                </div>

                {/* Desktop Console */}
                <div className="hidden md:block">
                    <DashboardWidgetCard className="bg-[#020617] border-slate-800 min-h-[400px] p-0 overflow-hidden flex flex-col font-mono shadow-2xl">
                        <div className="p-6 border-b border-slate-800 bg-black/40 flex items-center justify-between">
                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-2 text-blue-400 text-[10px]">
                                    <Shield size={14} /> AES-256-GCM
                                </div>
                                <div className="flex items-center gap-2 text-emerald-400 text-[10px]">
                                    <Database size={14} /> SYNC_NODE: ACTIVE
                                </div>
                            </div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-widest">ALEO AUDIT ENGINE v5.1-LIVE</div>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-800/50 text-[11px] text-slate-500 uppercase">
                                        <th className="px-10 py-6 font-black tracking-widest">Línea de Tiempo</th>
                                        <th className="px-10 py-6 font-black tracking-widest">Responsable</th>
                                        <th className="px-10 py-6 font-black tracking-widest">Acción</th>
                                        <th className="px-10 py-6 font-black tracking-widest">Sujeto / Paciente / Visita / Imagen</th>
                                        <th className="px-10 py-6 font-black tracking-widest text-right">Ficha Forense</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/30">
                                    {auditLogs.length > 0 ? auditLogs.map((log, idx) => (
                                        <tr key={idx} className="hover:bg-white/5 transition-all group border-l-4 border-l-transparent hover:border-l-blue-500">
                                            <td className="px-10 py-6">
                                                <span className="text-slate-100 text-xs font-bold">{new Date(log.timestamp).toLocaleTimeString('es-ES')}</span>
                                                <p className="text-[9px] text-slate-500 mt-1 uppercase font-black">{new Date(log.timestamp).toLocaleDateString('es-ES')}</p>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 bg-[#39ff14]/10 rounded-lg flex items-center justify-center text-[11px] text-[#39ff14] font-black border border-[#39ff14]/20">{log.userName.charAt(0)}</div>
                                                    <span className="text-[#39ff14] text-[12px] font-black uppercase tracking-tight">{log.userName}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${log.action === 'PHOTO_DELETE' || log.action === 'DELETE' ? 'bg-rose-500/20 text-rose-400' :
                                                    log.action === 'CREATE' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        log.action === 'MIGRATION' ? 'bg-blue-500/20 text-blue-400' :
                                                            'bg-amber-500/20 text-amber-400'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-200 text-xs font-bold uppercase truncate max-w-[200px]">
                                                            {log.patientName || 'SISTEMA'}
                                                        </span>
                                                        {log.visitDate && <span className="text-slate-500 text-[10px] font-black"> &gt; Visita {log.visitDate}</span>}
                                                    </div>
                                                    {log.entityName && <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">OBJETO: {log.entityName}</span>}
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <button
                                                    onClick={() => { setSelectedLog(log); setIsTechExpanded(false); }}
                                                    className="px-5 py-2.5 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase hover:bg-white hover:text-[#020617] transition-all flex items-center gap-2 ml-auto border border-white/10"
                                                >
                                                    <Eye size={12} /> Detalle Humano
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-24 text-center opacity-30 text-white">
                                                <HistoryIcon size={64} className="mx-auto mb-4" />
                                                <p className="text-[12px] font-black uppercase tracking-[0.4em]">Sin registros de auditoría en buffer</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </DashboardWidgetCard>
                </div>

                {/* Mobile Console (Simplified) */}
                <div className="md:hidden space-y-4">
                    {auditLogs.map((log, idx) => (
                        <div key={idx} className="bg-[#020617] p-5 rounded-2xl border border-slate-800 flex flex-col gap-3 font-mono">
                            <div className="flex justify-between items-start">
                                <span className="text-[#39ff14] text-[10px] font-black uppercase">{log.userName}</span>
                                <span className="text-slate-500 text-[9px]">{new Date(log.timestamp).toLocaleTimeString('es-ES')}</span>
                            </div>
                            <div>
                                <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase mb-2 ${log.action === 'DELETE' ? 'bg-rose-900/50 text-rose-400' : 'bg-blue-900/50 text-blue-400'}`}>{log.action}</span>
                                <p className="text-white text-xs font-bold leading-tight">{log.humanNarrative}</p>
                            </div>
                            <button
                                onClick={() => setSelectedLog(log)}
                                className="w-full py-2 bg-white/5 text-slate-400 rounded-lg text-[9px] font-black uppercase mt-2"
                            >
                                Ver Detalle
                            </button>
                        </div>
                    ))}
                </div>

            </section>

            {/* MODAL DE DETALLE FORENSE */}
            {selectedLog && (
                <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-2xl z-[9999] flex items-center justify-center p-4 md:p-10 overflow-hidden">
                    <div className="bg-[#020617] rounded-[2.5rem] w-full max-w-2xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden max-h-[90vh] font-sans animate-in zoom-in-95 duration-300">

                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/60">
                            <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl ${selectedLog.action === 'PHOTO_DELETE' || selectedLog.action === 'DELETE' ? 'bg-rose-600 shadow-rose-900/40' : 'bg-blue-600 shadow-blue-900/40'
                                    }`}>
                                    <ShieldAlert size={32} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Peritaje de Evento</h3>
                                    <div className="flex items-center gap-4 mt-3">
                                        <span className="text-blue-400 font-mono text-[10px] uppercase tracking-widest italic">REF_ID: {selectedLog.id}</span>
                                        <span className="text-[#39ff14] font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-[#39ff14] rounded-full animate-pulse" /> VALOR PROBATORIO: NIVEL 5 (TOTAL)
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95"><X size={28} /></button>
                        </div>

                        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar space-y-10">

                            {/* BLOQUE NARRATIVO HUMANO */}
                            <section className="space-y-5">
                                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <Terminal size={16} /> Resumen del evento (En Cristiano)
                                </h4>
                                <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group">
                                    <Fingerprint size={80} className="absolute -bottom-4 -right-4 text-white/5 group-hover:text-white/10 transition-colors" />
                                    <p className="text-xl font-bold text-white leading-tight uppercase italic text-center relative z-10">
                                        "{selectedLog.humanNarrative}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Sujeto de Interés</p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center font-black text-sm">{selectedLog.patientName?.charAt(0) || 'S'}</div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-white uppercase truncate">{selectedLog.patientName || 'SISTEMA'}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{selectedLog.entity}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Red & Trazabilidad</p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-emerald-600/20 text-emerald-400 rounded-xl flex items-center justify-center"><MapPin size={20} /></div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-white uppercase truncate">Lima, Perú</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase truncate">IP: {selectedLog.technicalData?.ip || '190.232.X.XX'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* BLOQUE DE PAPELERA */}
                            {(selectedLog.action === 'PHOTO_DELETE' || selectedLog.action === 'DELETE') && (
                                <div className="bg-rose-600/10 p-6 rounded-[2rem] border border-rose-500/30 flex items-start gap-5 animate-in slide-in-from-bottom-2">
                                    <Trash2 size={28} className="text-rose-500 shrink-0 mt-1" />
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-black text-rose-400 uppercase tracking-[0.2em]">Aviso de Recuperación Forense</h4>
                                        <p className="text-slate-400 text-[11px] leading-relaxed">
                                            Este registro se encuentra actualmente en el <span className="text-white font-bold tracking-widest">VAULT</span> del servidor. La restauración total es posible durante los próximos <span className="text-white font-bold">60 DÍAS</span> naturales.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ANEXO TÉCNICO */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => setIsTechExpanded(!isTechExpanded)}
                                    className="w-full p-5 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-all shadow-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileJson size={18} className="text-blue-500" />
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Ver Payload Técnico & Metadatos</span>
                                    </div>
                                    {isTechExpanded ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                                </button>

                                {isTechExpanded && (
                                    <div className="p-6 bg-black/80 rounded-2xl border border-white/5 font-mono text-[10px] text-blue-300 overflow-x-auto animate-in slide-in-from-top-2">
                                        <pre className="custom-scrollbar leading-relaxed">{JSON.stringify(selectedLog, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 border-t border-white/5 bg-black/60 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-4">
                                <ShieldCheck size={32} className="text-emerald-500 shadow-emerald-500/20" />
                                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.3em]">VALIDATED BY ALEO-CORE CHAIN v5.2</p>
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <button onClick={() => setSelectedLog(null)} className="flex-1 md:flex-none px-8 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all">Cerrar</button>
                                <button
                                    onClick={() => handleDownloadPDF(selectedLog)}
                                    className="flex-1 md:flex-none px-8 py-4 bg-[#39ff14] text-[#020617] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-[0_0_30px_rgba(57,255,20,0.3)] hover:scale-105 transition-all flex items-center justify-center gap-3"
                                >
                                    <Download size={16} /> Certificado Probatorio
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export const GeneralStats = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <QuickActionCard
                icon={<Crown size={24} />}
                label="Plan Actual"
                value="PRO PLAN"
                sub="Suscripción Activa"
                color="indigo"
                onClick={() => { }}
                className="h-auto py-5"
            />
            <QuickActionCard
                icon={<Users size={24} />}
                label="Usuarios"
                value="5/10"
                sub="Licencias en uso"
                color="slate"
                onClick={() => { }}
                className="h-auto py-5"
            />
        </div>
    );
}

// Just export AuditConsole as part of CoreWidgets logic
export const CoreWidgets = () => {
    return (
        <div className="space-y-8">
            {/* Core Widgets like Audit Console and General Stats */}
            <GeneralStats />
            <AuditConsole />
        </div>
    );
};
