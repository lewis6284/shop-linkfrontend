import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saleService } from '../services/saleService';
import Table, { TableRow, TableCell } from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { CreditCard, Search, Calendar, FileText, Download, Eye, DollarSign, Trash2, User as UserIcon, ShieldAlert, Check, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getImageUrl } from '../utils/imageUrl';

const Sales = () => {
    const { user, activeShopId } = useAuth();
    const [sales, setSales] = useState([]);
    const [pendingSales, setPendingSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('completed');

    // Rejection prompt modal state
    const [rejectModal, setRejectModal] = useState({
        isOpen: false,
        saleId: null,
        reason: ''
    });

    // Custom built confirmation modal state (no native JS alert/confirm!)
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        saleId: null,
        invoiceNumber: ''
    });

    useEffect(() => {
        fetchSales();
    }, [activeShopId, user]);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const params = {};
            if (activeShopId) {
                params.shop_id = activeShopId;
            }
            
            const [completedData, pendingData] = await Promise.all([
                saleService.getAll(params),
                (user?.role === 'owner' || user?.role === 'manager') 
                    ? saleService.getPendingApproval() 
                    : Promise.resolve([])
            ]);

            setSales(Array.isArray(completedData) ? completedData : (completedData?.sales || []));
            setPendingSales(Array.isArray(pendingData) ? pendingData : (pendingData?.sales || []));
        } catch (error) {
            toast.error("Failed to load transaction data");
            setSales([]);
            setPendingSales([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = (sale) => {
        setConfirmModal({
            isOpen: true,
            saleId: sale.id,
            invoiceNumber: sale.Invoice?.invoice_number || sale.invoice_number || `SAL-${sale.id.slice(0, 8)}`
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

    const handleApprove = async (saleId) => {
        const loadingMsg = toast.loading("Approving partner transaction...");
        try {
            await saleService.approve(saleId);
            toast.success("Transaction successfully approved and finalized!", { id: loadingMsg });
            fetchSales();
        } catch (error) {
            console.error(error);
            toast.error("Failed to approve sale.", { id: loadingMsg });
        }
    };

    const handleRejectClick = (saleId) => {
        setRejectModal({
            isOpen: true,
            saleId,
            reason: ''
        });
    };

    const handleConfirmReject = async () => {
        if (!rejectModal.reason.trim()) {
            toast.error("Please provide a cancellation reason");
            return;
        }
        const loadingMsg = toast.loading("Rejecting transaction...");
        try {
            await saleService.reject(rejectModal.saleId, rejectModal.reason);
            toast.success("Transaction successfully rejected and stock restored!", { id: loadingMsg });
            setRejectModal({ isOpen: false, saleId: null, reason: '' });
            fetchSales();
        } catch (error) {
            console.error(error);
            toast.error("Failed to reject sale.", { id: loadingMsg });
        }
    };

    const filteredSales = sales.filter(s => 
        s.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.User?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.Customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPendingSales = pendingSales.filter(s => 
        s.User?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.Customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openDetails = (sale) => {
        setSelectedSale(sale);
        setIsDetailsModalOpen(true);
    };

    const handlePrintInvoice = async (sale) => {
        const invoiceNum = sale.Invoice?.invoice_number || sale.invoice_number || `SAL-${sale.id.slice(0, 8)}`;
        const customerName = sale.Customer?.full_name || 'Walk-in Customer';
        const cashierName = sale.User?.full_name || 'System';
        const activeShopData = JSON.parse(localStorage.getItem('activeShopData') || '{}');
        const shopName = activeShopData?.name || "ShopLink Store";
        const shopPhone = activeShopData?.phone || "";
        const shopAddress = activeShopData?.address || "";

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const primaryColor = [15, 23, 42];
        const accentColor = [217, 119, 6];
        const textColor = [51, 65, 85];

        // Draw Company Logo
        const addImageProcess = new Promise((resolve) => {
            const img = new Image();
            img.src = getImageUrl(activeShopData?.logo_url);
            img.onload = () => {
                try {
                    doc.addImage(img, 'PNG', 20, 20, 32, 32);
                } catch (e) {
                    console.error('Failed to draw logo.png', e);
                }
                resolve();
            };
            img.onerror = () => {
                doc.setFillColor(15, 23, 42);
                doc.roundedRect(20, 20, 32, 32, 4, 4, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.text('SL', 36, 40, { align: 'center' });
                resolve();
            };
        });

        await addImageProcess;

        // Header Text Details
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text(shopName.toUpperCase(), 58, 30);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('INVOICE / FACTURE CERTIFICATE', 58, 36);
        if (shopAddress) doc.text(`Address: ${shopAddress}`, 58, 42);
        if (shopPhone) doc.text(`Phone: ${shopPhone}`, 58, 47);

        // Right Header Box (Invoice details)
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(135, 20, 55, 32, 3, 3, 'F');
        
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('INVOICE DETAIL', 140, 27);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(`Ref No: ${invoiceNum}`, 140, 33);
        doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString('en-GB')}`, 140, 38);
        doc.text(`Payment: ${sale.paymentMethod || 'CASH'}`, 140, 43);
        doc.text(`Status: ${sale.status || 'COMPLETED'}`, 140, 48);

        // Divider Line
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(20, 58, 190, 58);

        // Party Details Section
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('CLIENT DETAILS', 20, 68);
        doc.text('TRANSACTION META', 110, 68);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(`Name: ${customerName}`, 20, 74);
        doc.text('Type: Retail Customer', 20, 79);
        doc.text(`Seller: ${cashierName}`, 110, 74);
        doc.text(`Branch ID: ${activeShopId.slice(0, 8)}`, 110, 79);

        // Generate Items Table
        const tableColumns = [
            { header: 'ITEM DESCRIPTION', dataKey: 'name' },
            { header: 'UNIT PRICE', dataKey: 'price', align: 'right' },
            { header: 'QUANTITY', dataKey: 'qty', align: 'center' },
            { header: 'TOTAL (FBU)', dataKey: 'total', align: 'right' }
        ];

        const tableRows = (sale.SaleItems || []).map(item => ({
            name: (item.Product?.name || 'Unknown Product').toUpperCase(),
            price: `${Number(item.unitPrice).toLocaleString()} FBU`,
            qty: String(item.quantity),
            total: `${Number(item.total || (item.quantity * item.unitPrice)).toLocaleString()} FBU`
        }));

        autoTable(doc, {
            columns: tableColumns,
            body: tableRows,
            startY: 88,
            margin: { left: 20, right: 20 },
            styles: {
                font: 'helvetica',
                fontSize: 8,
                cellPadding: 4,
                textColor: [51, 65, 85],
                valign: 'middle'
            },
            headStyles: {
                fillColor: [15, 23, 42],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'left'
            },
            columnStyles: {
                price: { halign: 'right' },
                qty: { halign: 'center' },
                total: { halign: 'right' }
            },
            theme: 'striped'
        });

        // Totals Calculation Box
        const finalY = (doc.lastAutoTable?.finalY || doc.previousAutoTable?.finalY || 120) + 12;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('Subtotal:', 125, finalY);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`${Number(sale.subtotal || (sale.totalAmount - (sale.taxAmount || 0))).toLocaleString()} FBU`, 190, finalY, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Tax (VAT Incl):', 125, finalY + 6);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`${Number(sale.taxAmount || sale.tax_amount || 0).toLocaleString()} FBU`, 190, finalY + 6, { align: 'right' });

        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.5);
        doc.line(125, finalY + 10, 190, finalY + 10);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('GRAND TOTAL:', 125, finalY + 16);
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.text(`${Number(sale.totalAmount || sale.total_amount).toLocaleString()} FBU`, 190, finalY + 16, { align: 'right' });

        // Signatures & Stamp Section (Allocated place for signature and stamp)
        const sigY = finalY + 36;
        
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        
        // Seller Sign Area
        doc.line(20, sigY, 80, sigY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`Seller: ${cashierName}`, 20, sigY + 6);

        // Stamp / Verified Area
        doc.line(130, sigY, 190, sigY);
        doc.text('Verified Stamp & Date', 130, sigY + 6);
        
        // Stamp Box Decoration (Subtle rounded box)
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(130, sigY + 10, 60, 24, 2, 2, 'S');

        // Premium Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('THANK YOU FOR YOUR BUSINESS!', 105, pageHeight - 16, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('This is an official document generated digitally by ShopLink ERP.', 105, pageHeight - 10, { align: 'center' });

        // Save PDF File Natively
        doc.save(`Facture_${invoiceNum}.pdf`);
        toast.success("Facture PDF downloaded successfully!");
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

            {/* Owner/Manager Tabs */}
            {(user?.role === 'owner' || user?.role === 'manager') && (
                <div className="flex gap-6 border-b border-gray-100 dark:border-gray-800 pb-px mb-2">
                    <button 
                        onClick={() => { setActiveTab('completed'); setSearchTerm(''); }}
                        className={`pb-4 px-2 font-black text-xs uppercase tracking-wider border-b-4 transition-all ${
                            activeTab === 'completed' 
                                ? 'border-brand-600 text-brand-600 dark:text-brand-400' 
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        Completed Ledgers
                    </button>
                    {/* <button 
                        onClick={() => { setActiveTab('pending'); setSearchTerm(''); }}
                        className={`pb-4 px-2 font-black text-xs uppercase tracking-wider border-b-4 transition-all flex items-center gap-2 ${
                            activeTab === 'pending' 
                                ? 'border-amber-600 text-amber-600 dark:text-amber-400' 
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <ShieldAlert size={14} /> Partner Approvals
                        {pendingSales.length > 0 && (
                            <span className="bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                                {pendingSales.length}
                            </span>
                        )}
                    </button> */}
                </div>
            )}

            {/* Filter & Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder={activeTab === 'pending' ? "Search pending by Customer or Cashier..." : "Search by Invoice #, Customer, or Cashier..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 font-black text-sm uppercase tracking-wider dark:text-white"
                />
            </div>

            {/* Sales Table / Pending Table Conditional */}
            {activeTab === 'completed' ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm animate-in fade-in duration-300">
                    <Table headers={['Invoice Number', 'Seller', 'Financials', 'Actions']}>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-10">Loading...</TableCell></TableRow>
                        ) : filteredSales.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-20 text-gray-400 font-bold italic uppercase tracking-widest text-xs">No records found matching criteria</TableCell></TableRow>
                        ) : filteredSales.map(s => (
                            <TableRow key={s.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 dark:text-white uppercase leading-none mb-1">{s.Invoice?.invoice_number || s.invoice_number || `SAL-${s.id.slice(0, 8)}`}</p>
                                            <p className="text-[10px] font-mono text-gray-400">{new Date(s.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">{s.User?.full_name || 'Unknown Seller'}</p>
                                </TableCell>
                                <TableCell>
                                    <div className="font-black text-lg text-gray-900 dark:text-white tracking-tighter">
                                        {Number(s.totalAmount || s.total_amount).toLocaleString()}
                                    </div>
                                    <div className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Tax Incl: {Number(s.taxAmount || s.tax_amount).toLocaleString()}</div>
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
                                        {s.status !== 'CANCELLED' && (user?.role === 'owner' || user?.role === 'manager') && (
                                            <button 
                                                onClick={() => handleCancelClick(s)}
                                                className="p-3 bg-gray-50 dark:bg-gray-700 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                title="Cancel Sale"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                        <button onClick={() => handlePrintInvoice(s)} className="p-3 bg-gray-50 dark:bg-gray-700 text-brand-600 dark:text-brand-400 hover:bg-brand-600 hover:text-white rounded-xl transition-all shadow-sm" title="Download Invoice">
                                            <Download size={18} />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm animate-in fade-in duration-300">
                    <Table headers={['Queue Date', 'Customer Detail', 'Cashier Issuer', 'Total Amount', 'Actions']}>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
                        ) : filteredPendingSales.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-20 text-gray-400 font-bold italic uppercase tracking-widest text-xs">No pending authorization queues found</TableCell></TableRow>
                        ) : filteredPendingSales.map(s => (
                            <TableRow key={s.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 dark:text-white uppercase leading-none mb-1">Pending approval</p>
                                            <p className="text-[10px] font-mono text-gray-400">{new Date(s.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{s.Customer?.full_name || 'Walk-in Partner'}</p>
                                        <span className="inline-block text-[8px] font-black px-2 py-0.5 bg-amber-150 dark:bg-amber-950 text-amber-700 dark:text-amber-450 rounded-md tracking-wider uppercase">Partner Seller</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase">{s.User?.full_name}</p>
                                    <p className="text-[9px] text-gray-400 font-bold">POS Cashier</p>
                                </TableCell>
                                <TableCell>
                                    <div className="font-black text-lg text-amber-600 dark:text-amber-400 tracking-tighter">
                                        {Number(s.totalAmount || s.total_amount).toLocaleString()} Fbu
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase">Reserved Inventory</p>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => openDetails(s)}
                                            className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-brand-600 hover:text-white rounded-xl transition-all shadow-sm"
                                            title="Review Order details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleApprove(s.id)}
                                            className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm"
                                            title="Approve Order"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleRejectClick(s.id)}
                                            className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm"
                                            title="Reject Order"
                                        >
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>
                </div>
            )}

            {/* Sale Details Modal */}
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="TRANSACTION RECEIPT" maxWidth="max-w-2xl">
                {selectedSale && (
                    <div className="space-y-8 p-2">
                        <div className="flex justify-between items-start border-b border-dashed border-gray-200 dark:border-gray-700 pb-6">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Invoice ID</p>
                                <p className="text-xl font-black text-gray-900 dark:text-white uppercase">{selectedSale.Invoice?.invoice_number || selectedSale.invoice_number || `SAL-${selectedSale.id.slice(0, 8)}`}</p>
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
                            <button onClick={() => handlePrintInvoice(selectedSale)} className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
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

            {/* Custom Rejection reason modal */}
            <Modal 
                isOpen={rejectModal.isOpen} 
                onClose={() => setRejectModal({ isOpen: false, saleId: null, reason: '' })} 
                title="REJECT PARTNER TRANSACTION" 
                maxWidth="max-w-md"
            >
                <div className="space-y-6 p-2">
                    <p className="text-sm text-gray-500 font-medium">
                        Provide a brief explanation for rejecting this partner order. This rejection will restore all reserved stocks immediately back to physical inventory.
                    </p>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">REJECTION REASON</label>
                        <textarea
                            value={rejectModal.reason}
                            onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="e.g. Credit limit reached, pricing adjustments required..."
                            rows={3}
                            className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border rounded-2xl border-gray-250 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 font-bold dark:text-white"
                        />
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={handleConfirmReject} 
                            className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                        >
                            Reject & Restore
                        </button>
                        <button 
                            onClick={() => setRejectModal({ isOpen: false, saleId: null, reason: '' })} 
                            className="px-8 py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Sales;
