import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Save, X, Plus, UploadCloud, Image as ImageIcon, Trash2, CheckSquare, Square } from 'lucide-react';
import Zoom from 'react-medium-image-zoom';
import { SecureImage } from './SecureImage'; 
import { EditableField } from './EditableField'; 
import type { MedicalRecord } from '../types';

interface Props {
    record: MedicalRecord;
    apiUrl: string;
    editingBlockId: string | null; 
    setGlobalEditing: (id: string | null) => void;
    onSave: (id: string, data: any) => Promise<boolean>;
    onUpload: (id: string, files: FileList) => Promise<boolean>;
    onDelete: (id: string) => Promise<boolean>;
    onDeletePhoto: (id: string, url: string) => Promise<boolean>;
    onDeletePhotosBulk: (id: string, urls: string[]) => Promise<boolean>;
}

export const MedicalRecordCard: React.FC<Props> = ({ 
    record, editingBlockId, setGlobalEditing,
    onSave, onUpload, onDelete, onDeletePhoto, onDeletePhotosBulk 
}) => {
    const blockId = `record-${record.id}`;
    const isEditing = editingBlockId === blockId;
    const isBlocked = editingBlockId !== null && editingBlockId !== blockId;

    const [tempDate, setTempDate] = useState(record.date || '');
    const [tempTitle, setTempTitle] = useState(record.title || '');
    const [tempSteps, setTempSteps] = useState('');
    
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '---';
        const parts = dateStr.split('T')[0].split('-'); 
        if (parts.length < 3) return dateStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    useEffect(() => {
        if (!isEditing) {
            setTempDate(record.date || '');
            setTempTitle(record.title || '');
            const text = record.steps && record.steps.length > 0 ? record.steps.join('\n') : record.notes || '';
            setTempSteps(text);
        }
    }, [record, isEditing]);

    const startEditing = () => {
        if (isBlocked) { alert("⚠️ BLOQUEADO: Tienes otra edición en curso."); return; }
        setGlobalEditing(blockId);
    };

    const cancelEditing = () => {
        setGlobalEditing(null);
        setTempDate(record.date || '');
        setTempTitle(record.title || '');
        const text = record.steps && record.steps.length > 0 ? record.steps.join('\n') : record.notes || '';
        setTempSteps(text);
    };

    const handleSave = async () => {
        const stepsArray = tempSteps.split('\n').filter(line => line.trim() !== '');
        const success = await onSave(record.id, { 
            date: tempDate, 
            title: tempTitle,
            notes: tempSteps, 
            steps: stepsArray 
        });
        if (success) setGlobalEditing(null);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            if (isEditing) {
                const stepsArray = tempSteps.split('\n').filter(line => line.trim() !== '');
                await onSave(record.id, { title: tempTitle, notes: tempSteps, steps: stepsArray });
            }
            await onUpload(record.id, e.target.files);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteRecord = async () => {
        if (isBlocked) return;
        if (confirm('⚠️ ¿ELIMINAR VISITA COMPLETA?\n\nEsta acción es irreversible.')) {
            await onDelete(record.id);
        }
    };

    const handleSinglePhotoDelete = async (url: string) => {
        if (window.confirm("🗑️ ¿Eliminar esta evidencia?")) await onDeletePhoto(record.id, url);
    };

    const handleBulkDeletePhotos = async () => {
        if (selectedPhotos.length === 0) return;
        if (confirm(`¿Borrar ${selectedPhotos.length} fotos seleccionadas?`)) {
            const success = await onDeletePhotosBulk(record.id, selectedPhotos);
            if (success) { setSelectedPhotos([]); setIsSelectionMode(false); }
        }
    };

    const attachmentList = typeof record.attachments === 'string' ? JSON.parse(record.attachments) : (record.attachments || []);

    return (
        <div className={`flex gap-5 mb-10 group/card w-full transition-opacity duration-300 ${isBlocked ? 'opacity-40 grayscale-[50%]' : 'opacity-100'}`}>
            <div className="min-w-[110px] text-right pt-1 flex-shrink-0">
                {isEditing ? (
                    <input type="date" value={tempDate ? tempDate.split('T')[0] : ''} onChange={(e) => setTempDate(e.target.value)} className="w-full text-xs border border-blue-300 rounded p-1 font-bold text-slate-700 mb-2 shadow-sm outline-none"/>
                ) : (
                    <>
                        <div className="text-sm font-extrabold text-slate-700">{formatDate(record.date)}</div>
                        <div className="text-xs text-slate-400 font-medium">{record.date ? record.date.toString().substring(0, 4) : ''}</div>
                    </>
                )}
            </div>
            
            <div className="flex-1 border-l-2 border-slate-200 pl-8 relative pb-2 min-w-0 overflow-hidden">
                <div className="absolute -left-[9px] top-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                <div className={`bg-white p-6 rounded-xl border transition-all duration-200 relative w-full ${isEditing ? 'border-blue-400 ring-2 ring-blue-50 shadow-lg' : 'border-slate-200 shadow-sm hover:shadow-md'}`}>
                    
                    <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
                        <div className="flex-1 mr-4 min-w-0">
                            {isEditing ? (
                                <EditableField 
                                    value={tempTitle} 
                                    onSave={setTempTitle} 
                                    className="w-full font-bold text-base text-slate-800 border-b-2 border-blue-300 uppercase py-1"
                                    placeholder="TÍTULO"
                                    validation="title" // 👈 AQUÍ SE BLOQUEAN LOS NÚMEROS
                                />
                            ) : (
                                <div className="flex items-center gap-3">
                                    <h4 className="m-0 text-base text-slate-800 font-bold uppercase truncate">{record.title}</h4>
                                    {attachmentList.length > 0 && <span className="flex-shrink-0 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold flex items-center shadow-sm"><ImageIcon size={12} className="mr-1"/> {attachmentList.length}</span>}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {!isEditing && (
                                <>
                                    <button onClick={startEditing} className={`p-1.5 rounded transition ${isBlocked ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}><Edit2 size={16}/></button>
                                    <button onClick={handleDeleteRecord} className={`p-1.5 rounded transition ${isBlocked ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}><Trash2 size={16}/></button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mb-4">
                        {isEditing ? (
                            <>
                                <EditableField 
                                    value={tempSteps} 
                                    onSave={setTempSteps} 
                                    className="w-full h-40 p-3 border border-slate-300 rounded-lg text-sm font-mono leading-relaxed"
                                    multiline
                                />
                                <div className="flex gap-2 mt-4 justify-end">
                                    <button onClick={cancelEditing} className="bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center hover:bg-slate-50 transition"><X size={14} className="mr-2"/> Cancelar</button>
                                    <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center hover:bg-blue-700 transition shadow-sm"><Save size={14} className="mr-2"/> Guardar</button>
                                </div>
                            </>
                        ) : (
                            <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100/50">
                                <ul className="text-sm text-slate-700 list-disc pl-4 space-y-1">
                                    {record.steps && record.steps.length > 0 ? record.steps.map((s, i) => <li key={i} className="break-words">{s}</li>) : <li className="italic text-slate-400">Sin detalles.</li>}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-50">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isSelectionMode ? `${selectedPhotos.length} seleccionadas` : 'Evidencia'}</span>
                            <div className="flex gap-2">
                                {attachmentList.length > 0 && (
                                    <button onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedPhotos([]); }} className={`px-2 py-1 rounded text-xs font-bold flex items-center transition ${isSelectionMode ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:text-blue-600'}`}>
                                        <CheckSquare size={14} className="mr-1"/> {isSelectionMode ? 'Cancelar' : 'Seleccionar'}
                                    </button>
                                )}
                                {isSelectionMode && selectedPhotos.length > 0 && (
                                    <button onClick={handleBulkDeletePhotos} className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold flex items-center hover:bg-red-200"><Trash2 size={14} className="mr-1"/> Borrar ({selectedPhotos.length})</button>
                                )}
                                {!isSelectionMode && (
                                    <button onClick={() => !isBlocked && fileInputRef.current?.click()} className={`px-2 py-1 rounded text-xs font-bold flex items-center transition ${isBlocked ? 'text-slate-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}>
                                        <Plus size={14} className="mr-1"/> Añadir
                                    </button>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple disabled={isBlocked || false} />
                        </div>

                        {attachmentList.length > 0 ? (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin max-w-full">
                                {attachmentList.map((url: string, i: number) => {
                                    const isSelected = selectedPhotos.includes(url);
                                    return (
                                        <div key={i} className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border shadow-sm relative group bg-slate-100 ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}`} onClick={() => isSelectionMode && setSelectedPhotos(prev => prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url])}>
                                            <Zoom>
                                                <SecureImage src={url.replace(/\\/g, '/')} className="w-full h-full object-cover" alt="Evidencia" />
                                            </Zoom>
                                            {isSelectionMode && <div className="absolute inset-0 bg-black/10 cursor-pointer flex items-start justify-end p-1">{isSelected ? <CheckSquare size={16} className="text-blue-600 bg-white rounded-sm"/> : <Square size={16} className="text-white drop-shadow-md"/>}</div>}
                                            {!isSelectionMode && !isBlocked && <button onClick={(e) => { e.stopPropagation(); handleSinglePhotoDelete(url); }} className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm z-10"><Trash2 size={12}/></button>}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div onClick={() => !isBlocked && fileInputRef.current?.click()} className={`border-2 border-dashed border-slate-200 rounded-lg p-4 text-center transition group ${isBlocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-blue-300 hover:bg-blue-50/50'}`}><UploadCloud size={20} className="mx-auto text-slate-300 group-hover:text-blue-400 mb-1"/><span className="text-xs text-slate-400 group-hover:text-blue-500">Subir primera foto</span></div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};