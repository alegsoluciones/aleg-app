export interface AuditLog {
    id: string;
    action: string;
    method: string;
    path: string;
    resource: string;
    userEmail: string;
    userId: string;
    tenantId: string;
    createdAt: string;
    ip: string;
    userAgent: string; // 👈 Added
    level: 'INFO' | 'WARNING' | 'CRITICAL'; // 👈 Added
    metadata: any;
}

export const translateLog = (log: AuditLog): string => {
    const { method, path, resource, action } = log;
    const url = path || '';

    // 1. Auth Actions
    if (url.includes('/auth/login')) return '🔑 Inicio de Sesión';
    if (url.includes('/auth/logout')) return '🔒 Cierre de Sesión';

    // 2. Patient Actions
    if (resource === 'patients') {
        if (method === 'POST') return '📝 Registró un nuevo paciente';
        if (method === 'PUT' || method === 'PATCH') return '✏️ Actualizó datos del paciente';
        if (method === 'DELETE') return '🗑️ Eliminó un expediente de paciente';
    }

    // 3. Medical Records
    if (resource === 'records') {
        if (method === 'POST') return '🩺 Creó una nueva consulta';
        if (method === 'PUT') return '📝 Editó una historia clínica';
        if (method === 'DELETE') return '❌ Eliminó una consulta médica';
    }

    // 4. Media/Files
    if (url.includes('/media') || resource === 'media') {
        if (method === 'POST') return '📸 Subió nueva evidencia multimedia';
        if (method === 'DELETE') return '🗑️ Borró una foto/archivo';
    }

    // 5. Subscription/Billing
    if (resource === 'subscriptions' || url.includes('billing')) {
        return '💳 Actividad de Facturación/Suscripción';
    }

    // Fallback: Smart Guess
    if (method === 'POST') return `✨ Creó un recurso en ${resource || 'sistema'}`;
    if (method === 'PUT' || method === 'PATCH') return `🛠️ Modificó ${resource || 'recurso'}`;
    if (method === 'DELETE') return `🔥 Eliminó ${resource || 'recurso'}`;

    return action || 'Actividad registrada';
};
