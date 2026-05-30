import React, { useState, useEffect, useMemo } from 'react';
import { saleService } from '../services/saleService';
import { useAuth } from '../context/AuthContext';
import { Calendar, Download, Loader2, Search, FileText } from 'lucide-react';
import Table, { TableRow, TableCell } from '../components/Table';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const today = () => new Date().toISOString().split('T')[0];
const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
};

const Reports = () => {
    const { activeShopId } = useAuth();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30');
    const [startDate, setStartDate] = useState(daysAgo(30));
    const [endDate, setEndDate] = useState(today());
    const [search, setSearch] = useState('');

    /* ─── Fetch sales within the selected date window ─── */
    const fetchData = async () => {
        setLoading(true);
        try {
            let start = startDate;
            let end = endDate;
            if (dateRange === '7')  { start = daysAgo(7);  end = today(); }
            if (dateRange === '30') { start = daysAgo(30); end = today(); }

            const params = { start_date: start, end_date: end };
            if (activeShopId) params.shop_id = activeShopId;

            const data = await saleService.getAll(params);
            setSales(Array.isArray(data) ? data : (data?.sales || []));
        } catch (e) {
            toast.error('Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [dateRange, startDate, endDate, activeShopId]);

    /* ─── Flatten sales → one row per sale item ─── */
    const rows = useMemo(() => {
        const items = [];
        sales.forEach(sale => {
            const staffName = sale.User?.full_name || sale.cashier?.full_name || 'N/A';
            const saleDate = new Date(sale.createdAt);
            const dateStr = saleDate.toLocaleDateString('en-GB');
            const timeStr = saleDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            (sale.SaleItems || sale.items || []).forEach(item => {
                items.push({
                    product_name:   item.Product?.name || 'Unknown Product',
                    staff_name:     staffName,
                    price:          Number(item.unit_price || item.unitPrice || 0),
                    quantity:       Number(item.quantity || 1),
                    date:           dateStr,
                    time:           timeStr,
                    rawDate:        saleDate,
                });
            });
        });
        // Sort newest first
        return items.sort((a, b) => b.rawDate - a.rawDate);
    }, [sales]);

    /* ─── Client-side search filter ─── */
    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter(r =>
            r.product_name.toLowerCase().includes(q) ||
            r.staff_name.toLowerCase().includes(q)
        );
    }, [rows, search]);

    /* ─── Export to PDF ─── */
    const handleExportPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const shopData = JSON.parse(localStorage.getItem('activeShopData') || '{}');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text((shopData.name || 'ShopLink').toUpperCase() + ' — Sales Report', 14, 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Period: ${startDate} → ${endDate}   |   Generated: ${new Date().toLocaleString('en-GB')}`, 14, 25);

        autoTable(doc, {
            startY: 30,
            head: [['Product Name', 'Staff Member', 'Price (Fbu)', 'Qty', 'Date', 'Time']],
            body: filtered.map(r => [
                r.product_name,
                r.staff_name,
                r.price.toLocaleString(),
                r.quantity,
                r.date,
                r.time,
            ]),
            styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            theme: 'striped',
        });

        doc.save(`report_${startDate}_${endDate}.pdf`);
        toast.success('PDF exported successfully');
    };

    const totalRevenue = filtered.reduce((sum, r) => sum + r.price * r.quantity, 0);

    return (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="text-brand-600" /> Sales Report
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">
                        {filtered.length} line item{filtered.length !== 1 ? 's' : ''} · Total:{' '}
                        <span className="font-black text-brand-600">{totalRevenue.toLocaleString()} Fbu</span>
                    </p>
                </div>
                <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                >
                    <Download size={18} /> Export PDF
                </button>
            </div>

            {/* Date Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                {/* Quick range buttons */}
                <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl gap-1 shrink-0">
                    {[['7', 'Last 7 days'], ['30', 'Last 30 days'], ['custom', 'Custom']].map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setDateRange(val)}
                            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                                dateRange === val
                                    ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Custom date pickers */}
                {dateRange === 'custom' && (
                    <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in duration-200">
                        <div className="relative flex-1 sm:w-40">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-xl outline-none focus:border-brand-500 text-sm font-bold dark:text-white"
                            />
                        </div>
                        <span className="text-gray-400 text-xs font-bold shrink-0">to</span>
                        <div className="relative flex-1 sm:w-40">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-xl outline-none focus:border-brand-500 text-sm font-bold dark:text-white"
                            />
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="relative w-full sm:w-auto sm:ml-auto">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search product or staff..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full sm:w-56 pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 text-sm dark:text-white"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Loader2 size={36} className="animate-spin text-brand-600" />
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest animate-pulse">Loading report…</p>
                    </div>
                ) : (
                    <Table headers={['Product Name', 'Staff Member', 'Price', 'Qty', 'Date', 'Time']}>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-gray-400 font-bold">
                                    No data found for this period.
                                </TableCell>
                            </TableRow>
                        ) : filtered.map((row, idx) => (
                            <TableRow key={idx}>
                                <TableCell>
                                    <span className="font-bold text-gray-900 dark:text-white text-sm">{row.product_name}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{row.staff_name}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="font-black text-brand-600 dark:text-brand-400 text-sm">
                                        {row.price.toLocaleString()} <span className="text-[10px] font-bold text-gray-400">Fbu</span>
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">×{row.quantity}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{row.date}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono text-xs text-gray-400">{row.time}</span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>
                )}
            </div>
        </div>
    );
};

export default Reports;
