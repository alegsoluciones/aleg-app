import { useState } from 'react';
import { useAudit } from '../hooks/useAudit';
import { translateLog } from '../utils/auditAdapter';
import type { AuditLog } from '../utils/auditAdapter'; // 👈 Split type import
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const TenantAudit = () => {
    const { logs, loading, error, refresh } = useAudit(50);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    if (loading && logs.length === 0) return <div className="p-8 text-center text-gray-500">Cargando bitácora de seguridad...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

    const openModal = (log: AuditLog) => setSelectedLog(log);
    const closeModal = () => setSelectedLog(null);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Auditoría (The Glass Room)</h1>
                    <p className="text-gray-500 text-sm">Registro forense inmutable de actividad</p>
                </div>
                <button
                    onClick={refresh}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                    🔄 Actualizar
                </button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Acción</th>
                                <th className="p-4">IP / Agente</th>
                                <th className="p-4 text-right">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {logs.map((log) => (
                                <tr key={log.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-4 text-gray-600 whitespace-nowrap">
                                        {format(new Date(log.createdAt), 'dd MMM HH:mm', { locale: es })}
                                        <div className="text-xs text-gray-400">
                                            {format(new Date(log.createdAt), 'yyyy')}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-800">{log.userEmail.split('@')[0]}</div>
                                        <div className="text-xs text-gray-400">{log.userEmail}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${log.level === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                                log.level === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'}`}>
                                            {translateLog(log)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500 text-xs font-mono">
                                        <div>{log.ip?.replace('::ffff:', '') || 'Unknown'}</div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => openModal(log)}
                                            className="text-blue-600 hover:text-blue-800 text-xs font-bold px-3 py-1 rounded bg-blue-50 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            JSON 🔎
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {logs.length === 0 && (
                        <div className="p-12 text-center text-gray-400">No hay registros de actividad reciente.</div>
                    )}
                </div>
            </div>

            {/* Modal de Detalle */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={closeModal}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">Evidencia Digital #{selectedLog.id.slice(0, 8)}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto font-mono text-xs text-gray-700 bg-gray-50/30 flex-1">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <div className="uppercase text-gray-400 text-[10px] font-bold tracking-wider mb-1">Recurso</div>
                                    <div className="font-semibold">{selectedLog.method} {selectedLog.path}</div>
                                </div>
                                <div>
                                    <div className="uppercase text-gray-400 text-[10px] font-bold tracking-wider mb-1">User Agent</div>
                                    <div className="truncate" title={selectedLog.userAgent}>{selectedLog.userAgent}</div>
                                </div>
                            </div>

                            <div className="bg-gray-800 text-green-400 p-4 rounded-xl shadow-inner overflow-x-auto">
                                <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
                            <button onClick={closeModal} className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors">
                                Cerrar Evidencia
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
