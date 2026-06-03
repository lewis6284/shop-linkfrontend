import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { stockService } from '../services/stockService';
import { productService } from '../services/inventoryService';
import { supplierService } from '../services/supplierService';
import { purchaseService } from '../services/purchaseService';
import userService from '../services/userService';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { 
    BarChart2, ArrowLeftRight, Package, AlertTriangle, 
    TrendingUp, Store, Filter, RefreshCw, CheckCircle, Plus, Edit2, X, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/imageUrl';
import SearchableProductSelect from '../components/SearchableProductSelect';

const Stock = () => {
    const { user, activeShopId } = useAuth();
    const [stocks, setStocks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStocks = useMemo(() => {
        if (!searchTerm.trim()) return stocks;
        const query = searchTerm.toLowerCase().trim();
        return stocks.filter(s => {
            const name = s.Product?.name?.toLowerCase() || '';
            const sku = s.Product?.sku?.toLowerCase() || '';
            const barcode = s.Product?.barcode?.toLowerCase() || '';
            return name.includes(query) || sku.includes(query) || barcode.includes(query);
        });
    }, [stocks, searchTerm]);
    
    // Confirmation Modal state
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        type: 'info'
    });

    const closeConfirmModal = () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    };

    const [transfers, setTransfers] = useState([]);
    const [products, setProducts] = useState([]);
    const [shops, setShops] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
    const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
    
    // Transfer form state
    const [transferData, setTransferData] = useState({
        ProductId: '',
        fromShopId: activeShopId || '',
        toShopId: '',
        quantity: 1,
        notes: ''
    });

    // Add Stock form state
    const [addStockData, setAddStockData] = useState({
        product_id: '',
        quantity: '',
        shop_id: activeShopId || '',
        supplier_id: '',
        description: ''
    });

    // Adjust Stock form state
    const [adjustStockData, setAdjustStockData] = useState({
        product_id: '',
        quantity: '',
        shop_id: activeShopId || '',
        reason: 'ADJUSTMENT',
        description: ''
    });

    const [filterShopId, setFilterShopId] = useState(activeShopId);
    const [activeTab, setActiveTab] = useState('inventory');

    useEffect(() => {
        setFilterShopId(activeShopId);
        if (!activeShopId) {
            setStocks([]);
            setTransfers([]);
            setProducts([]);
            return;
        }
        fetchData();
        fetchAuxData();
    }, [activeShopId]);

    const fetchData = async () => {
        if (!activeShopId) return;
        try {
            setLoading(true);
            const params = { shop_id: activeShopId };

            const [stockData, transferData] = await Promise.all([
                stockService.getAll(params),
                stockService.getTransfers(params)
            ]);
            setStocks(Array.isArray(stockData?.data) ? stockData.data : (stockData || []));
            setTransfers(Array.isArray(transferData?.data) ? transferData.data : (transferData || []));
        } catch (error) {
            console.error("Failed to fetch stock", error);
            toast.error("Failed to load stock data");
            setStocks([]);
            setTransfers([]);
        } finally {
            setLoading(false);
        }
    };

    /** Shop catalog for pickers — scoped via X-Shop-Id (same as POS product API). */
    const fetchAuxData = async () => {
        if (!activeShopId) {
            setProducts([]);
            return;
        }
        try {
            const [pData, sData, suppData] = await Promise.all([
                productService.getAll(),
                user?.role === 'owner' ? userService.getShops() : Promise.resolve({ data: [] }),
                supplierService.getAll()
            ]);
            setProducts(Array.isArray(pData) ? pData : (pData?.products || []));
            setShops(Array.isArray(sData?.data) ? sData.data : (sData?.shops || []));
            setSuppliers(Array.isArray(suppData) ? suppData : (suppData?.suppliers || []));
        } catch (err) {
            console.error("Aux data fetch failed", err);
            setProducts([]);
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
            toast.success("Transfer completed — stock moved to destination warehouse!");
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to complete transfer");
        }
    };

    const handleCancel = (id) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Cancel Stock Transfer',
            message: 'Are you sure you want to cancel this transfer? This action cannot be undone.',
            confirmText: 'Cancel Transfer',
            cancelText: 'Keep Transfer',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await stockService.cancelTransfer(id);
                    toast.success('Transfer cancelled.');
                    fetchData();
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to cancel transfer');
                } finally {
                    closeConfirmModal();
                }
            }
        });
    };

    const handleAddStock = async (e) => {
        e.preventDefault();
        try {
            if (addStockData.supplier_id) {
                await purchaseService.create({
                    purchaseData: {
                        SupplierId: addStockData.supplier_id,
                        ShopId: addStockData.shop_id || activeShopId,
                        notes: addStockData.description
                    },
                    items: [{
                        ProductId: addStockData.product_id,
                        quantityPurchased: addStockData.quantity,
                        unitPrice: 0,
                        totalPrice: 0
                    }]
                });
            } else {
                await stockService.addStock(addStockData);
            }
            toast.success("Stock added successfully");
            setIsAddStockModalOpen(false);
            setAddStockData({ product_id: '', quantity: '', shop_id: activeShopId || '', supplier_id: '', description: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add stock");
        }
    };

    const handleAdjustStock = async (e) => {
        e.preventDefault();
        try {
            await stockService.adjustStock(adjustStockData);
            toast.success("Stock adjusted successfully");
            setIsAdjustStockModalOpen(false);
            setAdjustStockData({ ...adjustStockData, product_id: '', quantity: '', description: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to adjust stock");
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
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsTransferModalOpen(true)}
                            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 border border-gray-200 dark:border-gray-700"
                        >
                            <ArrowLeftRight size={20} /> New Transfer
                        </button>
                        <button
                            onClick={() => setIsAddStockModalOpen(true)}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                        >
                            <Plus size={20} /> Receive Stock
                        </button>
                    </div>
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
                <button onClick={() => setActiveTab('transfers')} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-brand-200 hover:shadow-md transition-all text-left w-full">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl"><ArrowLeftRight size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Pending Inbound</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                {transfers.filter(t => t.status === 'PENDING').length}
                            </p>
                            <p className="text-[10px] text-brand-500 font-bold mt-1">Click to view →</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <Package size={14} /> Inventory
                </button>
                {isAuthorized && (
                    <button
                        onClick={() => setActiveTab('transfers')}
                        className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'transfers' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <ArrowLeftRight size={14} /> Transfers
                        {transfers.filter(t => t.status === 'PENDING').length > 0 && (
                            <span className="bg-amber-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                                {transfers.filter(t => t.status === 'PENDING').length}
                            </span>
                        )}
                    </button>
                )}
            </div>

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="p-6 border-b dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-gray-50/50 dark:bg-gray-900/50">
                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Live Inventory</h3>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full sm:w-56 pl-9 pr-8 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 text-xs font-semibold text-gray-700 dark:text-white"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                        <button onClick={fetchData} className="p-2 text-gray-400 hover:text-brand-500 transition-colors shrink-0"><RefreshCw size={16} /></button>
                    </div>
                </div>
                        <Table headers={['Product', 'Location', 'Quantity', 'Total Value', 'Status', isAuthorized ? 'Actions' : '']}>
                            {filteredStocks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        <div className="py-10 text-center text-gray-400 text-sm italic">
                                            {searchTerm ? 'No products match your search query.' : 'No stock items registered yet.'}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredStocks.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {s.Product?.image_url ? (
                                                    <img src={getImageUrl(s.Product.image_url, 'placeholder-product.png')} alt={s.Product.name} className="w-10 h-10 rounded-xl object-cover border border-gray-100 dark:border-gray-600 shadow-sm" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-600">
                                                        <Package size={20} />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-black text-sm text-gray-900 dark:text-white uppercase">{s.Product?.name}</p>
                                                    <p className="text-[10px] font-mono text-gray-400">SKU: {s.Product?.sku || s.Product?.barcode}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Store size={14} className="text-gray-400" />
                                                <span className="font-bold text-xs text-gray-700 dark:text-gray-300">
                                                    {s.Shop?.name || 'Global Warehouse'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {(() => {
                                                const fullProduct = products.find(p => p.id === s.ProductId);
                                                const unitLabel = 
                                                    s.Product?.Unit?.short_name ||
                                                    fullProduct?.Unit?.short_name ||
                                                    fullProduct?.unit?.short_name ||
                                                    'pcs';
                                                return (
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="font-black text-xl text-gray-900 dark:text-white tracking-tighter">
                                                            {Math.floor(Number(s.quantity))}
                                                        </span>
                                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                                            {unitLabel}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-black text-sm text-brand-600 dark:text-brand-400">
                                                    {(s.quantity * (s.Product?.purchasePrice || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-[10px] font-bold text-gray-400">Fbu</span>
                                                </div>
                                                <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                                                    Cost Value
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block shadow-sm ${
                                                s.quantity <= (s.Product?.min_stock_level || 5) ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                            }`}>
                                                {s.quantity <= (s.Product?.min_stock_level || 5) ? 'Critical / Low' : 'In Stock'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {isAuthorized && (
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setTransferData({
                                                                ...transferData,
                                                                ProductId: s.ProductId,
                                                                fromShopId: s.ShopId || ''
                                                            });
                                                            setIsTransferModalOpen(true);
                                                        }}
                                                        className="p-2 bg-gray-100 hover:bg-brand-50 hover:text-brand-600 dark:bg-gray-700 dark:hover:bg-brand-900/30 dark:text-gray-300 dark:hover:text-brand-400 rounded-xl transition-all"
                                                        title="Transfer Stock"
                                                    >
                                                        <ArrowLeftRight size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setAdjustStockData({
                                                                ...adjustStockData,
                                                                product_id: s.ProductId,
                                                                shop_id: s.ShopId || activeShopId || '',
                                                                quantity: s.quantity
                                                            });
                                                            setIsAdjustStockModalOpen(true);
                                                        }}
                                                        className="p-2 bg-gray-100 hover:bg-brand-50 hover:text-brand-600 dark:bg-gray-700 dark:hover:bg-brand-900/30 dark:text-gray-300 dark:hover:text-brand-400 rounded-xl transition-all"
                                                        title="Adjust Stock Count"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </Table>
            </div>
            )}

            {/* Transfers Tab */}
            {activeTab === 'transfers' && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <div>
                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Stock Transfers</h3>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">Initiate, approve and track inter-warehouse transfers</p>
                    </div>
                    {isAuthorized && (
                        <button
                            onClick={() => {
                                setTransferData({
                                    ProductId: '',
                                    fromShopId: activeShopId || '',
                                    toShopId: '',
                                    quantity: 1,
                                    notes: ''
                                });
                                setIsTransferModalOpen(true);
                            }}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all"
                        >
                            <Plus size={14} /> New Transfer
                        </button>
                    )}
                </div>
                <Table headers={['Product', 'Route', 'Qty', 'Status', 'Date', 'Actions']}>
                    {transfers.length === 0 ? (
                        <TableRow>
                            <TableCell><div className="py-10 text-center text-gray-400 text-sm italic col-span-6">No transfers registered yet.</div></TableCell>
                        </TableRow>
                    ) : transfers.map(t => (
                        <TableRow key={t.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center border border-gray-100 dark:border-gray-600">
                                        <Package size={16} className="text-gray-400" />
                                    </div>
                                    <p className="font-black text-sm text-gray-900 dark:text-white uppercase">{t.Product?.name}</p>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                                    <span className="truncate max-w-[80px]">{t.FromShop?.name || 'Central'}</span>
                                    <ArrowLeftRight size={10} className="text-brand-500 shrink-0" />
                                    <span className="truncate max-w-[80px]">{t.ToShop?.name || '—'}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="font-black text-lg text-brand-600">×{t.Quantity || t.quantity}</span>
                            </TableCell>
                            <TableCell>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block ${
                                    t.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                    t.status === 'APPROVED' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                    t.status === 'IN_TRANSIT' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                    t.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                    'bg-gray-100 text-gray-500 border border-gray-200'
                                }`}>{t.status}</span>
                            </TableCell>
                            <TableCell>
                                <span className="text-[10px] font-mono text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {t.status === 'PENDING' && isAuthorized && (
                                        <button
                                            onClick={() => handleApprove(t.id)}
                                            className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5 shadow shadow-emerald-500/10"
                                        >
                                            <CheckCircle size={12} /> Complete
                                        </button>
                                    )}
                                    {t.status === 'PENDING' && isAuthorized && (
                                        <button
                                            onClick={() => handleCancel(t.id)}
                                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5"
                                        >
                                            <X size={12} /> Cancel
                                        </button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </Table>
            </div>
            )}


            {/* Transfer Modal */}
            <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="New Stock Transfer" maxWidth="max-w-xl">
                <form onSubmit={handleCreateTransfer} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Select Product</label>
                            <SearchableProductSelect
                                products={products}
                                value={transferData.ProductId}
                                onChange={(id) => setTransferData({...transferData, ProductId: id})}
                                required
                                placeholder="Search product by name or SKU..."
                            />
                        </div>

                        {user?.role === 'owner' && (
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Source Shop / Warehouse</label>
                                <select 
                                    required
                                    value={transferData.fromShopId}
                                    onChange={e => setTransferData({...transferData, fromShopId: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20"
                                >
                                    <option value="">Choose source shop...</option>
                                    {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Destination Shop</label>
                                <select 
                                    required
                                    value={transferData.toShopId}
                                    onChange={e => setTransferData({...transferData, toShopId: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20"
                                >
                                    <option value="">Select destination...</option>
                                    {shops.filter(s => s.id !== (transferData.fromShopId || activeShopId)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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

            {/* Add/Receive Stock Modal */}
            <Modal isOpen={isAddStockModalOpen} onClose={() => setIsAddStockModalOpen(false)} title="Receive New Stock" maxWidth="max-w-xl">
                <form onSubmit={handleAddStock} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Select Product</label>
                            <SearchableProductSelect
                                products={products}
                                value={addStockData.product_id}
                                onChange={(id) => setAddStockData({...addStockData, product_id: id})}
                                required
                                placeholder="Search product by name or SKU..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {user?.role === 'owner' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Receiving Shop</label>
                                    <select 
                                        value={addStockData.shop_id || ''}
                                        onChange={e => setAddStockData({...addStockData, shop_id: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20"
                                    >
                                        <option value="">Global Inventory</option>
                                        {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Quantity Received</label>
                                <input 
                                    type="number"
                                    required
                                    min="1"
                                    value={addStockData.quantity}
                                    onChange={e => setAddStockData({...addStockData, quantity: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20"
                                    placeholder="+ Units"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Supplier (Optional)</label>
                            <select 
                                value={addStockData.supplier_id}
                                onChange={e => setAddStockData({...addStockData, supplier_id: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20"
                            >
                                <option value="">No Supplier (Manual Intake)</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Supplier Invoice / Notes</label>
                            <textarea 
                                value={addStockData.description}
                                onChange={e => setAddStockData({...addStockData, description: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl font-medium dark:text-white outline-none h-20"
                                placeholder="Invoice numbers, supplier info..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsAddStockModalOpen(false)} className="flex-1 py-4 border border-gray-200 dark:border-gray-700 rounded-xl font-black text-xs uppercase text-gray-500 hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all">Receive Stock</button>
                    </div>
                </form>
            </Modal>

            {/* Adjust Stock Modal */}
            <Modal isOpen={isAdjustStockModalOpen} onClose={() => setIsAdjustStockModalOpen(false)} title="Adjust Inventory Count" maxWidth="max-w-xl">
                <form onSubmit={handleAdjustStock} className="space-y-6">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900">
                        <div className="flex gap-3">
                            <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 leading-snug">
                                This sets the <span className="font-black">absolute new total quantity</span>. It will automatically calculate the difference (+ or -) and log the adjustment for auditing.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Target Product</label>
                                <select 
                                    required
                                    disabled
                                    value={adjustStockData.product_id}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border rounded-xl font-bold dark:text-white outline-none opacity-80"
                                >
                                    <option value="">Select a product...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">New Absolute Quantity</label>
                                <input 
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={adjustStockData.quantity}
                                    onChange={e => setAdjustStockData({...adjustStockData, quantity: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl font-black text-lg text-brand-600 dark:text-brand-400 outline-none focus:ring-2 focus:ring-brand-500/20 text-center"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Reason</label>
                            <select 
                                required
                                value={adjustStockData.reason}
                                onChange={e => setAdjustStockData({...adjustStockData, reason: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20"
                            >
                                <option value="ADJUSTMENT">General Adjustment</option>
                                <option value="DAMAGE">Damaged Goods</option>
                                <option value="LOSS">Loss / Theft</option>
                                <option value="COUNT">Physical Count Audit</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Audit Notes</label>
                            <textarea 
                                required
                                value={adjustStockData.description}
                                onChange={e => setAdjustStockData({...adjustStockData, description: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl font-medium dark:text-white outline-none h-20"
                                placeholder="Why is this count changing? This is permanently audited."
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsAdjustStockModalOpen(false)} className="flex-1 py-4 border border-gray-200 dark:border-gray-700 rounded-xl font-black text-xs uppercase text-gray-500 hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="flex-1 py-4 bg-brand-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:bg-brand-700 transition-all">Submit Adjustment</button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText}
                cancelText={confirmConfig.cancelText}
                type={confirmConfig.type}
            />
        </div>
    );
};

export default Stock;
