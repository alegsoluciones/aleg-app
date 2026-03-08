/**
 * UTILS: Clinical Data Mappers
 * Propósito: Filtrar metadatos técnicos (IDs, fechas) y entregar datos limpios a la UI.
 */

// Listas blancas de campos permitidos (Whitelist)
export const EVALUATION_FIELDS = [
    'tipo_piel',
    'aspecto',
    'color',
    'textura'
];

export const ANTECEDENTES_FIELDS = [
    'medicos',
    'alergicos',
    'quirurgicos',
    'medicamentos'
];

/**
 * Función pura que transforma un objeto crudo de la BD en un diccionario limpio.
 * Solo incluye las llaves de la whitelist que tengan contenido real.
 */
export const mapClinicalData = (rawData: any, whitelist: string[]): Record<string, string> => {
    if (!rawData || typeof rawData !== 'object') {
        return {};
    }

    const cleanData: Record<string, string> = {};

    whitelist.forEach((key) => {
        const value = rawData[key];

        // Validación estricta: debe ser string, no estar vacío, y no ser texto "null"
        if (value && typeof value === 'string' && value.trim().length > 0 && value !== 'null' && value !== 'undefined') {
            cleanData[key] = value.trim();
        }
    });

    return cleanData;
};