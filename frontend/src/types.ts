export interface Subscription {
    id: string;
    status: 'TRIAL' | 'ACTIVE' | 'CANCELLED' | 'PAST_DUE';
    startDate: string;
    endDate: string;
    planDetails: any;
}

export interface TenantConfig {
    industry: string;
    branding?: {
        logoUrl?: string;
        theme?: string;
    };
    [key: string]: any;
}

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'DEBT';
    config: TenantConfig;
    createdAt: string;
    subscriptions?: Subscription[];
}

export interface MedicalRecord {
    id: string; // 👈 Era number, ahora string (UUID)
    date: string;
    title: string;
    notes: string;
    steps?: string[];
    data?: any; // 👈 Polymorphic JSON (BodyMap, etc.)
    attachments: string[];
}

export interface Patient {
    id: string; // 👈 Era number, ahora string (UUID)
    internalId: string;
    name: string;
    occupation?: string;
    address?: string;
    birthDate?: string;
    status: 'DRAFT' | 'READY' | 'ACTIVE';
    firstConsultationDate?: string;
    diagnostico?: string;
    tratamiento?: string;
    antecedentes?: Record<string, string>;
    evaluation?: Record<string, string>;
    other_info?: Record<string, string>;
    createdAt?: string;
    [key: string]: any;
    records: MedicalRecord[];
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Appointment {
    id: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    reason?: string;
    status: AppointmentStatus;
    notes?: string;
    notifiedWhatsApp?: boolean;
    notifiedEmail?: boolean;
    [key: string]: any;
}

export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    price: number;
}

export interface Invoice {
    id: string;
    items: InvoiceItem[];
    total: number;
    status: 'PAID' | 'PENDING';
    paymentMethod: string;
    patientId?: string;
    date: string;
    [key: string]: any;
}

export interface User {
    id: number; // or string? check usages. AuthContext used number.
    email: string;
    fullName: string;
    role: string;
    tenantId?: number;
    tenant?: any; // TenantInfo
    [key: string]: any;
}