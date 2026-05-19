import React, { useState, useEffect } from 'react';
import { financialService } from '../services/financialService';
import { 
    Activity, Search, Filter, Loader2, User, 
    Shield, Clock, Database, ChevronRight, AlertTriangle, ShieldAlert,
    Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState('30'); // '7', '30', 'custom'
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchLogs();
    }, [dateRange, startDate, endDate]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            let start = startDate;
            let end = endDate;
            
            if (dateRange === '7') {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                start = d.toISOString().split('T')[0];
                end = new Date().toISOString().split('T')[0];
            } else if (dateRange === '30') {
                const d = new Date();
                d.setDate(d.getDate() - 30);
                start = d.toISOString().split('T')[0];
                end = new Date().toISOString().split('T')[0];
            }

            const data = await financialService.getAuditLogsReport(null, start, end);
            setLogs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load audit logs", error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => 
        log.action_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.table_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.User?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Human-readable detailed description of system events based on JSON values
    const renderAuditLogDetails = (log) => {
        const action = log.action_type || '';
        const oldVal = log.old_values || {};
        const newVal = log.new_values || {};

        if (action === 'SALE_CREATE') {
            return `New completed transaction. Invoice Ref: ${newVal.invoiceNumber || 'N/A'}`;
        }
        if (action === 'SALE_CANCEL') {
            return `Transaction cancelled! Reason: "${newVal.reason || 'No reason specified'}"`;
        }
        if (action === 'PRODUCT_CREATE') {
            return `Added new product: "${newVal.name || 'Product'}" (Code: ${newVal.product_code || 'N/A'}) - Wholesale: ${Number(newVal.purchasePrice || 0).toLocaleString()} FBU, Retail: ${Number(newVal.sellingPrice || 0).toLocaleString()} FBU`;
        }
        if (action === 'PRODUCT_UPDATE') {
            const changes = [];
            if (oldVal.sellingPrice !== newVal.sellingPrice) {
                changes.push(`Price: ${Number(oldVal.sellingPrice || 0).toLocaleString()} -> ${Number(newVal.sellingPrice || 0).toLocaleString()} FBU`);
            }
            if (oldVal.purchasePrice !== newVal.purchasePrice) {
                changes.push(`Wholesale cost: ${Number(oldVal.purchasePrice || 0).toLocaleString()} -> ${Number(newVal.purchasePrice || 0).toLocaleString()} FBU`);
            }
            if (oldVal.name !== newVal.name) {
                changes.push(`Renamed: "${oldVal.name}" -> "${newVal.name}"`);
            }
            return `Product "${newVal.name || 'Product'}" updated. ${changes.join(', ') || 'Catalog details adjusted.'}`;
        }
        if (action === 'PRODUCT_DELETE') {
            return `Catalog item permanently deleted: "${oldVal.name || 'Product'}" (Code: ${oldVal.product_code || 'N/A'})`;
        }
        if (action === 'STOCK_TRANSFER') {
            return `Stock transferred successfully between locations.`;
        }
        if (action === 'STOCK_ADJUSTMENT') {
            return `Stock level manually adjusted. Quantity: ${newVal.quantity || 0}`;
        }
        return `System event successfully logged on table [${log.table_name || 'System'}].`;
    };

    const getSeverityStyles = (action) => {
        if (action?.includes('DELETE') || action?.includes('REMOVE') || action?.includes('CANCEL')) {
            return 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30';
        }
        if (action?.includes('UPDATE') || action?.includes('EDIT') || action?.includes('PRICE') || action?.includes('ALERT')) {
            return 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
        }
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="text-brand-600" /> Audit Ledger
                </h1>
                <p className="text-gray-500 font-medium text-sm">Security and activity monitoring across all shops</p>
            </div>

            {/* Comprehensive Period Selectors */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 date-selector-bar">
                <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl self-stretch sm:self-auto">
                    <button 
                        onClick={() => setDateRange('7')}
                        className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${dateRange === '7' ? 'bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                    >
                        Last 7 Days
                    </button>
                    <button 
                        onClick={() => setDateRange('30')}
                        className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${dateRange === '30' ? 'bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                    >
                        Last 30 Days
                    </button>
                    <button 
                        onClick={() => setDateRange('custom')}
                        className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${dateRange === 'custom' ? 'bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                    >
                        Custom Range
                    </button>
                </div>

                {dateRange === 'custom' && (
                    <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-2xl outline-none focus:border-brand-500 dark:text-white font-bold text-xs"
                            />
                            <Calendar size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
                        </div>
                        <span className="text-gray-400 text-xs font-bold uppercase">To</span>
                        <div className="relative flex-1 sm:flex-initial">
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-2xl outline-none focus:border-brand-500 dark:text-white font-bold text-xs"
                            />
                            <Calendar size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Search by action, table, or user..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none text-sm font-bold transition-all dark:text-white"
                    />
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-600" size={32} /></div>
                ) : filteredLogs.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs opacity-50">
                        No activity logs found for this period
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {filteredLogs.map(log => (
                            <div key={log.id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors flex items-start gap-4">
                                <div className={`p-3 rounded-2xl shrink-0 ${getSeverityStyles(log.action_type)}`}>
                                    <Database size={20} />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight">{log.action_type?.replace(/_/g, ' ')}</span>
                                            <span className="text-gray-400 font-bold text-xs">on</span>
                                            <span className="font-black text-brand-600 dark:text-brand-400 text-sm uppercase tracking-tight">{log.table_name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-900 px-2.5 py-1 rounded-lg border dark:border-gray-750">
                                            <Clock size={12} /> {new Date(log.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <User size={12} className="text-gray-400" />
                                            {log.User?.full_name || 'System Auto-Daemon'}
                                        </div>
                                        {log.Shop?.name && (
                                            <div className="flex items-center gap-1">
                                                <Shield size={12} className="text-gray-400" />
                                                {log.Shop.name}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-bold bg-gray-50 dark:bg-gray-900/50 px-3.5 py-2.5 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm leading-snug w-fit">
                                        {renderAuditLogDetails(log)}
                                    </p>
                                </div>
                                <ChevronRight size={18} className="text-gray-300 self-center shrink-0" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
