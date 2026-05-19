import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    TrendingUp, Users, Loader2, DollarSign, Activity, ShoppingCart, 
    Calendar, ArrowUpRight, AlertTriangle, CheckCircle2, Download, 
    RefreshCw, ShieldAlert, PieChart, Briefcase
} from 'lucide-react';
import { financialService } from '../services/financialService';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('sales');
    const [dateRange, setDateRange] = useState('30'); // '7', '30', 'custom'
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Detailed stats
    const [globalStats, setGlobalStats] = useState(null);
    const [profitStats, setProfitStats] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [employeeSales, setEmployeeSales] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);

    const fetchAllReportData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);
        
        try {
            // Determine date parameters
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

            const [statsRes, profitRes, topProductsRes, employeeRes, auditRes] = await Promise.all([
                financialService.getGlobalStats(),
                financialService.getProfitReport(start, end),
                financialService.getTopProductsReport(10, start, end),
                financialService.getEmployeeSalesReport(start, end),
                financialService.getAuditLogsReport()
            ]);

            setGlobalStats(statsRes);
            setProfitStats(profitRes);
            setTopProducts(topProductsRes || []);
            setEmployeeSales(employeeRes || []);
            setAuditLogs(auditRes || []);
        } catch (error) {
            console.error("Failed to load comprehensive reporting system", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAllReportData();
    }, [dateRange, startDate, endDate]);

    if (loading) {
        return (
            <div className="h-full min-h-[60vh] flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-brand-600" size={56} />
                <p className="text-gray-500 font-bold uppercase text-xs tracking-[2px] animate-pulse">Assembling Enterprise Report...</p>
            </div>
        );
    }

    // Health analysis metrics
    const grossRevenue = profitStats?.gross_revenue || globalStats?.todaySales || 0;
    const cogs = profitStats?.cost_of_goods || 0;
    const grossProfit = profitStats?.gross_profit || globalStats?.netProfit || 0;
    const profitMargin = grossRevenue > 0 ? ((grossProfit / grossRevenue) * 100).toFixed(1) : '0.0';

    // Status level styling for Security Log activity feed
    const getAuditLevelStyles = (action) => {
        if (action?.includes('DELETE') || action?.includes('REMOVE') || action?.includes('CANCEL')) {
            return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
        }
        if (action?.includes('UPDATE') || action?.includes('EDIT') || action?.includes('PRICE') || action?.includes('ALERT')) {
            return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
        }
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header section with interactive export and refresh controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        System Health & Intelligence
                        {refreshing && <Loader2 className="animate-spin text-brand-600" size={20} />}
                    </h1>
                    <p className="text-sm font-medium text-gray-500">Premium real-time metrics and auditing for SaaS Administrators</p>
                </div>
                <div className="flex items-center gap-2 self-stretch md:self-auto">
                    <button 
                        onClick={() => fetchAllReportData(true)}
                        className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                        title="Reload metrics"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                    <button className="flex-1 md:flex-initial px-5 py-3 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10">
                        <Download size={18} /> Export Health Audit
                    </button>
                </div>
            </div>

            {/* Comprehensive Period Selectors */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
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

            {/* Breathtaking Financial Metrics Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Gross Revenue Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign size={90} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-2xl">
                            <DollarSign size={20} />
                        </div>
                        <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest">Gross Revenue</h3>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">
                        {grossRevenue.toLocaleString()} <span className="text-xs">Fbu</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-black mt-2 uppercase tracking-tight flex items-center gap-1">
                        <ArrowUpRight size={12} /> Stable retail volume
                    </div>
                </div>

                {/* Cost of Goods Sold Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShoppingCart size={90} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-2xl">
                            <ShoppingCart size={20} />
                        </div>
                        <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest">Cost of Goods (COGS)</h3>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">
                        {cogs.toLocaleString()} <span className="text-xs">Fbu</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-black mt-2 uppercase tracking-tight">Total stock procurement value</div>
                </div>

                {/* Gross Profit Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow border-brand-200 dark:border-brand-900/40">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={90} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 rounded-2xl">
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="font-black text-brand-600 dark:text-brand-400 text-[10px] uppercase tracking-widest">Gross Profit</h3>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">
                        {grossProfit.toLocaleString()} <span className="text-xs">Fbu</span>
                    </div>
                    <div className="text-[10px] text-brand-600 font-black mt-2 uppercase tracking-tight">True purchasing margin kept</div>
                </div>

                {/* Gross Margin Percentage Card */}
                <div className="bg-gradient-to-br from-brand-600 to-brand-700 p-6 rounded-3xl shadow-lg shadow-brand-500/10 text-white relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <PieChart size={90} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/10 text-white rounded-2xl">
                            <PieChart size={20} />
                        </div>
                        <h3 className="font-black text-brand-100 text-[10px] uppercase tracking-widest">System Gross Margin</h3>
                    </div>
                    <div className="text-4xl font-black tracking-tighter">
                        {profitMargin}%
                    </div>
                    <div className="text-[10px] font-black text-brand-200 mt-2 uppercase tracking-tight">Average product efficiency</div>
                </div>
            </div>

            {/* Deep-Dive Interactive Tab Panel Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-2 gap-2 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('sales')}
                        className={`px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${activeTab === 'sales' ? 'bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <Activity size={16} /> Sales Performance
                    </button>
                    <button 
                        onClick={() => setActiveTab('products')}
                        className={`px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${activeTab === 'products' ? 'bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <ShoppingCart size={16} /> Product Margins
                    </button>
                    <button 
                        onClick={() => setActiveTab('employees')}
                        className={`px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${activeTab === 'employees' ? 'bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <Briefcase size={16} /> Staff Sales
                    </button>
                    <button 
                        onClick={() => setActiveTab('security')}
                        className={`px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${activeTab === 'security' ? 'bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 shadow-sm border border-rose-100 dark:border-rose-900/30' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <ShieldAlert size={16} /> Security Audit Feed
                    </button>
                </div>

                <div className="p-8">
                    {/* Tab 1: Sales Analytics Graph */}
                    {activeTab === 'sales' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-sm">Revenue Flow Trend</h3>
                                    <p className="text-gray-400 text-xs mt-1">Real-time daily transaction volumes mapped chronologically</p>
                                </div>
                            </div>
                            <div className="h-[360px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={globalStats?.chartData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevReport" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.15} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 900 }} dy={15} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 900 }} tickFormatter={(val) => `${val / 1000}k`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: '#111827', padding: '16px' }}
                                            itemStyle={{ color: '#F3F4F6', fontSize: '13px', fontWeight: 'bold' }}
                                            labelStyle={{ color: '#9CA3AF', marginBottom: '8px', fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }}
                                            formatter={(value) => [`${Number(value).toLocaleString()} Fbu`, 'Gross Revenue']}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3.5} fillOpacity={1} fill="url(#colorRevReport)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Best-selling Products & Profit Margins */}
                    {activeTab === 'products' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-sm">Product Profitability Index</h3>
                                <p className="text-gray-400 text-xs mt-1">Detailed breakdowns of items driving the highest volumes and sales margins</p>
                            </div>
                            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                            <th className="px-6 py-4 font-black text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest">Product Details</th>
                                            <th className="px-6 py-4 font-black text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest text-right">Units Sold</th>
                                            <th className="px-6 py-4 font-black text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest text-right">Total Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                        {topProducts.length > 0 ? (
                                            topProducts.map((prod, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/10 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white text-sm">
                                                        {prod.Product?.name || prod.name || 'Unknown Product'}
                                                    </td>
                                                    <td className="px-6 py-4 font-black text-gray-500 dark:text-gray-400 text-sm text-right">
                                                        {Number(prod.total_sold || prod.quantity || 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 font-black text-brand-600 dark:text-brand-400 text-sm text-right">
                                                        {Number(prod.total_revenue || prod.revenue || 0).toLocaleString()} Fbu
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest opacity-55">No product data logged for this range</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Staff Performance */}
                    {activeTab === 'employees' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-sm">Staff Register Performance</h3>
                                <p className="text-gray-400 text-xs mt-1">Transaction counts and revenues registered by active cashiers and managers</p>
                            </div>
                            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                            <th className="px-6 py-4 font-black text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest">Employee Name</th>
                                            <th className="px-6 py-4 font-black text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest">Designation</th>
                                            <th className="px-6 py-4 font-black text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest text-right">Completed Sales</th>
                                            <th className="px-6 py-4 font-black text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest text-right">Revenue Contributed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                        {employeeSales.length > 0 ? (
                                            employeeSales.map((emp, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/10 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white text-sm">
                                                        {emp.User?.full_name || 'Staff Member'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border dark:border-gray-700">
                                                            {emp.User?.role || 'Staff'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-black text-gray-500 dark:text-gray-400 text-sm text-right">
                                                        {emp.total_sales || 0}
                                                    </td>
                                                    <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400 text-sm text-right">
                                                        {Number(emp.total_revenue || 0).toLocaleString()} Fbu
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest opacity-55">No employee transactions found for this range</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Security Audit Log Feed */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-sm flex items-center gap-2">
                                        <ShieldAlert className="text-rose-500" size={18} /> Compliance & System Security Logs
                                    </h3>
                                    <p className="text-gray-400 text-xs mt-1">Direct un-editable feed of modifications, critical events, and daily generations</p>
                                </div>
                            </div>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {auditLogs.length > 0 ? (
                                    auditLogs.map((log) => (
                                        <div key={log.id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border ${getAuditLevelStyles(log.actionType)}`}>
                                                    {log.actionType?.replace(/_/g, ' ') || 'ACTION'}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-gray-900 dark:text-white tracking-tight">
                                                        {log.User?.full_name || 'System Auto-Daemon'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">
                                                        Modified Table: {log.tableName || 'System'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-[9px] text-gray-400 font-black uppercase self-end sm:self-auto">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-16 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest opacity-55">No security activity logged yet</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
