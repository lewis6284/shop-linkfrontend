import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saleService } from '../services/saleService';
import Table, { TableRow, TableCell } from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { CreditCard, Search, Calendar, FileText, Download, Eye, DollarSign, Trash2, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const Sales = () => {
    const { user, activeShopId } = useAuth();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Custom built confirmation modal state (no native JS alert/confirm!)
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        saleId: null,
        invoiceNumber: ''
    });

    useEffect(() => {
        fetchSales();
    }, [activeShopId]);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const params = {};
            if (activeShopId) {
                params.shop_id = activeShopId;
            }
            const data = await saleService.getAll(params);
            setSales(Array.isArray(data) ? data : (data?.sales || []));
        } catch (error) {
            toast.error("Failed to load sales history");
            setSales([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = (sale) => {
        setConfirmModal({
            isOpen: true,
            saleId: sale.id,
            invoiceNumber: sale.invoice_number || `SAL-${sale.id.slice(0, 8)}`
        });
    };

    const handleConfirmCancel = async () => {
        const loadingMsg = toast.loading("Cancelling transaction...");
        try {
            await saleService.cancel(confirmModal.saleId, "Customer Return / Cancelled");
            toast.success("Transaction successfully cancelled!", { id: loadingMsg });
            setConfirmModal({ isOpen: false, saleId: null, invoiceNumber: '' });
            fetchSales(); // Refresh the list
        } catch (error) {
            console.error(error);
            toast.error("Failed to cancel sale.", { id: loadingMsg });
        }
    };

    const filteredSales = sales.filter(s => 
        s.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.User?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.Customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openDetails = (sale) => {
        setSelectedSale(sale);
        setIsDetailsModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="text-brand-600" /> Sales Ledger
                    </h1>
                    <p className="text-gray-500 font-medium text-sm">Professional transaction tracking and financial reporting</p>
                </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform"><DollarSign size={80} /></div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total Revenue</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">
                        {sales.reduce((sum, s) => sum + (s.status !== 'CANCELLED' ? Number(s.totalAmount || s.total_amount || 0) : 0), 0).toLocaleString()} <span className="text-xs font-bold text-gray-400">FBU</span>
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total Tax (VAT)</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {sales.reduce((sum, s) => sum + (s.status !== 'CANCELLED' ? Number(s.taxAmount || s.tax_amount || 0) : 0), 0).toLocaleString()} <span className="text-xs font-bold opacity-50">FBU</span>
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Order Volume</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{sales.length}</p>
                </div>
            </div>

            {/* Filter & Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by Invoice #, Customer, or Cashier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 font-black text-sm uppercase tracking-wider dark:text-white"
                />
            </div>

            {/* Sales Table */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <Table headers={['Invoice Number', 'Party Details', 'Financials', 'Payment', 'Status', 'Actions']}>
                    {loading ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-10">Loading...</TableCell></TableRow>
                    ) : filteredSales.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-20 text-gray-400 font-bold italic uppercase tracking-widest text-xs">No records found matching criteria</TableCell></TableRow>
                    ) : filteredSales.map(s => (
                        <TableRow key={s.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-5: dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900 dark:text-white uppercase leading-none mb-1">{s.invoice_number || `SAL-${s.id.slice(0, 8)}`}</p>
                                        <p className="text-[10px] font-mono text-gray-400">{new Date(s.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <UserIcon size={12} className="text-gray-400" />
                                        <p className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">{s.Customer?.full_name || 'Walk-in'}</p>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase ml-5">By: {s.User?.full_name}</p>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="font-black text-lg text-gray-900 dark:text-white tracking-tighter">
                                    {Number(s.totalAmount || s.total_amount).toLocaleString()}
                                </div>
                                <div className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Tax Incl: {Number(s.taxAmount || s.tax_amount).toLocaleString()}</div>
                            </TableCell>
                            <TableCell>
                                <StatusBadge status={s.paymentMethod || s.payment_method || 'CASH'} />
                            </TableCell>
                            <TableCell>
                                <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block ${
                                    s.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-55 text-rose-600 dark:bg-rose-950/20'
                                }`}>
                                    {s.status || 'FINALIZED'}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => openDetails(s)}
                                        className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-brand-600 hover:text-white rounded-xl transition-all shadow-sm"
                                        title="View Details"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    {s.status !== 'CANCELLED' && (
                                        <button 
                                            onClick={() => handleCancelClick(s)}
                                            className="p-3 bg-gray-50 dark:bg-gray-700 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm"
                                            title="Cancel Sale"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                    <button className="p-3 bg-gray-50 dark:bg-gray-700 text-brand-600 dark:text-brand-400 hover:bg-brand-600 hover:text-white rounded-xl transition-all shadow-sm" title="Download Invoice">
                                        <Download size={18} />
                                    </button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </Table>
            </div>

            {/* Sale Details Modal */}
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="TRANSACTION RECEIPT" maxWidth="max-w-2xl">
                {selectedSale && (
                    <div className="space-y-8 p-2">
                        <div className="flex justify-between items-start border-b border-dashed border-gray-200 dark:border-gray-700 pb-6">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Invoice ID</p>
                                <p className="text-xl font-black text-gray-900 dark:text-white uppercase">{selectedSale.invoice_number || `SAL-${selectedSale.id}`}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment Method</p>
                                <StatusBadge status={selectedSale.paymentMethod || 'CASH'} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Itemized Order</h4>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-6 space-y-4">
                                {(selectedSale.SaleItems || []).map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <p className="font-black text-sm text-gray-900 dark:text-white uppercase">{item.Product?.name || 'Unknown Product'}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">{item.quantity} x {Number(item.unitPrice).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right font-black text-gray-900 dark:text-white">
                                            {Number(item.total || (item.quantity * item.unitPrice)).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total (VAT Incl)</p>
                                        <p className="text-3xl font-black text-brand-600">{Number(selectedSale.totalAmount || selectedSale.total_amount).toLocaleString()} <span className="text-xs">FBU</span></p>
                                    </div>
                                    <div className="text-right text-[10px] font-black text-gray-400 uppercase">
                                        Tax Amount: {Number(selectedSale.taxAmount || selectedSale.tax_amount).toLocaleString()} FBU
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                                <Download size={18} /> Print Invoice
                            </button>
                            <button onClick={() => setIsDetailsModalOpen(false)} className="px-8 py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest">Close</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Custom Confirm Modal for Sale Cancellation */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, saleId: null, invoiceNumber: '' })}
                onConfirm={handleConfirmCancel}
                title="Cancel Sale Ledger Invoice"
                message={`Are you sure you want to cancel the transaction ${confirmModal.invoiceNumber}? This will automatically restore shop-specific stock levels for all products in this transaction.`}
                confirmText="Cancel Sale"
            />
        </div>
    );
};

export default Sales;
