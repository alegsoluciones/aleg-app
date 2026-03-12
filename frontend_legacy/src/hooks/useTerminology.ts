import { useTenantConfig } from '../context/TenantContext';

export const useTerminology = () => {
    const { config } = useTenantConfig();

    // Default to CLINICAL/DEFAULT if not specified
    const industry = config?.industry || 'DEFAULT';

    const dictionaries: Record<string, any> = {
        VET: {
            patient: 'Mascota',
            patients: 'Mascotas',
            client: 'Propietario',
            identity: 'Microchip',
            history: 'Ficha Médica',
            record: 'Ficha'
        },
        LEGAL: {
            patient: 'Cliente',
            patients: 'Clientes',
            client: 'Representante',
            identity: 'Expediente',
            history: 'Caso',
            record: 'Actuación'
        },
        EVENTS: {
            patient: 'Staff / Expositor',
            patients: 'Staff / Expositores',
            client: 'Empresa',
            identity: 'DNI / Pasaporte',
            history: 'Bitácora de Evento',
            record: 'Entrada'
        },
        CRAFT: {
            patient: 'Alumna',
            patients: 'Alumnas',
            client: 'Cliente',
            identity: 'DNI / Identificación',
            history: 'Proyecto',
            record: 'Proyecto'
        },
        SYSTEM: {
            patient: 'Tenant / Inquilino',
            patients: 'Tenants',
            client: 'Administrador',
            identity: 'UUID',
            history: 'Audit Logs',
            record: 'Log'
        },
        // Health/Default
        DEFAULT: {
            patient: 'Paciente',
            patients: 'Pacientes',
            client: 'Titular',
            identity: 'DNI/Cédula',
            history: 'Historia Clínica',
            record: 'Historia'
        }
    };

    // Return the dictionary for the current industry, or DEFAULT if not found
    return dictionaries[industry] || dictionaries['DEFAULT'];
};
