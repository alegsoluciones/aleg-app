import { CoreWidgets } from './modules/CoreWidgets';
import { ClinicalWidgets } from './modules/ClinicalWidgets';
import { CraftWidgets } from './modules/CraftWidgets';
import { useTenantConfig } from '../../context/TenantContext';

export const DashboardWidgets = () => {
    const { config } = useTenantConfig();
    const industry = config?.industry || 'CLINICAL';

    // Modules logic can be extended here
    // const modules = config?.modules || []; 

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. CORE SIEMPRE PRESENTE */}
            <CoreWidgets />

            {/* 2. ZONA CLÍNICA (VET, DERMA, DENTAL, CLINICAL) */}
            {['CLINICAL', 'VET', 'DENTAL'].includes(industry) && (config?.active_modules?.some(m => ['mod_appointments', 'mod_patients'].includes(m))) && (
                <ClinicalWidgets />
            )}

            {/* 3. ZONA CRAFT */}
            {industry === 'CRAFT' && <CraftWidgets />}

            {/* AQUI AGREGAREMOS FUTUROS PLUGINS (Ej. Logística) */}
        </div>
    );
};
