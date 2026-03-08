export const ROUTES = {
    // Rutas Públicas
    LOGIN: '/login',

    // Rutas del Dashboard
    DASHBOARD: {
        ROOT: '/dashboard',
        TENANTS: '/dashboard/tenants',
        // 👇 CORRECCIÓN: Cambiado para coincidir exactamente con la ruta de App.tsx
        MEDICAL_RECORDS: '/dashboard/patients',
    }
} as const;