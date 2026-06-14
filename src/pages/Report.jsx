import React, { useState, useEffect, useMemo } from 'react';
import { saleService } from '../services/saleService';
import { financialService } from '../services/financialService';
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
    const [inventory, setInventory] = useState([]);
    const [availableColumns, setAvailableColumns] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState(['product_name', 'quantity_sold', 'remaining_quantity', 'total_revenue', 'gross_profit']);
    const [reportType, setReportType] = useState('sales');
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

            if (reportType === 'inventory') {
                const data = await financialService.getInventoryReport(start, end);
                setInventory(Array.isArray(data?.rows) ? data.rows : []);
                setAvailableColumns(Array.isArray(data?.availableColumns) ? data.availableColumns : []);
                if (selectedColumns.length === 0 && Array.isArray(data?.availableColumns)) {
                    setSelectedColumns(data.availableColumns.slice(0, 6).map(col => col.key));
                }
                return;
            }

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

    useEffect(() => { fetchData(); }, [dateRange, startDate, endDate, activeShopId, reportType]);

    /* ─── Flatten sales → one row per sale item ─── */
    const salesRows = useMemo(() => {
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

    const inventoryRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return inventory;
        return inventory.filter(item => item.product_name.toLowerCase().includes(q));
    }, [inventory, search]);

    // Totals for inventory numeric columns (used for footer row)
    const inventoryTotals = useMemo(() => {
        const totals = {};
        (inventoryRows || []).forEach(r => {
            // sum commonly used numeric fields if present
            totals.total_revenue = (totals.total_revenue || 0) + Number(r.total_revenue || 0);
            totals.total_cost = (totals.total_cost || 0) + Number(r.total_cost || r.total_costs || 0);
            totals.gross_profit = (totals.gross_profit || 0) + Number(r.gross_profit || 0);
        });
        return totals;
    }, [inventoryRows]);

    const filtered = useMemo(() => {
        if (reportType === 'inventory') return inventoryRows;
        if (!search.trim()) return salesRows;
        const q = search.toLowerCase();
        return salesRows.filter(r =>
            r.product_name.toLowerCase().includes(q) ||
            r.staff_name.toLowerCase().includes(q)
        );
    }, [reportType, salesRows, inventoryRows, search]);

    /* ─── Export to PDF ─── */
    const handleExportPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const shopData = JSON.parse(localStorage.getItem('activeShopData') || '{}');
        const reportTitle = reportType === 'inventory' ? 'Inventory Report' : 'Sales Report';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text((shopData.name || 'ShopLink').toUpperCase() + ` — ${reportTitle}`, 14, 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Period: ${startDate} → ${endDate}   |   Generated: ${new Date().toLocaleString('en-GB')}`, 14, 25);

        const head = reportType === 'inventory'
            ? availableColumns.filter(col => selectedColumns.includes(col.key)).map(col => col.label)
            : ['Product Name', 'Staff Member', 'Price (Fbu)', 'Qty', 'Date', 'Time'];

        const body = filtered.map(r => {
            if (reportType === 'inventory') {
                return availableColumns
                    .filter(col => selectedColumns.includes(col.key))
                    .map(col => {
                        const value = r[col.key];
                        return typeof value === 'number' ? value.toLocaleString() : String(value || '');
                    });
            }
            return [
                r.product_name,
                r.staff_name,
                r.price.toLocaleString(),
                r.quantity,
                r.date,
                r.time,
            ];
        });

        // Append totals row for inventory export
        if (reportType === 'inventory' && availableColumns && availableColumns.length > 0) {
            const totalsRow = availableColumns
                .filter(col => selectedColumns.includes(col.key))
                .map(col => {
                    if (col.key === 'product_name') return 'Total';
                    if (col.key === 'total_revenue') return (inventoryTotals.total_revenue || 0).toLocaleString();
                    if (col.key === 'total_cost' || col.key === 'total_costs') return (inventoryTotals.total_cost || 0).toLocaleString();
                    if (col.key === 'gross_profit') return (inventoryTotals.gross_profit || 0).toLocaleString();
                    return '';
                });
            body.push(totalsRow);
        }

        autoTable(doc, {
            startY: 30,
            head: [head],
            body,
            styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            theme: 'striped',
        });

        doc.save(`report_${reportType}_${startDate}_${endDate}.pdf`);
        toast.success('PDF exported successfully');
    };

    const totalRevenue = filtered.reduce((sum, r) => {
        if (reportType === 'inventory') return sum + Number(r.total_revenue || 0);
        return sum + r.price * r.quantity;
    }, 0);

    const visibleColumns = reportType === 'inventory'
        ? availableColumns.filter(col => selectedColumns.includes(col.key))
        : [
            { key: 'product_name', label: 'Product Name' },
            { key: 'staff_name', label: 'Staff Member' },
            { key: 'price', label: 'Price' },
            { key: 'quantity', label: 'Qty' },
            { key: 'date', label: 'Date' },
            { key: 'time', label: 'Time' }
        ];

    return (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="text-brand-600" /> {reportType === 'inventory' ? 'Inventory Report' : 'Sales Report'}
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
                <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl gap-1 shrink-0">
                    {[['sales','Sales'], ['inventory','Inventory']].map(([val,label]) => (
                        <button
                            key={val}
                            type="button"
                            onClick={() => setReportType(val)}
                            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                                reportType === val
                                    ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
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
                    <>
                        {reportType === 'inventory' && availableColumns.length > 0 && (
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                <p className="text-xs uppercase tracking-widest font-black text-gray-500 dark:text-gray-400 mb-2">Columns</p>
                                <div className="flex flex-wrap gap-2">
                                    {availableColumns.map(col => {
                                        const active = selectedColumns.includes(col.key);
                                        return (
                                            <button
                                                key={col.key}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedColumns(prev =>
                                                        prev.includes(col.key)
                                                            ? prev.filter(key => key !== col.key)
                                                            : [...prev, col.key]
                                                    );
                                                }}
                                                className={`px-3 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                                                    active
                                                        ? 'bg-brand-600 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                                                }`}
                                            >
                                                {col.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <Table headers={visibleColumns.map(col => col.label)}>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={visibleColumns.length || 1} className="text-center py-20 text-gray-400 font-bold">
                                        No data found for this period.
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map((row, idx) => (
                                <TableRow key={idx}>
                                    {visibleColumns.map(col => (
                                        <TableCell key={col.key}>
                                            {reportType === 'inventory' ? (
                                                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                                                    {typeof row[col.key] === 'number' ? Number(row[col.key]).toLocaleString() : row[col.key]}
                                                </span>
                                            ) : (
                                                col.key === 'price' ? (
                                                    <span className="font-black text-brand-600 dark:text-brand-400 text-sm">
                                                        {row.price.toLocaleString()} <span className="text-[10px] font-bold text-gray-400">Fbu</span>
                                                    </span>
                                                ) : col.key === 'quantity' ? (
                                                    <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">×{row.quantity}</span>
                                                ) : col.key === 'staff_name' ? (
                                                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{row.staff_name}</span>
                                                ) : col.key === 'date' ? (
                                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{row.date}</span>
                                                ) : col.key === 'time' ? (
                                                    <span className="font-mono text-xs text-gray-400">{row.time}</span>
                                                ) : (
                                                    <span className="font-bold text-gray-900 dark:text-white text-sm">{row.product_name}</span>
                                                )
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                            {/* Totals row for inventory */}
                            {reportType === 'inventory' && filtered.length > 0 && (
                                <TableRow>
                                    {visibleColumns.map(col => (
                                        <TableCell key={col.key} className={col.key === 'product_name' ? 'font-black text-gray-900 dark:text-white' : 'font-bold text-gray-700 dark:text-gray-300'}>
                                            {col.key === 'product_name' ? (
                                                <span className="text-sm">Total</span>
                                            ) : (col.key === 'total_revenue' ? (
                                                <span className="text-sm">{(inventoryTotals.total_revenue || 0).toLocaleString()}</span>
                                            ) : col.key === 'total_cost' || col.key === 'total_costs' ? (
                                                <span className="text-sm">{(inventoryTotals.total_cost || 0).toLocaleString()}</span>
                                            ) : col.key === 'gross_profit' ? (
                                                <span className="text-sm">{(inventoryTotals.gross_profit || 0).toLocaleString()}</span>
                                            ) : (
                                                <span className="text-sm text-gray-400">&nbsp;</span>
                                            ))}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            )}
                        </Table>
                    </>
                )}
            </div>
        </div>
    );
};

export default Reports;
