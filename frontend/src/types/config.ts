export interface TenantTerminology {
    patient: string;
    record: string;
    eval_section: string;
    owner?: string;
    appointment?: string;
    professional?: string; // 👈 Nuevo
    clinical_record?: string; // 👈 Nuevo
}

export interface TenantTheme {
    primary: string;
    radius?: string;
    logoUrl?: string; // 👈 Nuevo: Dynamic Logo
}

export interface FieldConfig {
    type: 'text' | 'badge' | 'select' | 'textarea';
    label?: string;
    options?: string[]; // Para select o badges predefinidos
    uppercase?: boolean;
    colSpan?: number; // 1 | 2
}

export interface ModuleConfig {
    fields?: Record<string, FieldConfig>;
}

export interface TenantConfig {
    name?: string; // 👈 NEW: Tenant Name from DB
    slug?: string; // 👈 NEW: Tenant Slug
    industry?: string; // 👈 NEW: Industry for Terminology
    app_mode: 'CLINICAL' | 'VET' | 'EVENTS' | 'CRAFT';
    terminology: TenantTerminology;
    theme?: TenantTheme;
    modules?: {
        clinical?: ModuleConfig;
    };
    active_modules?: string[]; // 👈 NEW: List of purchased/active modules
    branding?: {
        color?: string;
        logoUrl?: string;
    };
    contact?: {
        address?: string;
        phone?: string;
        website?: string;
        email?: string;
    };
    dashboardLayout?: any[]; // 👈 Added for layout customization
}
