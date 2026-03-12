import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Mail, Shield, User, Loader2, Save } from 'lucide-react';
import { Modal } from '../components/Modal';

interface StaffUser {
    id: number;
    fullName: string;
    email: string;
    role: 'ADMIN' | 'DOCTOR' | 'STAFF';
    isActive: boolean;
}

export const StaffPage = () => {
    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    const [users, setUsers] = useState<StaffUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'STAFF' });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setUsers(await res.json());
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                await fetchUsers();
                setIsModalOpen(false);
                setFormData({ fullName: '', email: '', password: '', role: 'STAFF' });
            } else {
                alert('Error creando usuario');
            }
        } catch (error) { console.error(error); } finally { setIsCreating(false); }
    };

    const getRoleBadge = (role: string) => {
        const styles = {
            'ADMIN': 'bg-purple-100 text-purple-700 border-purple-200',
            'DOCTOR': 'bg-blue-100 text-blue-700 border-blue-200',
            'STAFF': 'bg-slate-100 text-slate-700 border-slate-200'
        };
        return styles[role as keyof typeof styles] || styles['STAFF'];
    };

    return (
        <div className="p-8 h-full bg-slate-50 font-sans">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="text-blue-600"/> Gestión de Equipo
                    </h1>
                    <p className="text-slate-500 text-sm">Administra el acceso del personal de la clínica.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition">
                    <Plus size={20}/> Nuevo Usuario
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Nombre</th>
                            <th className="px-6 py-4">Rol</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={4} className="p-8 text-center text-slate-400">Cargando...</td></tr> : 
                        users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 transition">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-700">{u.fullName}</div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10}/> {u.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold border ${getRoleBadge(u.role)}`}>{u.role}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`w-2 h-2 rounded-full inline-block mr-2 ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                    <span className="text-sm text-slate-600">{u.isActive ? 'Activo' : 'Inactivo'}</span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-blue-600 hover:underline cursor-pointer">Editar</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Colaborador">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Completo</label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-2.5 text-slate-400"/>
                            <input autoFocus type="text" required className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Juan Perez" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})}/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Correo Corporativo</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-2.5 text-slate-400"/>
                            <input type="email" required className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="usuario@clinica.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}/>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Rol</label>
                            <div className="relative">
                                <Shield size={18} className="absolute left-3 top-2.5 text-slate-400"/>
                                <select className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                    <option value="STAFF">Personal (Staff)</option>
                                    <option value="DOCTOR">Médico</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña</label>
                            <input type="password" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="******" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}/>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition">Cancelar</button>
                        <button type="submit" disabled={isCreating} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-70">
                            {isCreating ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Guardar
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};