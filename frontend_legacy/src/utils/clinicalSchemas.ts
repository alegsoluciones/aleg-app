import type { FieldDefinition } from '../components/DynamicForm';

/**
 * Generador de Esquemas Polimórficos
 * Adapta el formulario de creación de pacientes según la industria y terminología.
 * 
 * @param industry 'CLINICAL' | 'VET' | 'EVENTS'
 * @param t Objeto de terminología (useTerminology)
 */
export const getClinicalSchema = (industry: string | undefined, t: any): FieldDefinition[] => {
    const rawIndustry = industry?.toUpperCase() || 'CLINICAL';

    // 1. Esquema VETERINARIO (Dr. Pets)
    if (rawIndustry === 'VET') {
        return [
            {
                key: 'species',
                label: 'Especie',
                type: 'select',
                options: ['Canino (Perro)', 'Felino (Gato)', 'Ave', 'Exótico', 'Otro'],
                required: true,
                placeholder: 'Seleccione especie...'
            },
            {
                key: 'breed',
                label: 'Raza / Cruce',
                type: 'text',
                placeholder: 'Ej: Labrador, Siamés...',
                required: true
            },
            {
                key: 'sex',
                label: 'Sexo',
                type: 'select',
                options: ['Macho', 'Hembra'],
                required: true
            },
            {
                key: 'weight',
                label: 'Peso (Kg)',
                type: 'number',
                placeholder: '0.00'
            },
            {
                key: 'color',
                label: 'Color / Pelaje',
                type: 'text',
                placeholder: 'Ej: Negro, Atigrado...'
            },
            {
                key: 'ownerName',
                label: `Nombre del ${t?.tutor || 'Propietario'}`,
                type: 'text',
                required: true,
                placeholder: 'Responsable legal...'
            }
        ];
    }

    // 2. Esquema EVENTOS (Aspeten)
    if (rawIndustry === 'EVENTS') {
        return [
            {
                key: 'role',
                label: 'Rol en Evento',
                type: 'select',
                options: ['Staff', 'Expositor', 'Invitado VIP', 'Prensa'],
                required: true
            },
            {
                key: 'company',
                label: 'Empresa / Representación',
                type: 'text',
                placeholder: 'Ej: Coca-Cola, Freelance...'
            },
            {
                key: 'diet',
                label: 'Requerimientos Dietéticos',
                type: 'text',
                placeholder: 'Ej: Vegano, Alérgico a nueces...'
            }
        ];
    }

    // 3. Esquema TALLER / ARTESANAL (El Mundo de Sara)
    if (rawIndustry === 'CRAFT') {
        return [
            {
                key: 'workshop_level',
                label: 'Nivel de Taller',
                type: 'select',
                options: ['Iniciación', 'Intermedio', 'Avanzado', 'Masterclass'],
                required: true
            },
            {
                key: 'technique',
                label: 'Técnica Principal',
                type: 'text',
                placeholder: 'Ej: Pintura en tela, Bordado...'
            },
            {
                key: 'kit_status',
                label: 'Estado del Kit',
                type: 'select',
                options: ['Entregado', 'Pendiente', 'No aplica'],
                required: true
            }
        ];
    }

    // 4. Esquema CLÍNICO HUMANOS (Solderma - Default)
    // 'CLINICAL'
    return [
        {
            key: 'reason',
            label: 'Motivo de Consulta Principal',
            type: 'textarea',
            placeholder: '¿Por qué nos visita hoy?',
            required: true
        },
        {
            key: 'skinType',
            label: 'Fototipo de Piel (Fitzpatrick)',
            type: 'select',
            options: ['I - Muy Pálida', 'II - Pálida', 'III - Clara Media', 'IV - Morena Clara', 'V - Morena Oscura', 'VI - Negra'],
            placeholder: 'Evaluación preliminar...'
        },
        {
            key: 'occupation',
            label: 'Ocupación',
            type: 'text',
            placeholder: 'Factor relevante para exposición...'
        }
    ];
};
