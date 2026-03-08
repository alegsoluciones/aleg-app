import React, { memo } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { MedicalRecordDocument } from '../pdf/MedicalRecordDocument';
import { Printer, Loader2 } from 'lucide-react';
import { useTenantConfig } from '../context/TenantContext'; // Assuming context is available
import { getClinicalAssets } from '../utils/clinicalAssets'; // We need to get the image URL

interface DocumentGeneratorProps {
    data: any;
    patient: any;
    type?: 'RECETA' | 'HISTORIA';
}

const DocumentGeneratorComponent = ({ data, patient, type = 'HISTORIA' }: DocumentGeneratorProps) => {
    const { config } = useTenantConfig();
    // Safe Image Handling
    const imageUrl = getClinicalAssets(config?.industry, patient);

    // Image conversion state
    const [processedImage, setProcessedImage] = React.useState<string | undefined>(undefined);
    const [isPreparing, setIsPreparing] = React.useState(false);

    React.useEffect(() => {
        const processImage = async () => {
            if (!imageUrl) {
                setProcessedImage(undefined);
                return;
            }

            // 1. If it's already safe (PNG/JPG), use it directly
            const isPngOrJpg = imageUrl.startsWith('data:image/png') ||
                imageUrl.startsWith('data:image/jpeg') ||
                imageUrl.toLowerCase().endsWith('.png') ||
                imageUrl.toLowerCase().endsWith('.jpg');

            if (isPngOrJpg) {
                setProcessedImage(imageUrl);
                return;
            }

            // 2. If it's SVG, convert it to PNG via Canvas
            if (imageUrl.startsWith('data:image/svg+xml') || imageUrl.toLowerCase().endsWith('.svg')) {
                setIsPreparing(true);
                const img = new Image();
                img.crossOrigin = 'anonymous'; // Prevent CORS issues
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width || 400; // Default width if missing
                    canvas.height = img.height || 400;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        try {
                            const pngData = canvas.toDataURL('image/png');
                            setProcessedImage(pngData);
                        } catch (e) {
                            console.error('Canvas export failed', e);
                            setProcessedImage(undefined);
                        }
                    }
                    setIsPreparing(false);
                };
                img.onerror = () => {
                    console.error('Image load failed');
                    setIsPreparing(false);
                };
                img.src = imageUrl;
            } else {
                // Fallback for unknown types
                setProcessedImage(undefined);
            }
        };

        processImage();
    }, [imageUrl]);

    // Use a unique filename
    const dateStr = data.date ? data.date.split('T')[0] : new Date().toISOString().split('T')[0];
    const prefix = type === 'RECETA' ? 'Receta' : 'Historia';
    const fileName = `${prefix}_${patient.name}_${dateStr}.pdf`;

    if (isPreparing) {
        return (
            <button disabled className="flex items-center gap-2 bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium cursor-not-allowed">
                <Loader2 size={14} className="animate-spin" />
                Preparando...
            </button>
        );
    }

    return (
        <PDFDownloadLink
            document={
                <MedicalRecordDocument
                    data={data}
                    patient={patient}
                    tenant={config}
                    bodyMapImage={processedImage}
                />
            }
            fileName={fileName}
            className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors text-xs font-medium"
        >
            {({ loading }) =>
                loading ? 'Generando PDF...' : (
                    <>
                        <Printer size={14} />
                        Imprimir
                    </>
                )
            }
        </PDFDownloadLink>
    );
};

export const DocumentGenerator = memo(DocumentGeneratorComponent, (prev, next) => {
    // Custom comparison to prevent re-renders if data/patient IDs haven't changed
    // This ignores function references or other volatile props if any were added
    return (
        prev.data.id === next.data.id &&
        prev.data.updatedAt === next.data.updatedAt &&
        prev.patient.id === next.patient.id &&
        prev.type === next.type
    );
});
