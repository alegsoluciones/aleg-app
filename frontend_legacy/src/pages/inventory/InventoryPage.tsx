import { useState, useEffect, useMemo } from 'react';
import {
    Search, Plus, Package, Stethoscope,
    Edit2, X
} from 'lucide-react';
import { DashboardWidgetCard } from '../../components/dashboard/ui/DashboardWidgetCard';
import { InventoryService } from '../../services/InventoryService';
import type { Product, CreateProductDto } from '../../types/inventory';
import { useTenantConfig } from '../../context/TenantContext';

export const InventoryPage = () => {
    const { config } = useTenantConfig();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ALL' | 'SERVICE' | 'PRODUCT'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState<CreateProductDto>({
        name: '',
        type: 'PRODUCT',
        price: 0,
        stock: 0,
        sku: '',
        isActive: true
    });

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await InventoryService.getAll();
            setProducts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesTab = activeTab === 'ALL' || p.type === activeTab;
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [products, activeTab, searchTerm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await InventoryService.create(formData);
            setIsModalOpen(false);
            setFormData({ name: '', type: 'PRODUCT', price: 0, stock: 0, sku: '', isActive: true });
            fetchProducts();
        } catch (error) {
            alert('Error creating product');
        }
    };

    return (
        <div className="p-6 space-y-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                        Inventario & Servicios
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">
                        Gestiona el catálogo de {config?.name}
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} />
                    Nuevo Item
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button
                        onClick={() => setActiveTab('ALL')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setActiveTab('PRODUCT')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'PRODUCT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Package size={14} /> Productos
                    </button>
                    <button
                        onClick={() => setActiveTab('SERVICE')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'SERVICE' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Stethoscope size={14} /> Servicios
                    </button>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o SKU..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <DashboardWidgetCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Nombre / SKU</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Precio</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Stock</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Estado</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Cargando inventario...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400">No hay items registrados</td></tr>
                            ) : (
                                filteredProducts.map(product => (
                                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            {product.type === 'PRODUCT' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wide border border-blue-100">
                                                    <Package size={12} /> Prod
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-wide border border-purple-100">
                                                    <Stethoscope size={12} /> Serv
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-700">{product.name}</div>
                                            {product.sku && <div className="text-xs text-slate-400 font-mono mt-0.5">{product.sku}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-600 font-bold">
                                            ${product.price ? product.price.toFixed(2) : '0.00'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {product.type === 'SERVICE' ? (
                                                <span className="text-slate-300">-</span>
                                            ) : (
                                                <span className={`font-bold ${product.stock! <= (product.minStock || 0) ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                    {product.stock}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`w-2 h-2 rounded-full mx-auto ${product.isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-300'}`} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </DashboardWidgetCard>

            {/* CREATE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight">Nuevo Item</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Type Selector */}
                            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl mb-6">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'PRODUCT' })}
                                    className={`py-2 text-xs font-bold uppercase rounded-lg transition-all ${formData.type === 'PRODUCT' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Producto Físico
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'SERVICE' })}
                                    className={`py-2 text-xs font-bold uppercase rounded-lg transition-all ${formData.type === 'SERVICE' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Servicio Médico
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre del Item</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-semibold"
                                    placeholder={formData.type === 'SERVICE' ? "Ej: Consulta General" : "Ej: Pipeta Antipulgas"}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Precio Venta</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-mono font-bold"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                {formData.type === 'PRODUCT' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Stock Inicial</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-mono font-bold"
                                            value={formData.stock}
                                            onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                        />
                                    </div>
                                )}
                            </div>

                            {formData.type === 'PRODUCT' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">SKU (Opcional)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-mono uppercase"
                                        placeholder="PROD-001"
                                        value={formData.sku}
                                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    Guardar Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
