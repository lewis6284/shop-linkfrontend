import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { stockService } from '../services/stockService';
import { productService } from '../services/inventoryService';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import { 
    BarChart2, ArrowLeftRight, Package, AlertTriangle, 
    TrendingUp, Store, Filter, RefreshCw, CheckCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

const Stock = () => {
    const { user, activeShopId } = useAuth();
    const [stocks, setStocks] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [products, setProducts] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    
    // Transfer form state
    const [transferData, setTransferData] = useState({
        ProductId: '',
        fromShopId: activeShopId || '',
        toShopId: '',
        quantity: 1,
        notes: ''
    });

    useEffect(() => {
        fetchData();
        fetchAuxData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [stockData, transferData] = await Promise.all([
                user?.role === 'owner' ? stockService.getGlobalStock() : stockService.getShopStock(activeShopId),
                stockService.getTransfers()
            ]);
            setStocks(Array.isArray(stockData) ? stockData : (stockData?.stocks || []));
            setTransfers(Array.isArray(transferData) ? transferData : (transferData?.transfers || []));
        } catch (error) {
            console.error("Failed to fetch stock", error);
            toast.error("Failed to load stock data");
        } finally {
            setLoading(false);
        }
    };

    const fetchAuxData = async () => {
        try {
            const [pData, sData] = await Promise.all([
                productService.getAll(),
                api.get('/shops')
            ]);
            setProducts(Array.isArray(pData) ? pData : (pData?.products || []));
            setShops(sData.data.data || []);
        } catch (err) {
            console.error("Aux data fetch failed", err);
        }
    };

    const handleCreateTransfer = async (e) => {
        e.preventDefault();
        try {
            await stockService.createTransfer(transferData);
            toast.success("Transfer initiated successfully");
            setIsTransferModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to initiate transfer");
        }
    };

    const handleApprove = async (id) => {
        try {
            await stockService.approveTransfer(id);
            toast.success("Transfer received and stock updated");
            fetchData();
        } catch (error) {
            toast.error("Failed to process transfer");
        }
    };

    const isAuthorized = user?.role === 'owner' || user?.role === 'manager';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart2 className="text-brand-600" /> Stock & Inventory
                    </h1>
                    <p className="text-gray-500 font-medium text-sm">Monitor stock levels and manage transfers between shops</p>
                </div>
                {isAuthorized && (
                    <button
                        onClick={() => setIsTransferModalOpen(true)}
                        className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                    >
                        <ArrowLeftRight size={20} /> New Transfer
                    </button>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl"><Package size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total SKU</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stocks.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl"><AlertTriangle size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Low Stock Alerts</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                {stocks.filter(s => s.quantity <= (s.Product?.min_stock_level || 5)).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl"><ArrowLeftRight size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Pending Inbound</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                {transfers.filter(t => t.status === 'PENDING').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stock Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Live Inventory Status</h3>
                            <button onClick={fetchData} className="p-2 text-gray-400 hover:text-brand-500 transition-colors"><RefreshCw size={16} /></button>
                        </div>
                        <Table headers={['Product', 'Current Stock', 'Status']}>
                            {stocks.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-600">
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm text-gray-900 dark:text-white uppercase">{s.Product?.name}</p>
                                                <p className="text-[10px] font-mono text-gray-400">SKU: {s.Product?.sku || s.Product?.barcode}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-black text-lg text-gray-900 dark:text-white tracking-tighter">
                                            {s.quantity} <span className="text-[10px] text-gray-400 uppercase">units</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block shadow-sm ${
                                            s.quantity <= (s.Product?.min_stock_level || 5) ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                        }`}>
                                            {s.quantity <= (s.Product?.min_stock_level || 5) ? 'Critical / Low' : 'In Stock'}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </Table>
                    </div>
                </div>

                {/* Recent Transfers */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="p-6 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Internal Transfers</h3>
                        </div>
                        <div className="divide-y dark:divide-gray-700 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {transfers.length === 0 ? (
                                <div className="p-12 text-center text-gray-400 text-sm italic">No transfers registered.</div>
                            ) : transfers.map(t => (
                                <div key={t.id} className="p-5 space-y-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                                                    t.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                                }`}>{t.status}</span>
                                                <p className="text-[10px] font-mono text-gray-400">#{t.id.substring(0,6)}</p>
                                            </div>
                                            <p className="font-black text-sm text-gray-900 dark:text-white uppercase leading-tight">{t.Product?.name}</p>
                                        </div>
                                        <span className="font-black text-xl text-brand-600">x{t.quantity}</span>
                                    </div>
                                    <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-900 p-2 rounded-xl text-[10px] font-bold text-gray-500">
                                        <span className="truncate flex-1">{t.FromShop?.name || 'Central'}</span>
                                        <ArrowLeftRight size={10} className="text-brand-500" />
                                        <span className="truncate flex-1 text-right">{t.ToShop?.name}</span>
                                    </div>
                                    {t.status === 'PENDING' && (user?.role === 'owner' || t.toShopId === activeShopId) && (
                                        <button 
                                            onClick={() => handleApprove(t.id)}
                                            className="w-full py-3 bg-brand-600 text-white hover:bg-brand-700 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10"
                                        >
                                            <CheckCircle size={14} /> Mark as Received
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Transfer Modal */}
            <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="New Stock Transfer" maxWidth="max-w-xl">
                <form onSubmit={handleCreateTransfer} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Select Product</label>
                            <select 
                                required
                                value={transferData.ProductId}
                                onChange={e => setTransferData({...transferData, ProductId: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20"
                            >
                                <option value="">Choose a product...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku || p.barcode})</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Destination Shop</label>
                                <select 
                                    required
                                    value={transferData.toShopId}
                                    onChange={e => setTransferData({...transferData, toShopId: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20"
                                >
                                    <option value="">Select shop...</option>
                                    {shops.filter(s => s.id !== activeShopId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Quantity</label>
                                <input 
                                    type="number"
                                    required
                                    min="1"
                                    value={transferData.quantity}
                                    onChange={e => setTransferData({...transferData, quantity: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Transfer Notes</label>
                            <textarea 
                                value={transferData.notes}
                                onChange={e => setTransferData({...transferData, notes: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl font-medium dark:text-white outline-none h-20"
                                placeholder="Reason for transfer, priority, etc."
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsTransferModalOpen(false)} className="flex-1 py-4 border border-gray-200 dark:border-gray-700 rounded-xl font-black text-xs uppercase text-gray-500 hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="flex-1 py-4 bg-brand-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:bg-brand-700 transition-all">Initiate Transfer</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Stock;
