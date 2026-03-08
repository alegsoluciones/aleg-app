import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation
import {
    Search, Plus,
    Clock, Filter,
    TrendingUp, Receipt, Trash2, Eye, X,
    Tag, AlertTriangle
} from 'lucide-react';
import { DashboardWidgetCard } from '../../components/dashboard/ui/DashboardWidgetCard';
import { BillingService } from '../../services/BillingService';
import { InventoryService } from '../../services/InventoryService'; // Import InventoryService
import type { InvoiceItem, PaymentMethod } from '../../types/billing';
import type { Product } from '../../types/inventory'; // Import Product Type
import { useTenantConfig } from '../../context/TenantContext';

export const BillingPage = () => {
    const { config } = useTenantConfig();
    const location = useLocation(); // Hook for state
    const [invoices, setInvoices] = useState<any[]>([]); // Using any for Invoice temporarily to match backend response
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]); // Store search results
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Invoice Form State
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [selectedPatientName, setSelectedPatientName] = useState(''); // Added Patient Name State
    const [cart, setCart] = useState<InvoiceItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
    const [discount, setDiscount] = useState(0);
    const [documentType, setDocumentType] = useState<'BOLETA' | 'FACTURA'>('BOLETA');

    // Handle incoming state from Agenda
    useEffect(() => {
        if (location.state) {
            const { patient, serviceToLoad } = location.state;
            if (patient) {
                setSelectedPatientId(patient.id);
                setSelectedPatientName(patient.name);
                setIsModalOpen(true); // Auto open modal
                // Show notification (simple alert for now, or toast if available)
                // console.log("Patient Loaded:", patient.name);
            }

            if (serviceToLoad) {
                handleSearchAndAdd(serviceToLoad);
            }

            // Clear state to avoid re-triggering? React Router state persists on reload mostly, but good practice to handle once. 
            // We can't easily clear history state without navigate replace. 
            // Instead, we rely on useEffect running on mount.
        }
    }, [location]);

    // Load Invoices
    const refreshData = async () => {
        const data = await BillingService.getInvoices();
        setInvoices(data);
    };

    useEffect(() => {
        refreshData();
    }, []);

    // Load Initial Products (Top 20 or similar)
    useEffect(() => {
        if (isModalOpen) {
            if (!searchTerm) handleSearch(''); // Load all/init on open if no search term (e.g. from auto-load)
        }
    }, [isModalOpen]);

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        setIsLoadingProducts(true);
        try {
            const results = term.trim() === '' ? await InventoryService.getAll() : await InventoryService.search(term);
            setSearchResults(results);
            return results; // Return for chaining
        } catch (error) {
            console.error("Error searching products", error);
            return [];
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const handleSearchAndAdd = async (serviceName: string) => {
        setIsModalOpen(true);
        // Special search that attempts to auto-add
        const results = await handleSearch(serviceName);

        // Exact match or single result? 
        // If we find an exact name match, add it.
        const match = results.find(p => p.name.toUpperCase() === serviceName.toUpperCase());
        if (match) {
            handleAddItem(match);
            alert(`✅ Cita de ${location.state?.patient?.name || 'paciente'} cargada para cobro: ${match.name}`);
        } else if (results.length > 0) {
            // If specific service not found but results exist, maybe user picks?
            // For now, just show results. 
        } else {
            // If nothing found for 'CONSULTA DERMATOLOGICA', maybe fallback to 'CONSULTA'? 
            // Keep it simple.
        }
    };

    // Calculate totals
    const totals = useMemo(() => {
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const discountAmount = subtotal * (discount / 100);
        const final = subtotal - discountAmount;
        return { subtotal, discountAmount, final, igv: final * 0.18 };
    }, [cart, discount]);

    const handleAddItem = (product: Product) => {
        // Stock Validation
        if (product.type === 'PRODUCT') {
            const currentInCart = cart.find(p => p.serviceId === product.id)?.quantity || 0;
            if ((product.stock || 0) - currentInCart < 1) {
                alert(`⚠️ Sin Stock Disponible: ${product.name}`);
                return;
            }
        }

        setCart(prev => {
            const existing = prev.find(p => p.serviceId === product.id);
            if (existing) {
                return prev.map(p => p.serviceId === product.id ? { ...p, quantity: p.quantity + 1 } : p);
            }
            return [...prev, {
                serviceId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1
            }];
        });
    };

    const handleRemoveItem = (serviceId: string) => {
        setCart(prev => prev.filter(p => p.serviceId !== serviceId));
    };

    const handleProcessSale = async () => {
        if (cart.length === 0) {
            alert("El carrito está vacío");
            return;
        }

        const invoiceData = {
            tenantId: config?.slug || 'demo',
            patientId: selectedPatientId || '11111111',
            patientName: selectedPatientName || 'Cliente General', // Use selectedName
            documentType,
            items: cart,
            subtotal: totals.subtotal,
            discount,
            totalAmount: totals.subtotal,
            finalAmount: totals.final,
            status: 'PAID',
            paymentMethod,
            date: new Date().toISOString().split('T')[0]
        };

        try {
            await BillingService.createInvoice(invoiceData);
            alert("✅ Venta Procesada Exitosamente");
            setIsModalOpen(false);
            refreshData();
            // Reset Form
            setCart([]);
            setDiscount(0);
            setSelectedPatientId('');
            setSelectedPatientName(''); // Reset Name
        } catch (error) {
            alert("❌ Error al procesar venta");
            console.error(error);
        }
    };

    const stats = useMemo(() => {
        return BillingService.calculateStats(invoices);
    }, [invoices]);

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Caja & Cobros</h1>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.3em] mt-3">Punto de Venta (POS)</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-3"
                >
                    <Plus size={18} strokeWidth={4} /> Nueva Venta
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardWidgetCard icon={<TrendingUp size={24} />} color="emerald" title="Ventas Hoy" className="h-40">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter mt-2">S/ {stats.totalRevenue.toFixed(2)}</h3>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Cierre diario parcial</p>
                </DashboardWidgetCard>
                <DashboardWidgetCard icon={<Receipt size={24} />} color="blue" title="Tickets" className="h-40">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter mt-2">{stats.count}</h3>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Operaciones procesadas</p>
                </DashboardWidgetCard>
                <DashboardWidgetCard icon={<Clock size={24} />} color="amber" title="Pendientes" className="h-40">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter mt-2">{stats.pending}</h3>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">Por cobrar</p>
                </DashboardWidgetCard>
            </div>

            {/* Transactions Table */}
            <DashboardWidgetCard className="p-0 overflow-hidden" title="Últimas Transacciones" icon={<Filter size={20} />}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-8 py-4">ID</th>
                                <th className="px-8 py-4">Fecha</th>
                                <th className="px-8 py-4">Cliente</th>
                                <th className="px-8 py-4">Estado</th>
                                <th className="px-8 py-4">Total</th>
                                <th className="px-8 py-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {invoices.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400 text-xs font-bold uppercase">No hay ventas registradas</td></tr>
                            ) : invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-4 font-mono text-xs font-bold text-slate-500">{inv.id.substring(0, 8)}...</td>
                                    <td className="px-8 py-4 text-xs font-bold text-slate-700">{inv.date}</td>
                                    <td className="px-8 py-4 text-sm font-black text-slate-900 uppercase">{inv.patientName}</td>
                                    <td className="px-8 py-4">
                                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' :
                                            inv.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                            }`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-sm font-black text-slate-900">S/ {Number(inv.finalAmount).toFixed(2)}</td>
                                    <td className="px-8 py-4 text-right">
                                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DashboardWidgetCard>

            {/* POS MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white w-full max-w-6xl h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">

                        {/* LEFT: Product Selection */}
                        <div className="w-full md:w-2/3 bg-slate-50 p-8 flex flex-col gap-6 border-r border-slate-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Servicios & Productos</h2>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar items..."
                                        className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto content-start pr-2">
                                {isLoadingProducts ? (
                                    <div className="col-span-3 text-center p-10 text-slate-400 font-bold uppercase text-xs">Cargando inventario...</div>
                                ) : searchResults.length === 0 ? (
                                    <div className="col-span-3 text-center p-10 text-slate-400 font-bold uppercase text-xs">No se encontraron items</div>
                                ) : searchResults.map(product => (
                                    <button
                                        key={product.id}
                                        onClick={() => handleAddItem(product)}
                                        className={`bg-white p-4 rounded-2xl border transition-all text-left group relative ${(product.type === 'PRODUCT' && (!product.stock || product.stock < 1))
                                            ? 'border-rose-100 opacity-60'
                                            : 'border-slate-200 shadow-sm hover:shadow-md hover:border-blue-500 hover:-translate-y-1'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[9px] font-black uppercase tracking-wider ${product.type === 'SERVICE' ? 'text-purple-400' : 'text-blue-400'}`}>
                                                {product.type === 'SERVICE' ? 'SERVICIO' : 'PRODUCTO'}
                                            </span>
                                            {product.type === 'PRODUCT' && (!product.stock || product.stock < 1) && (
                                                <AlertTriangle size={14} className="text-rose-500" />
                                            )}
                                        </div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase leading-tight mb-1">{product.name}</h4>
                                        <div className="flex justify-between items-end">
                                            <p className="text-lg font-black text-blue-600">S/ {product.price}</p>
                                            {product.type === 'PRODUCT' && (
                                                <span className={`text-[10px] font-bold ${product.stock && product.stock > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {product.stock || 0} unid.
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: Ticket & Payment */}
                        <div className="w-full md:w-1/3 bg-white p-8 flex flex-col h-full relative z-10 shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Ticket de Venta</h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                                        <Tag size={48} className="mb-2" />
                                        <p className="text-xs font-black uppercase text-center">Ticket Vacío<br />Seleccione items</p>
                                    </div>
                                ) : cart.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-slate-800 uppercase truncate">{item.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">x{item.quantity} · S/ {item.price}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black text-slate-900">S/ {item.price * item.quantity}</span>
                                            <button onClick={() => handleRemoveItem(item.serviceId)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary & Actions */}
                            <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl flex flex-col gap-4">
                                {/* ... Totals UI (Same as before) ... */}
                                <div className="space-y-1 pb-4 border-b border-white/10">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Subtotal</span>
                                        <span>S/ {totals.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                                        <span>IGV (18%)</span>
                                        <span>S/ {totals.igv.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total a Pagar</span>
                                    <span className="text-3xl font-black tracking-tighter">S/ {totals.final.toFixed(2)}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <select
                                        className="bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase text-white p-3 outline-none focus:bg-white/20"
                                        value={documentType}
                                        onChange={(e) => setDocumentType(e.target.value as 'BOLETA' | 'FACTURA')}
                                    >
                                        <option value="BOLETA">Boleta</option>
                                        <option value="FACTURA">Factura</option>
                                    </select>
                                    <select
                                        className="bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase text-white p-3 outline-none focus:bg-white/20"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                    >
                                        <option value="CASH">Efectivo</option>
                                        <option value="YAPE">Yape / Plin</option>
                                        <option value="POS">Tarjeta</option>
                                    </select>
                                    <button
                                        onClick={handleProcessSale}
                                        className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-900/50 transition-all active:scale-95 col-span-2"
                                    >
                                        COBRAR TICKET
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
