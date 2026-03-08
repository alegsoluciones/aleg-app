import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Activity, User, Calendar, Briefcase, FileText, Upload, Loader2, 
  CheckCircle, Database, AlertCircle, Edit2, Save, X, Trash2, Undo2, ArrowLeft
} from 'lucide-react';
import { usePatients } from '../../../hooks/usePatients';
import { MedicalRecordCard } from '../../../components/MedicalRecordCard';
import { EditableField } from '../../../components/EditableField';
import { SectionEditor } from '../../../components/SectionEditor'; 
import type { Patient } from '../../../types';
import 'react-medium-image-zoom/dist/styles.css';

const fixDateDisplay = (dateString: string) => {
    if (!dateString) return 'N/A';
    const parts = dateString.split('T')[0].split('-');
    if (parts.length < 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export const LegacyExcelImporter = () => {
  const { patients, loading, isProcessing, updatePatient, revertStatus, deletePatientsBulk, deletePatient, updateRecord, deleteRecord, uploadPhotos, deletePhoto, deletePhotosBulk, importExcels, markReady, markReadyBatch, finalizeBatch, API_URL } = usePatients();

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [viewMode, setViewMode] = useState<'STAGING' | 'OFFICIAL'>('STAGING');
  
  // ✅ FIX: IDs como Strings (UUIDs)
  const [selectedIds, setSelectedIds] = useState<string[]>([]); 
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [generalData, setGeneralData] = useState<any>({});

  const filteredPatients = useMemo(() => {
      const modeFilter = (p: Patient) => viewMode === 'STAGING' ? (p.status === 'DRAFT' || p.status === 'READY') : p.status === 'ACTIVE';
      return patients.filter(modeFilter).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [patients, viewMode]);

  const readyCount = useMemo(() => patients.filter(p => p.status === 'READY').length, [patients]);

  useEffect(() => {
      if (selectedPatient) {
          const fresh = patients.find(p => p.id === selectedPatient.id);
          if (fresh) setSelectedPatient(fresh);
      }
  }, [patients]);

  useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (editingBlockId === 'general' && e.key === 'Escape') {
                cancelGeneralEdit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingBlockId]);

  const updateNestedField = async (rootField: string, newData: any) => { if (!selectedPatient) return; await updatePatient(selectedPatient.id, { [rootField]: newData }); };
  const handleRevertStatus = async () => { if (confirm('¿Revertir estado del paciente?')) await revertStatus(selectedPatient!.id); };

  const startGeneralEdit = () => {
      if (editingBlockId) { alert("⚠️ BLOQUEADO"); return; }
      if (selectedPatient) {
          setGeneralData({
              name: selectedPatient.name,
              occupation: selectedPatient.occupation || '',
              birthDate: selectedPatient.birthDate ? selectedPatient.birthDate.split('T')[0] : '',
              firstConsultationDate: selectedPatient.firstConsultationDate ? selectedPatient.firstConsultationDate.split('T')[0] : ''
          });
      }
      setEditingBlockId('general');
  };
  const cancelGeneralEdit = () => setEditingBlockId(null);
  
  const saveGeneral = async () => { 
      if (!selectedPatient) return; 
      await updatePatient(selectedPatient.id, generalData); 
      setEditingBlockId(null); 
  };
  
  const handleGeneralChange = (field: string, val: string) => {
      if (field === 'name' || field === 'occupation') {
          val = val.toUpperCase();
      }
      setGeneralData((prev: any) => ({ ...prev, [field]: val }));
  };

  const handleDeleteCurrent = async () => {
      if (!selectedPatient) return;
      if (confirm(`⚠️ ¿Eliminar a ${selectedPatient.name}?`)) {
          await deletePatient(selectedPatient.id);
          setSelectedPatient(null);
      }
  };

  // ✅ FIX: Selección sin conversión a Number
  const toggleSelection = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  
  const toggleSelectAll = () => setSelectedIds(selectedIds.length === filteredPatients.length ? [] : filteredPatients.map(p => p.id)); 
  
  const handleBulkDelete = async () => { 
      if (confirm(`¿Borrar ${selectedIds.length} pacientes?`)) { 
          await deletePatientsBulk(selectedIds); 
          setSelectedIds([]); 
          setSelectedPatient(null); 
      }
  };
  const handleApproveBatch = async () => {
      await markReadyBatch(selectedIds);
      setSelectedIds([]);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.length) { await importExcels(e.target.files); if (fileInputRef.current) fileInputRef.current.value = ''; }};

  return (
    <div className="flex h-full w-full bg-slate-50 font-sans overflow-hidden text-slate-800">
      <div className={`flex-col flex-shrink-0 z-10 bg-white border-r border-slate-200 w-full md:w-80 h-full ${selectedPatient ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 bg-white shadow-sm z-20">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 px-1">Centro de Migración</h3>
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => { setViewMode('STAGING'); setSelectedPatient(null); }} className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-md transition-all ${viewMode === 'STAGING' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Borradores</button>
                <button onClick={() => { setViewMode('OFFICIAL'); setSelectedPatient(null); }} className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-md transition-all ${viewMode === 'OFFICIAL' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Oficial</button>
            </div>
        </div>
        {viewMode === 'STAGING' && (
            <div className="p-3 md:p-4 border-b border-slate-100 bg-slate-50">
                <input type="file" ref={fileInputRef} onChange={handleExcelUpload} className="hidden" accept=".xlsx, .xls" multiple />
                 <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex justify-center items-center gap-2 font-medium transition-colors shadow-sm text-sm">
                    {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <Upload size={16}/>} <span>Subir Excels</span>
                </button>
                {readyCount > 0 && <button onClick={finalizeBatch} disabled={isProcessing} className="mt-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex justify-center items-center gap-2 font-bold transition-colors shadow-sm text-sm"><Database size={16}/> MIGRAR ({readyCount})</button>}
            </div>
        )}
        {selectedIds.length > 0 && (
            <div className="bg-slate-800 text-white p-2 flex justify-between items-center text-xs shadow-inner shrink-0">
                <span className="font-bold ml-2">{selectedIds.length} selec.</span>
                <div className="flex gap-2">
                    {viewMode === 'STAGING' && <button onClick={handleApproveBatch} className="bg-emerald-600 px-3 py-1 rounded flex gap-1 items-center">Aprobar</button>}
                    <button onClick={handleBulkDelete} className="bg-red-600 px-3 py-1 rounded flex gap-1 items-center"><Trash2 size={14}/> Borrar</button>
                </div>
            </div>
        )}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
                <input type="checkbox" checked={filteredPatients.length > 0 && selectedIds.length === filteredPatients.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300"/>
                <span className="text-xs font-bold text-slate-400 uppercase">Seleccionar todo</span>
            </div>
            {loading && <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2"><Loader2 className="animate-spin" size={24}/> Cargando...</div>}
            {filteredPatients.map(p => (
                <div key={p.id} onClick={() => setSelectedPatient(p)} className={`p-4 border-b border-slate-100 cursor-pointer transition-colors flex gap-3 items-center ${selectedPatient?.id === p.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}>
                    <input type="checkbox" checked={selectedIds.includes(p.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleSelection(p.id)} className="w-5 h-5 rounded border-slate-300"/>
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 text-sm mb-1 truncate">{p.name}</div>
                        <div className="flex justify-between items-center"><span className="text-xs text-slate-400 font-mono">{p.internalId}</span>{p.status === 'READY' && <CheckCircle size={14} className="text-emerald-500"/>}</div>
                    </div>
                </div>
            ))}
        </div>
      </div>
      {/* PANEL DETALLE (Igual que antes) */}
      <div className={`flex-col h-full overflow-hidden bg-slate-50/50 w-full md:w-auto md:flex-1 ${selectedPatient ? 'flex' : 'hidden md:flex'}`}>
        {selectedPatient ? (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin">
                <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
                    <button onClick={() => setSelectedPatient(null)} className="md:hidden flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-2 font-bold text-sm"><ArrowLeft size={18}/> Volver a la lista</button>
                    <div className={`bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 transition-all ${editingBlockId === 'general' ? 'ring-2 ring-blue-100' : ''}`}>
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                             <div className="flex-1 w-full">
                                 {editingBlockId === 'general' ? (
                                     <div className="space-y-4">
                                         <div><label className="text-[10px] font-bold text-slate-400 uppercase">Nombre</label><EditableField value={generalData.name} onSave={(v) => handleGeneralChange('name', v)} className="w-full p-2 text-lg md:text-xl font-bold border-b-2 border-blue-300 focus:outline-none uppercase" validation="name" maxLength={100} onCancel={cancelGeneralEdit}/></div>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <div><label className="text-[10px] font-bold text-slate-400 uppercase">Ocupación</label><EditableField value={generalData.occupation} onSave={(v) => handleGeneralChange('occupation', v)} className="w-full p-1 text-sm border-b border-slate-200 focus:border-blue-300 outline-none uppercase" validation="name" onCancel={cancelGeneralEdit}/></div>
                                             <div><label className="text-[10px] font-bold text-slate-400 uppercase">Nacimiento</label><input type="date" value={generalData.birthDate} onChange={e => handleGeneralChange('birthDate', e.target.value)} className="w-full p-1 text-sm border-b border-slate-200 outline-none"/></div>
                                             <div><label className="text-[10px] font-bold text-slate-400 uppercase">Fecha Historia</label><input type="date" value={generalData.firstConsultationDate} disabled={true} className="w-full p-1 text-sm border-b border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed outline-none"/></div>
                                         </div>
                                         <div className="flex gap-2 pt-2">
                                             <button onClick={saveGeneral} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2"><Save size={16}/> Guardar</button>
                                             <button onClick={cancelGeneralEdit} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold flex items-center gap-2"><X size={16}/> Cancelar</button>
                                         </div>
                                     </div>
                                 ) : (
                                     <div className="group relative">
                                         <h1 className="text-xl md:text-3xl font-bold text-slate-900 mb-2 flex flex-wrap items-center gap-2 md:gap-3">{selectedPatient.name}<button onClick={startGeneralEdit} className="text-slate-400 hover:text-blue-500 p-1"><Edit2 size={18}/></button></h1>
                                         <div className="flex flex-wrap gap-3 md:gap-6 text-slate-500 text-xs md:text-sm"><div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded"><Briefcase size={12}/> {selectedPatient.occupation || 'N/A'}</div><div className="flex items-center gap-1"><Calendar size={12}/> Nac: {fixDateDisplay(selectedPatient.birthDate || '')}</div><div className="flex items-center gap-1 text-slate-400"><FileText size={12}/> Hist: {fixDateDisplay(selectedPatient.firstConsultationDate || '')}</div></div>
                                     </div>
                                 )}
                             </div>
                             <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-end mt-4 md:mt-0">
                                 {selectedPatient.status === 'DRAFT' && <button onClick={() => markReady(selectedPatient.id)} disabled={isProcessing} className="h-10 w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white px-6 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-colors text-sm"><CheckCircle size={18}/> APROBAR</button>}
                                 {selectedPatient.status !== 'DRAFT' && <button onClick={handleRevertStatus} disabled={isProcessing} className="h-10 w-full md:w-auto bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-colors text-xs"><Undo2 size={16}/> Regresar</button>}
                                 <button onClick={handleDeleteCurrent} className="h-10 w-full md:w-auto bg-red-100 hover:bg-red-200 text-red-600 px-4 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-colors text-xs" title="Eliminar definitivamente"><Trash2 size={16}/> Borrar</button>
                             </div>
                        </div>
                    </div>
                    <SectionEditor id="clinical" title="Resumen Clínico" icon={<Activity size={16}/>} colorClass="bg-slate-50 text-slate-700" globalEditing={editingBlockId} setGlobalEditing={setEditingBlockId} data={{ diagnostico: selectedPatient.diagnostico, tratamiento: selectedPatient.tratamiento }} onSave={(data: any) => updatePatient(selectedPatient.id, data)} fieldsConfig={{ diagnostico: { uppercase: true, validation: 'name', multiline: true }, tratamiento: { uppercase: true, validation: 'text', multiline: true } }}/>
                    <SectionEditor id="eval" title="Evaluación Física" icon={<User size={16}/>} colorClass="bg-indigo-50 text-indigo-700" globalEditing={editingBlockId} setGlobalEditing={setEditingBlockId} data={selectedPatient.evaluation} onSave={(data: any) => updateNestedField('evaluation', data)} fieldsConfig={{ tipo_piel: { uppercase: true, validation: 'name', multiline: true }, aspecto: { uppercase: true, validation: 'name', multiline: true }, color: { uppercase: true, validation: 'name', multiline: true }, textura: { uppercase: true, validation: 'name', multiline: true } }}/>
                    <SectionEditor id="antecedentes" title="Antecedentes" icon={<FileText size={16}/>} colorClass="bg-sky-50 text-sky-700" globalEditing={editingBlockId} setGlobalEditing={setEditingBlockId} data={selectedPatient.antecedentes} onSave={(data: any) => updateNestedField('antecedentes', data)} fieldsConfig={{ medicos: { uppercase: true, validation: 'name', multiline: true }, alergicos: { uppercase: true, validation: 'name', multiline: true }, quirurgicos: { uppercase: true, validation: 'name', multiline: true }, medicamentos: { uppercase: true, validation: 'text', multiline: true } }}/>
                    <SectionEditor id="other" title="Otros Datos" icon={<AlertCircle size={16}/>} colorClass="bg-amber-50 text-amber-700" globalEditing={editingBlockId} setGlobalEditing={setEditingBlockId} data={selectedPatient.other_info} onSave={(data: any) => updateNestedField('other_info', data)}/>
                    <div className="pt-6 md:pt-8 pb-10">
                        <h3 className="text-lg md:text-xl font-bold text-slate-800 border-b border-slate-200 pb-4 mb-6 flex items-center"><Activity className="mr-3 text-blue-600"/> Historial Clínico</h3>
                        {selectedPatient.records && selectedPatient.records.length > 0 ? (
                            selectedPatient.records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
                                <MedicalRecordCard key={record.id} record={record} apiUrl={API_URL} editingBlockId={editingBlockId} setGlobalEditing={setEditingBlockId} onSave={updateRecord} onUpload={uploadPhotos} onDelete={deleteRecord} onDeletePhoto={deletePhoto} onDeletePhotosBulk={deletePhotosBulk}/>
                            ))
                        ) : (<div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400"><FileText size={48} className="mb-4 opacity-20"/><p>Sin historial.</p></div>)}
                    </div>
                </div>
            </div>
        ) : (
            <div className="h-full flex flex-col justify-center items-center text-slate-300">
                <div className="bg-white p-6 rounded-full shadow-sm mb-6"><Activity size={48} className="text-slate-200"/></div>
                <div className="text-xl font-light text-slate-400 px-6 text-center">Selecciona un paciente para comenzar</div>
            </div>
        )}
      </div>
    </div>
  );
}