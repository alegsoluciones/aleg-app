/**
 * Clinical Assets Manager
 * Serves static assets based on Industry and Species Context.
 * Uses public placeholders for Phase 6.
 */

export const CLINICAL_ASSETS = {
    // Definitive Medical Silhouettes (INLINE SVG BASE64 - INDESTRUCTIBLE)
    // Human Body (Frontal Outline) - HIGH CONTRAST (#e2e8f0 fill, #334155 stroke)
    HUMAN_BODY: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgNDAwIj4KICA8cGF0aCBkPSJNMTAwLDIwIEMxMTUsMjAgMTI1LDMwIDEyNSw0NSBDMTI1LDYwIDExNSw3MCAxMDAsNzAgQzg1LDcwIDc1LDYwIDc1LDQ1IEM3NSwzMCA4NSwyMCAxMDAsMjAgWiBNMTAwLDcwIEMxMzAsNzAgMTYwLDkwIDE2MCwxNDAgTDE2MCwyMjAgTDE0MCwyMjAgTDE0MCwzODAgTTEwMCwzODAgTDYwLDM4MCBMNjAsMjIwIEw0MCwyMjAgTDQwLDE0MCBDNDAsOTAgNzAsNzAgMTAwLDcwIFoiIGZpbGw9IiNlMmU4ZjAiIHN0cm9rZT0iIzMzNDE1NSIgc3Ryb2tlLXdpZHRoPSIyIiAvPgo8L3N2Zz4=',

    // Dog Body (Lateral Outline)
    DOG_BODY: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMjAwIj4KICA8cGF0aCBkPSJNNDAsNjAgQzQwLDMwIDcwLDIwIDkwLDQwIEMxMDAsMzAgMTMwLDMwIDE4MCw1MCBDMjQwLDQwIDMyMCw1MCAzNTAsODAgQzM3MCwxMDAgMzgwLDEzMCAzNzAsMTUwIEwzNjAsMTgwIEwzMzAsMTgwIEwzNDAsMTMwIEwyODAsMTMwIEwyODAsMTgwIEwyNDAsMTgwIEwyNDAsMTQwIEwxMjAsMTQwIEwxMjAsMTgwIEw4MCwxODAgTDgwLDEyMCBDNjAsMTIwIDQwLDEwMCA0MCw2MCBaIiBmaWxsPSIjZjFmNWY5IiBzdHJva2U9IiM5NGEzYjgiIHN0cm9rZS13aWR0aD0iMiIgLz4KPC9zdmc+',

    // Cat Body (Lateral Outline)
    CAT_BODY: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMjAwIj4KICA8cGF0aCBkPSJNMzAsODAgQzMwLDUwIDUwLDQwIDcwLDYwIEM4MCw0MCAxMDAsNTAgMTEwLDcwIEMxNTAsNjAgMjUwLDYwIDMwMCw4MCBDMzIwLDkwIDMzMCwxMjAgMzIwLDE0MCBMMzEwLDE3MCBMMjgwLDE3MCBMMjkwLDEzMCBMMjMwLDEzMCBMMjMwLDE3MCBMMTkwLDE3MCBMMTkwLDEzMCBMMTAwLDEzMCBMMTAwLDE3MCBMNjAsMTcwIEw2MCwxMTAgQzQwLDExMCAzMCw5MCAzMCw4MCBaIE01MCw0MCBMNjAsNjAgWiBNMzAwLDgwIEwzMjAsNTAgWiIgZmlsbD0iI2YxZjVmOSIgc3Ryb2tlPSIjOTRhM2I4IiBzdHJva2Utd2lkdGg9IjIiIC8+Cjwvc3ZnPg==',

    // Generic Placeholder
    GENERIC: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMzAwIj4KICA8cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxODAiIGhlaWdodD0iMjgwIiBmaWxsPSIjZjFmNWY5IiBzdHJva2U9IiNjYmQ1ZTEiIHN0cm9rZS13aWR0aD0iMiIgLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk0YTNiOCIgZm9udC1zaXplPSIyMCI+Tk8gQVNTRVQ8L3RleHQ+Cjwvc3ZnPg=='
};

export const getClinicalAssets = (industry: string | undefined, patientData: any = {}) => {
    const rawIndustry = industry?.toUpperCase() || 'CLINICAL';

    if (rawIndustry === 'VET') {
        const species = patientData?.data?.species || '';
        if (species.includes('Felino') || species.includes('Gato')) return CLINICAL_ASSETS.CAT_BODY;
        return CLINICAL_ASSETS.DOG_BODY; // Default VET
    }

    if (rawIndustry === 'EVENTS' || rawIndustry === 'CRAFT') {
        return CLINICAL_ASSETS.GENERIC;
    }

    // Default: CLINICAL (Human)
    return CLINICAL_ASSETS.HUMAN_BODY;
};
