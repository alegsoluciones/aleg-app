import React, { useState, useEffect } from 'react';
import { useTenantConfig } from '../context/TenantContext';
import axios from '../api/axios';
import { Save, Upload, Building, Palette, Phone, Mail, Globe, MapPin } from 'lucide-react';

export const SettingsPage = () => {
    const { config, refreshConfig } = useTenantConfig();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [branding, setBranding] = useState({
        color: '#3b82f6', // Default Blue
        logoUrl: ''
    });

    const [contact, setContact] = useState({
        address: '',
        phone: '',
        website: '',
        email: ''
    });

    // Load initial values
    useEffect(() => {
        if (config) {
            setBranding({
                color: config.branding?.color || '#3b82f6',
                logoUrl: config.branding?.logoUrl || ''
            });
            setContact({
                address: config.contact?.address || '',
                phone: config.contact?.phone || '',
                website: config.contact?.website || '',
                email: config.contact?.email || ''
            });
        }
    }, [config]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await axios.post('/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Update state with new URL
            setBranding(prev => ({ ...prev, logoUrl: res.data.url }));
        } catch (error) {
            console.error('Error uploading logo:', error);
            alert('Error al subir el logo');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await axios.patch('/tenants/me/config', {
                branding,
                contact
            });
            await refreshConfig();
            alert('Configuración guardada exitosamente');
        } catch (error) {
            console.error('Error saving config:', error);
            alert('Error al guardar cambios');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Building className="text-primary" />
                    Configuración de Empresa
                </h1>
                <p className="text-slate-500 mt-1">Personaliza la identidad visual y datos de contacto de tu organización.</p>
            </header>

            {/* SECCIÓN IDENTIDAD VISUAL */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-700 mb-6 flex items-center gap-2">
                    <Palette size={20} /> Identidad Visual
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Logo Upload */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-600">Logo Corporativo</label>
                        <div className="flex items-center gap-4">
                            <div className="h-24 w-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                                {branding.logoUrl ? (
                                    <img src={branding.logoUrl} alt="Logo Preview" className="h-full w-full object-contain p-2" />
                                ) : (
                                    <span className="text-xs text-slate-400 text-center px-2">Sin Logo</span>
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors text-sm font-medium gap-2">
                                    <Upload size={16} />
                                    {uploading ? 'Subiendo...' : 'Subir Imagen'}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                                </label>
                                <p className="text-xs text-slate-400 mt-2">Recomendado: PNG o SVG transparente.</p>
                            </div>
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-600">Color Principal</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="color"
                                value={branding.color}
                                onChange={(e) => setBranding(prev => ({ ...prev, color: e.target.value }))}
                                className="h-12 w-12 rounded-lg cursor-pointer border-0 p-1 bg-white shadow-sm"
                            />
                            <div className="flex-1">
                                <div className="text-sm font-mono bg-slate-100 px-3 py-1 rounded text-slate-600 inline-block">
                                    {branding.color.toUpperCase()}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Este color se aplicará en botones, encabezados y bordes activos.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECCIÓN CONTACTO */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-700 mb-6 flex items-center gap-2">
                    <Phone size={20} /> Datos de Contacto
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <MapPin size={14} /> Dirección Física
                        </label>
                        <input
                            type="text"
                            className="input-base w-full p-2 border rounded-md"
                            placeholder="Ej: Av. Principal 123, Oficina 404"
                            value={contact.address}
                            onChange={(e) => setContact(prev => ({ ...prev, address: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <Phone size={14} /> Teléfono / WhatsApp
                        </label>
                        <input
                            type="text"
                            className="input-base w-full p-2 border rounded-md"
                            placeholder="+57 300 123 4567"
                            value={contact.phone}
                            onChange={(e) => setContact(prev => ({ ...prev, phone: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <Globe size={14} /> Sitio Web
                        </label>
                        <input
                            type="text"
                            className="input-base w-full p-2 border rounded-md"
                            placeholder="www.miclinica.com"
                            value={contact.website}
                            onChange={(e) => setContact(prev => ({ ...prev, website: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <Mail size={14} /> Email Público
                        </label>
                        <input
                            type="email"
                            className="input-base w-full p-2 border rounded-md"
                            placeholder="contacto@miclinica.com"
                            value={contact.email}
                            onChange={(e) => setContact(prev => ({ ...prev, email: e.target.value }))}
                        />
                    </div>
                </div>
            </section>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
                    style={{ backgroundColor: branding.color }} // Live Preview!
                >
                    <Save size={18} />
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </div>
    );
};
