
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Search, Plus, Edit2, Trash2, Calendar,
    User, Activity, Phone, FileText, ImageIcon,
    ChevronRight, Stethoscope, X, CheckCircle, CheckCircle2,
    LayoutGrid, CalendarDays, Maximize2, Menu,
    Grid3X3, ChevronLeft, ZoomIn, ZoomOut, AlertCircle,
    Briefcase, Clock, Save, Filter, History, UserPlus,
    Users, Check, UserCircle, ChevronUp, Archive, RotateCcw,
    ArrowRight, Hash, Shield, PanelLeftClose, PanelLeftOpen,
    ChevronDown, Trash, ListChecks, CalendarRange, Receipt,
    UploadCloud, FileSearch, FileDigit, Download, FolderOpen
} from 'lucide-react';
import { PatientsService } from '../../services/PatientsService';
import { useAuth } from '../../context/AuthContext';
import type { Patient, MedicalRecord } from '../../types';

// Placeholder Types for Prototype compatibility
interface AnalysisRecord {
    id: string;
    visitId?: string;
    type: string;
    realizationDate: string;
    uploadDate: string;
    fileName: string;
    fileUrl: string;
    fileType: 'PDF' | 'IMAGE';
    source: string;
}

export const PatientDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const tenant = user?.tenant;

    const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);
    const [patientInvoices, setPatientInvoices] = useState<any[]>([]); // Mocked for now

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isCompact, setIsCompact] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filterStartDate, setFilterStartDate] = useState<string | null>(null);
    const [filterEndDate, setFilterEndDate] = useState<string | null>(null);
    const [appliedFilters, setAppliedFilters] = useState<{ start: string | null, end: string | null, text: string }>({ start: null, end: null, text: '' });

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [galleryRecord, setGalleryRecord] = useState<MedicalRecord | null>(null);

    const [isPatientsCollapsed, setIsPatientsCollapsed] = useState(true);

    // States for Exams
    const [isExamsModalOpen, setIsExamsModalOpen] = useState(false);
    const [activeAnalysis, setActiveAnalysis] = useState<AnalysisRecord | null>(null);
    const [currentVisitIdForExams, setCurrentVisitIdForExams] = useState<string | null>(null);

    // States for Upload
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadTargetVisitId, setUploadTargetVisitId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [analysisForm, setAnalysisForm] = useState({
        type: '',
        realizationDate: new Date().toISOString().split('T')[0],
        fileType: 'PDF' as 'PDF' | 'IMAGE',
        fileData: null as string | null,
        fileName: ''
    });

    // Editing Blocks
    const [editingBlock, setEditingBlock] = useState<string | null>(null);
    const [tempBlockData, setTempBlockData] = useState<any>(null);

    // Editing Visits
    const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ subjective: '', doctorName: '', title: '' });
    const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());

    // Load Patient
    useEffect(() => {
        const fetchPatient = async () => {
            if (!id) return;
            try {
                const data = await PatientsService.getById(id);
                // Ensure compatibility with prototype fields
                const adaptedData = {
                    ...data,
                    // Map/Merge logic if needed
                    records: data.records || [],
                    analyses: [], // Add empty/mock analyses if not in backend yet
                    background: data.background || data.antecedentes || {}, // fallback
                    evaluation: data.evaluation || {}
                };
                setCurrentPatient(adaptedData);
            } catch (error) {
                console.error("Failed to load patient", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPatient();
    }, [id]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedImage(null);
                setGalleryRecord(null);
                setIsFilterModalOpen(false);
                setIsExamsModalOpen(false);
                setIsUploadModalOpen(false);
                setEditingBlock(null);
                setEditingRecordId(null);
                if (window.innerWidth < 1024) setIsPatientsCollapsed(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (window.innerWidth >= 1024) {
            setIsPatientsCollapsed(false);
        } else {
            setIsPatientsCollapsed(true);
        }
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        setIsCompact(scrollTop > 100);
        setShowScrollTop(scrollTop > 400);
    };

    const filteredRecords = useMemo(() => {
        if (!currentPatient || !currentPatient.records) return [];
        let records = [...currentPatient.records].filter(r => !archivedIds.has(r.id));
        const { start, end, text } = appliedFilters;
        // Map 'subjective' to 'notes' or 'title' for search
        if (text) records = records.filter(r => (r.notes || '').toLowerCase().includes(text.toLowerCase()) || r.date.includes(text));

        if (start && end) {
            const s = new Date(start).getTime();
            const e = new Date(end).getTime();
            const realStart = Math.min(s, e);
            const realEnd = Math.max(s, e);
            records = records.filter(r => {
                const d = new Date(r.date).getTime();
                return d >= realStart && d <= realEnd;
            });
        } else if (start) {
            records = records.filter(r => r.date === start);
        }

        return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [currentPatient, appliedFilters, archivedIds]);

    const handleOpenExamsForVisit = (visitId: string) => {
        setCurrentVisitIdForExams(visitId);
        // Mock analysis filtering
        const visitAnalyses = ((currentPatient as any)?.analyses || []).filter((a: any) => a.visitId === visitId);
        setActiveAnalysis(visitAnalyses.length > 0 ? visitAnalyses[0] : null);
        setIsExamsModalOpen(true);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const isImg = file.type.startsWith('image/');
            setAnalysisForm(prev => ({
                ...prev,
                fileData: dataUrl,
                fileName: file.name,
                fileType: isImg ? 'IMAGE' : 'PDF'
            }));
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveAnalysis = async () => { // Async for service call
        if (!currentPatient || !analysisForm.type || !analysisForm.fileData) return alert("Por favor complete todos los campos.");

        const newAnalysis: AnalysisRecord = {
            id: `AL-${Date.now()}`,
            visitId: uploadTargetVisitId || undefined,
            type: analysisForm.type.toUpperCase(),
            realizationDate: analysisForm.realizationDate,
            uploadDate: new Date().toISOString().split('T')[0],
            fileName: analysisForm.fileName,
            fileUrl: analysisForm.fileData,
            fileType: analysisForm.fileType,
            source: 'CLINIC'
        };

        const updatedPatient = {
            ...currentPatient,
            analyses: [...((currentPatient as any).analyses || []), newAnalysis]
        } as Patient;

        // Logic to add to records images if it's an image
        if (analysisForm.fileType === 'IMAGE' && uploadTargetVisitId) {
            updatedPatient.records = updatedPatient.records.map(r =>
                r.id === uploadTargetVisitId
                    ? { ...r, attachments: [...(r.attachments || []), analysisForm.fileData!] }
                    : r
            );
        }

        try {
            await PatientsService.update(currentPatient.id, updatedPatient);
            setCurrentPatient(updatedPatient);
            setIsUploadModalOpen(false);
            setAnalysisForm({
                type: '',
                realizationDate: new Date().toISOString().split('T')[0],
                fileType: 'PDF',
                fileData: null,
                fileName: ''
            });
        } catch (err) {
            console.error("Failed to save patient analysis", err);
            alert("Error al guardar archivo");
        }
    };

    const handleStartEdit = (rec: MedicalRecord) => {
        setEditingRecordId(rec.id);
        setEditForm({
            subjective: rec.notes || '',
            doctorName: 'DR. LOCAL', // Placeholder
            title: rec.title || 'VISITA'
        });
    };

    const handleSaveEdit = async (recordId: string) => {
        if (!currentPatient) return;
        const updatedRecords = currentPatient.records.map(r =>
            r.id === recordId ? { ...r, notes: editForm.subjective, title: editForm.title } : r
        );
        const updatedPatient = { ...currentPatient, records: updatedRecords };

        try {
            await PatientsService.update(currentPatient.id, updatedPatient);
            setCurrentPatient(updatedPatient);
            setEditingRecordId(null);
        } catch (err) {
            console.error("Failed to update record", err);
        }
    };

    const handleStartBlockEdit = (block: string) => {
        setEditingBlock(block);
        // Access safely using type assertion or checking properties
        const bg = (currentPatient as any)?.background || {};
        const ev = (currentPatient as any)?.evaluation || {};

        if (block === 'resumen') setTempBlockData({ diagnosis: bg.diagnosis || '', treatment: (Array.isArray(bg.treatment) ? bg.treatment.join('\n') : bg.treatment) || '' });
        if (block === 'evaluacion') setTempBlockData({ skinType: (Array.isArray(ev.skinType) ? ev.skinType.join(', ') : ev.skinType) || '', aspect: (Array.isArray(ev.aspect) ? ev.aspect.join(', ') : ev.aspect) || '' });
        if (block === 'antecedentes') setTempBlockData({ medical: bg.medical || '', surgical: bg.surgical || '', allergic: (Array.isArray(bg.allergic) ? bg.allergic.join(', ') : bg.allergic) || '' });
    };

    const saveBlockEdit = async () => {
        if (!currentPatient) return;
        let updated = { ...currentPatient } as any;

        if (!updated.background) updated.background = {};
        if (!updated.evaluation) updated.evaluation = {};

        if (editingBlock === 'resumen') {
            updated.background = { ...updated.background, diagnosis: tempBlockData.diagnosis, treatment: tempBlockData.treatment.split('\n') };
        } else if (editingBlock === 'evaluacion') {
            updated.evaluation = { ...updated.evaluation, skinType: tempBlockData.skinType.split(', '), aspect: tempBlockData.aspect.split(', ') };
        } else if (editingBlock === 'antecedentes') {
            updated.background = { ...updated.background, medical: tempBlockData.medical, surgical: tempBlockData.surgical, allergic: tempBlockData.allergic.split(', ') };
        }

        try {
            await PatientsService.update(currentPatient.id, updated);
            setCurrentPatient(updated);
            setEditingBlock(null);
        } catch (err) {
            console.error("Failed to update patient block", err);
        }
    };

    const SectionCard: React.FC<{ title: string; icon: React.ReactNode; blockId: string; children: React.ReactNode }> = ({ title, icon, blockId, children }) => (
        <div className="bg-white rounded-[1.8rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-all relative group">
            <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-b border-slate-100/50 shrink-0">
                <h3 className="text-[10px] font-black text-blue-700 uppercase tracking-[0.25em] flex items-center gap-2.5">
                    {icon} {title}
                </h3>
                <button onClick={() => handleStartBlockEdit(blockId)} className="p-1.5 text-slate-300 hover:text-blue-600 transition-colors">
                    <Edit2 size={14} />
                </button>
            </div>
            <div className="p-6 md:p-8 flex-1">
                {editingBlock === blockId ? (
                    <div className="space-y-4 animate-in fade-in zoom-in-95">
                        {blockId === 'resumen' && (
                            <>
                                <textarea className="w-full bg-slate-50 p-4 border rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500" value={tempBlockData.diagnosis} onChange={e => setTempBlockData({ ...tempBlockData, diagnosis: e.target.value })} placeholder="DIAGNÓSTICO..." />
                                <textarea className="w-full bg-slate-50 p-4 border rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500 h-24" value={tempBlockData.treatment} onChange={e => setTempBlockData({ ...tempBlockData, treatment: e.target.value })} placeholder="TRATAMIENTOS (LÍNEA X LÍNEA)..." />
                            </>
                        )}
                        {blockId === 'evaluacion' && (
                            <>
                                <input className="w-full bg-slate-50 p-4 border rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500" value={tempBlockData.skinType} onChange={e => setTempBlockData({ ...tempBlockData, skinType: e.target.value })} placeholder="FOTOTIPO (SEPARADO POR COMA)..." />
                                <input className="w-full bg-slate-50 p-4 border rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500" value={tempBlockData.aspect} onChange={e => setTempBlockData({ ...tempBlockData, aspect: e.target.value })} placeholder="ASPECTO (SEPARADO POR COMA)..." />
                            </>
                        )}
                        {blockId === 'antecedentes' && (
                            <>
                                <input className="w-full bg-slate-50 p-4 border rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500" value={tempBlockData.medical} onChange={e => setTempBlockData({ ...tempBlockData, medical: e.target.value })} placeholder="MÉDICOS..." />
                                <input className="w-full bg-slate-50 p-4 border rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500" value={tempBlockData.surgical} onChange={e => setTempBlockData({ ...tempBlockData, surgical: e.target.value })} placeholder="QUIRÚRGICOS..." />
                                <input className="w-full bg-slate-50 p-4 border rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500" value={tempBlockData.allergic} onChange={e => setTempBlockData({ ...tempBlockData, allergic: e.target.value })} placeholder="ALÉRGICOS (SEPARADOS POR COMA)..." />
                            </>
                        )}
                        <div className="flex gap-2 pt-2">
                            <button onClick={saveBlockEdit} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase flex items-center gap-2"><Check size={12} /> Guardar</button>
                            <button onClick={() => setEditingBlock(null)} className="bg-slate-100 text-slate-500 px-4 py-2 rounded-lg text-[9px] font-black uppercase"><X size={12} /></button>
                        </div>
                    </div>
                ) : children}
            </div>
        </div>
    );

    if (loading) return <div className="p-20 text-center font-black uppercase text-slate-300 tracking-widest">Cargando Paciente...</div>;
    if (!currentPatient) return <div className="p-20 text-center font-black uppercase text-slate-300 text-sm tracking-widest">Paciente no encontrado</div>;

    // Initial Extraction
    const firstName = currentPatient.name.split(' ')[0] || '';
    const lastName = currentPatient.name.split(' ').slice(1).join(' ') || '';

    // Safe access wrappers for UI rendering
    const bg = (currentPatient as any).background || (currentPatient as any).antecedentes || {};
    const ev = (currentPatient as any).evaluation || {};
    const diagnosis = bg.diagnosis || 'SIN DIAGNÓSTICO';
    const treatment = Array.isArray(bg.treatment) ? bg.treatment : (bg.treatment ? [bg.treatment] : []);
    const skinType = Array.isArray(ev.skinType) ? ev.skinType : (ev.skinType ? [ev.skinType] : []);
    const aspect = Array.isArray(ev.aspect) ? ev.aspect : (ev.aspect ? [ev.aspect] : []);
    const medical = bg.medical || 'NEGATIVOS';
    const surgical = bg.surgical || 'NEGATIVOS';
    const allergic = Array.isArray(bg.allergic) ? bg.allergic : (bg.allergic ? [bg.allergic] : []);

    return (
        <div className="flex h-screen bg-slate-50 font-['Plus_Jakarta_Sans'] min-w-0 relative overflow-hidden">

            {/* LEFT COLUMN (DIRECTORY MOCK) - Only visible on large screens when not collapsed for now */}
            <aside
                className={`fixed lg:relative flex flex-col h-screen bg-[#fbfcfd] border-r border-slate-100 transition-all duration-500 ease-in-out z-[100] lg:z-[55] shrink-0 ${isPatientsCollapsed
                        ? '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 shadow-none'
                        : 'translate-x-0 w-[85%] sm:w-[300px] shadow-2xl lg:shadow-none'
                    }`}
            >
                <button
                    onClick={() => setIsPatientsCollapsed(!isPatientsCollapsed)}
                    className="hidden lg:flex absolute left-full top-[50%] -translate-y-1/2 w-8 h-28 bg-white border border-slate-200 shadow-[10px_0_30px_rgba(0,0,0,0.1)] rounded-r-2xl items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 z-[100] group"
                    style={{ marginLeft: '-1px' }}
                >
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-current opacity-20" />
                        {isPatientsCollapsed ? <ChevronRight size={20} strokeWidth={3} /> : <ChevronLeft size={20} strokeWidth={3} />}
                        <div className="w-1 h-1 rounded-full bg-current opacity-20" />
                    </div>
                </button>

                {/* To allow going back to directory */}
                <div className="p-6">
                    <button onClick={() => navigate('/dashboard/patients')} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-xs hover:text-slate-600"><ArrowLeft size={16} /> Volver</button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div ref={scrollRef} onScroll={handleScroll} className="flex-1 h-full overflow-y-auto custom-scrollbar bg-slate-50 scroll-smooth relative min-w-0">

                {/* HEADER */}
                <div className={`bg-white/95 sticky top-0 z-40 backdrop-blur-md border-b border-slate-100 transition-all duration-500 ${isCompact ? 'py-2 shadow-lg' : 'py-4 md:py-6 shadow-sm'}`}>
                    <div className={`mx-auto px-4 sm:px-6 md:px-12 w-full transition-all duration-500 max-w-7xl`}>
                        <div className={`flex items-center gap-4 md:gap-8 transition-all duration-500 ${isCompact ? 'scale-90 origin-left' : ''}`}>
                            <div className="relative shrink-0">
                                <div className="bg-[#2563eb] text-white rounded-[1.2rem] md:rounded-[1.5rem] flex items-center justify-center font-black shadow-xl border-[3px] md:border-[4px] border-white transition-all w-14 h-14 md:w-24 md:h-24 text-xl md:text-3xl uppercase">
                                    {(firstName[0] || '')}{(lastName[0] || '')}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 md:gap-6">
                                    <div className="min-w-0">
                                        <h1 className="text-lg md:text-2xl font-black text-[#0f172a] uppercase tracking-tighter leading-none truncate transition-all">{firstName} {lastName}</h1>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 md:mt-2">
                                            <span className="bg-[#eff6ff] text-[#2563eb] px-2 py-0.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase border border-[#dbeafe]">ID: {currentPatient.internalId || currentPatient.id}</span>
                                            {currentPatient.birthDate && <span className="text-[#64748b] font-black uppercase tracking-tight text-[10px] md:text-[11px] flex items-center gap-1.5 md:gap-2"><Calendar size={14} className="text-slate-300" /> {currentPatient.birthDate}</span>}
                                            {currentPatient.phone && <span className="hidden sm:flex text-[#64748b] font-black uppercase tracking-tight text-[11px] items-center gap-2"><Phone size={14} className="text-slate-300" /> {currentPatient.phone}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 md:gap-2">
                                        <button onClick={() => { }} className="p-2 md:p-3 bg-white border border-slate-100 rounded-lg md:rounded-xl text-slate-200 hover:text-blue-600 transition-all shadow-sm"><Edit2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`mx-auto p-4 md:p-12 space-y-6 md:space-y-10 pb-60 transition-all duration-500 w-full max-w-7xl`}>
                    <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
                        <SectionCard title="Resumen Clínico" icon={<Activity size={24} />} blockId="resumen">
                            <div className="space-y-4 md:space-y-6">
                                <div className="space-y-2 md:space-y-3">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Diagnóstico Principal</p>
                                    <p className="text-[12px] md:text-[13px] font-black text-slate-700 uppercase flex items-center gap-3"><div className="w-1.5 h-1.5 bg-slate-200 rounded-full shrink-0" /> {diagnosis}</p>
                                </div>
                                <div className="space-y-2 md:space-y-3 pt-4 border-t border-slate-50">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tratamiento Sugerido</p>
                                    <ul className="space-y-2">
                                        {treatment.map((t: string, i: number) => (
                                            <li key={i} className="text-[12px] md:text-[13px] font-bold text-blue-700 uppercase flex items-center gap-3"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" /> {t.trim()}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard title="Evaluación" icon={<User size={24} />} blockId="evaluacion">
                            <div className="space-y-4 md:space-y-6">
                                <div className="space-y-2 md:space-y-3">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Fototipo & Tipo</p>
                                    <div className="flex flex-wrap gap-2">
                                        {skinType.map((t: string, i: number) => (<span key={i} className="bg-slate-50 text-slate-600 px-3 py-1 rounded-lg text-[10px] md:text-[11px] font-bold uppercase border border-slate-100">{t}</span>))}
                                    </div>
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Aspecto</p>
                                    <div className="flex flex-wrap gap-2">
                                        {aspect.map((t: string, i: number) => (<span key={i} className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[10px] md:text-[11px] font-bold uppercase border border-rose-100">{t}</span>))}
                                    </div>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard title="Antecedentes" icon={<FileText size={24} />} blockId="antecedentes">
                            <div className="space-y-4 md:space-y-5">
                                <div className="space-y-1.5 md:space-y-2">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Médicos / Quirúrgicos</p>
                                    <p className="text-[12px] md:text-[13px] font-black text-slate-800 uppercase flex items-center gap-2 md:gap-3"><div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-blue-100 rounded-lg shrink-0" /> {medical} | {surgical}</p>
                                </div>
                                <div className="space-y-2 pt-4 border-t border-slate-50">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Alérgicos</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {allergic.map((a: string, i: number) => (
                                            <span key={i} className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 md:py-1 rounded-md uppercase border border-slate-200">{a}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </SectionCard>
                    </div>

                    <div className="space-y-6 md:space-y-8 pt-6 md:pt-10 border-t border-slate-100">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3 md:gap-4">
                                <History size={28} className="text-blue-600 shrink-0" /> Historial Evolutivo
                                <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-sm">
                                    <ListChecks size={14} className="text-blue-500" />
                                    <span className="text-[10px] md:text-xs font-black text-slate-700">{filteredRecords.length} VISITAS</span>
                                </div>
                            </h2>
                            <button onClick={() => setIsFilterModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-sm hover:border-blue-500 transition-all"><Filter size={18} /> Filtrar Historial</button>
                        </div>

                        <div className={`grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2`}>
                            {filteredRecords.map((rec) => {
                                const isEditing = editingRecordId === rec.id;
                                const visitAnalyses = ((currentPatient as any)?.analyses || []).filter((a: any) => a.visitId === rec.id);

                                return (
                                    <div key={rec.id} className={`bg-white rounded-[2.5rem] border overflow-hidden group/card hover:shadow-2xl transition-all flex flex-col ${isEditing ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-100 shadow-xl'}`}>
                                        {/* HEADER CARD */}
                                        <div className={`px-8 py-6 flex items-start justify-between border-b shrink-0 ${isEditing ? 'bg-blue-600 border-blue-700' : 'bg-white'}`}>
                                            <div className="flex items-center gap-5 min-w-0">
                                                <div className="w-12 h-12 rounded-[1.2rem] bg-white text-blue-600 flex items-center justify-center border border-slate-100 shadow-sm shrink-0"><Calendar size={24} strokeWidth={2.5} /></div>
                                                <div className="min-w-0">
                                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 ${isEditing ? 'text-blue-200' : 'text-slate-400'}`}>{rec.date.split('-').reverse().join('/')}</p>
                                                    {isEditing ? (
                                                        <input className="bg-blue-500 text-white text-[12px] font-black uppercase rounded px-2 py-0.5 outline-none w-full" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                                                    ) : (
                                                        <h4 className="text-[14px] font-black text-slate-900 uppercase tracking-tight truncate leading-none">{rec.title || 'VISITA DE SEGUIMIENTO'}</h4>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {isEditing ? (
                                                    <button onClick={() => handleSaveEdit(rec.id)} className="w-9 h-9 bg-white text-blue-600 rounded-xl flex items-center justify-center shadow-lg"><CheckCircle size={20} /></button>
                                                ) : (
                                                    <>
                                                        <button onClick={() => { setUploadTargetVisitId(rec.id); setIsUploadModalOpen(true); }} className="w-9 h-9 bg-white text-blue-600 border border-slate-100 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"><UploadCloud size={18} /></button>
                                                        <button onClick={() => handleStartEdit(rec)} className="w-9 h-9 bg-white text-slate-300 border border-slate-100 rounded-xl flex items-center justify-center hover:text-blue-600 transition-all shadow-sm"><Edit2 size={16} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* BODY CARD */}
                                        <div className="p-10 space-y-6 flex-1 flex flex-col">
                                            <div className="flex-1">
                                                {isEditing ? (
                                                    <textarea className="w-full h-40 bg-slate-50 border rounded-2xl p-6 text-[13px] font-medium text-slate-700 outline-none resize-none shadow-inner" value={editForm.subjective} onChange={e => setEditForm({ ...editForm, subjective: e.target.value })} />
                                                ) : (
                                                    <>
                                                        <p className="text-[10px] font-black text-blue-600/50 uppercase tracking-[0.25em] mb-6 flex items-center gap-2.5">
                                                            <Stethoscope size={16} className="text-blue-500" /> Notas Clínicas
                                                        </p>
                                                        <p className="text-[13px] font-medium text-slate-700 leading-relaxed whitespace-pre-line">{rec.notes}</p>
                                                    </>
                                                )}
                                            </div>

                                            {/* FOOTER CARD */}
                                            <div className="pt-6 flex items-center justify-between border-t border-slate-50">
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleOpenExamsForVisit(rec.id)} className="px-5 py-2.5 bg-white text-slate-500 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2">
                                                        <FileDigit size={14} /> Exámenes ({visitAnalyses.length})
                                                    </button>
                                                    <button onClick={() => setGalleryRecord(rec)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2">
                                                        <ImageIcon size={14} /> Fotos ({(rec.attachments || []).length})
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* EXAMS MODAL (Reduced for brevity, fully functional UI would be here) */}
            {isExamsModalOpen && (
                <div className="fixed inset-0 bg-slate-900/98 backdrop-blur-3xl z-[3000] flex items-center justify-center p-6 animate-in fade-in">
                    <button onClick={() => setIsExamsModalOpen(false)} className="absolute top-8 right-8 text-white"><X size={32} /></button>
                    <div className="text-white text-center">
                        <h3 className="text-2xl font-black uppercase">Explorador de Exámenes</h3>
                        <p className="text-slate-400 mt-2">Funcionalidad completa en implementación...</p>
                        <p className="text-xs mt-4 text-slate-500">Archivos disponibles: {((currentPatient as any)?.analyses || []).filter((a: any) => a.visitId === currentVisitIdForExams).length}</p>
                    </div>
                </div>
            )}

            {/* UPLOAD MODAL */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[4000] flex items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Subir Archivo Clínico</h3>
                            <button onClick={() => setIsUploadModalOpen(false)} className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={20} /></button>
                        </div>
                        <div className="p-10 space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Archivo</label>
                                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black uppercase outline-none" value={analysisForm.type} onChange={e => setAnalysisForm({ ...analysisForm, type: e.target.value })} placeholder="EJ. BIOPSIA..." />
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept={analysisForm.fileType === 'IMAGE' ? 'image/*' : 'application/pdf,image/*'} />
                            <div onClick={() => fileInputRef.current?.click()} className={`bg-slate-50 p-10 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${analysisForm.fileData ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-200'}`}>
                                {isUploading ? <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /> : <UploadCloud size={40} className="text-slate-300" />}
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{analysisForm.fileName || 'Seleccionar Archivo'}</p>
                            </div>
                        </div>
                        <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-4">
                            <button onClick={handleSaveAnalysis} disabled={!analysisForm.fileData} className="px-12 py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
