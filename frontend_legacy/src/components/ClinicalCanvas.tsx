import React, { useState, useRef, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

export interface Marker {
    id: string;
    x: number; // Percentage (0-100)
    y: number; // Percentage (0-100)
    note?: string;
}

interface ClinicalCanvasProps {
    imageUrl: string;
    markers?: Marker[];
    initialMarkers?: Marker[];
    onChange: (markers: Marker[]) => void;
    readOnly?: boolean;
    className?: string;
    hideList?: boolean;
}

export const ClinicalCanvas: React.FC<ClinicalCanvasProps> = ({ imageUrl, markers, initialMarkers, onChange, readOnly = false, className = '', hideList = false }) => {

    // RESOLUTION: Support both controlled (markers) and uncontrolled/read-only (initialMarkers) modes
    const displayMarkers = markers || initialMarkers || [];
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

    // Auto-focus input when a marker is selected
    useEffect(() => {
        if (selectedMarkerId && inputRefs.current[selectedMarkerId]) {
            inputRefs.current[selectedMarkerId]?.focus();
        }
    }, [selectedMarkerId]);

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (readOnly) return;
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        // Calculate relative percentage coordinates
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const newMarker: Marker = {
            id: crypto.randomUUID(),
            x,
            y,
            note: ''
        };

        onChange([...displayMarkers, newMarker]);
        setSelectedMarkerId(newMarker.id);
    };

    const handleUpdateNote = (id: string, note: string) => {
        const newMarkers = displayMarkers.map(m => m.id === id ? { ...m, note } : m);
        onChange(newMarkers);
    };

    const handleRemoveMarker = (id: string) => {
        const updated = displayMarkers.filter(m => m.id !== id);
        onChange(updated);
        if (selectedMarkerId === id) setSelectedMarkerId(null);
    };

    return (
        <div className={`flex flex-col md:flex-row gap-0 ${readOnly ? 'h-full' : 'gap-6 min-h-[500px] items-stretch'} w-full ${className}`}>

            {/* 🎨 CANVAS AREA (Left - 60-70%) */}
            <div className={`relative shrink-0 ${readOnly ? 'flex-1 h-full bg-slate-50 flex items-center justify-center overflow-hidden p-2' : 'w-full md:flex-[0.6] flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 shadow-sm'} group/canvas select-none`}>

                <div
                    ref={containerRef}
                    className="relative inline-flex items-center justify-center max-w-full max-h-full"
                >
                    <img
                        src={imageUrl}
                        alt="Anatomy Map"
                        // Key fix: block display, max-w/h to constrain, auto w/h to respect aspect ratio.
                        className="block w-auto h-auto max-w-full max-h-[85vh] object-contain pointer-events-auto select-none"
                        onClick={handleImageClick}
                        onError={(e) => {
                            // Fallback logging or placeholder if needed
                            console.warn("Image load error", e);
                            e.currentTarget.onerror = null;
                        }}
                    />

                    {/* MARKERS LAYER */}
                    {displayMarkers.map((marker, index) => {
                        const isSelected = selectedMarkerId === marker.id;
                        return (
                            <div
                                key={marker.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!readOnly) setSelectedMarkerId(isSelected ? null : marker.id);
                                }}
                                className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 transition-all shadow-md z-10 flex items-center justify-center cursor-pointer
                                    ${isSelected
                                        ? 'bg-blue-600 border-white ring-4 ring-blue-100 scale-125 z-20'
                                        : 'bg-rose-500 border-white text-white hover:scale-110'
                                    }
                                `}
                                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                                title={marker.note || `Hallazgo #${index + 1}`}
                            >
                                <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-white'}`}>
                                    {index + 1}
                                </span>
                            </div>
                        );
                    })}
                </div>
                {!readOnly && (
                    <p className="absolute bottom-2 text-[9px] text-slate-400 text-center font-medium bg-white/80 px-2 py-1 rounded-md backdrop-blur-sm pointer-events-none">
                        * Toca la imagen para agregar punto.
                    </p>
                )}
            </div>

            {/* 📝 LIST / EDITOR AREA (Right - 40%) */}
            {!hideList && (
                <div className={`flex flex-col gap-3 min-w-0 ${readOnly ? 'w-[300px] xl:w-[350px] p-4 bg-white h-full overflow-y-auto shrink-0 border-l border-slate-100' : 'flex-1 md:flex-[0.4]'}`}>

                    {displayMarkers.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 border-2 border-dashed border-slate-100 rounded-2xl">
                            <AlertCircle size={32} className="mb-2 opacity-50" />
                            <p className="text-xs font-bold uppercase tracking-widest text-center">Lienzo Vacío</p>
                            {!readOnly && <p className="text-[10px] font-medium text-center mt-1">Marque la silueta para comenzar.</p>}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 h-full overflow-y-auto max-h-[500px] pr-1">
                            {displayMarkers.map((marker, index) => {
                                const isSelected = selectedMarkerId === marker.id;

                                return (
                                    <div
                                        key={marker.id}
                                        onClick={() => !readOnly && setSelectedMarkerId(marker.id)}
                                        className={`group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200
                                        ${isSelected
                                                ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-100'
                                                : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                                            }
`}
                                    >
                                        {/* Number Badge */}
                                        <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors mt-0.5
                                        ${isSelected
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-rose-100 text-rose-600 border-rose-200 group-hover:bg-rose-500 group-hover:text-white'
                                            }
`}>
                                            {index + 1}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {readOnly ? (
                                                <p className="text-[11px] font-medium text-slate-600 leading-relaxed break-words">
                                                    {marker.note || <span className="text-slate-400 italic">Sin descripción registrada...</span>}
                                                </p>
                                            ) : (
                                                <textarea
                                                    ref={(el) => { inputRefs.current[marker.id] = el; }}
                                                    className="w-full bg-transparent text-[11px] font-medium text-slate-700 placeholder:text-slate-400 outline-none resize-none overflow-hidden min-h-[1.5rem]"
                                                    placeholder={`Describa el hallazgo #${index + 1}...`}
                                                    value={marker.note || ''}
                                                    onChange={(e) => handleUpdateNote(marker.id, e.target.value)}
                                                    rows={isSelected ? 3 : 1}
                                                    onFocus={() => setSelectedMarkerId(marker.id)}
                                                />
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {!readOnly && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRemoveMarker(marker.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                title="Eliminar punto"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
