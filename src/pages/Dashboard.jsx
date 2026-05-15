import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    TrendingUp, TrendingDown, Users, Activity, AlertCircle, PlusCircle, Wallet,
    CreditCard, ShoppingCart, Store, Package, ArrowLeftRight, Award, ShoppingBag,
    Search, Scan, Clock, FileText
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { financialService } from '../services/financialService';
import { productService } from '../services/inventoryService';
import { Loader2 } from 'lucide-react';

const DashboardCard = ({ title, value, subtitle, icon: Icon, color }) => {
    const colorClasses = {
        emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</h3>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
            {subtitle && <p className="text-xs text-gray-400 mt-2 font-medium">{subtitle}</p>}
        </div>
    );
};

const QuickActionButton = ({ onClick, icon: Icon, label, color, large = false }) => {
    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400',
        rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400',
        blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
        purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400',
        amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400',
    };

    if (large) {
        return (
            <button onClick={onClick} className="w-full py-12 px-6 bg-brand-600 text-white rounded-3xl shadow-xl shadow-brand-500/20 hover:bg-brand-700 hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col items-center gap-6 group border-4 border-brand-500/30">
                <Icon size={56} className="group-hover:scale-110 transition-transform" />
                <span className="font-black text-3xl tracking-widest uppercase">{label}</span>
            </button>
        );
    }

    return (
        <button onClick={onClick} className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 group">
            <div className={`p-3 rounded-full transition-colors ${colorClasses[color]}`}>
                <Icon size={24} />
            </div>
            <span className="font-bold text-gray-700 dark:text-gray-300 text-sm text-center">{label}</span>
        </button>
    );
};

const OwnerDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await financialService.getGlobalStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch global stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);
    
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">Global SaaS Overview</h1>
                <p className="text-gray-500 font-medium text-sm">Real-time metrics across all your shops</p>
            </div>

            {/* Core Financials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardCard title="Total Shops" value={stats?.totalShops || '0'} subtitle="Active tenants" icon={Store} color="purple" />
                <DashboardCard title="Global Sales (Today)" value={`${(stats?.todaySales || 0).toLocaleString()} Fbu`} subtitle="Across all shops" icon={TrendingUp} color="emerald" />
                <DashboardCard title="Global Profit" value={`${(stats?.netProfit || 0).toLocaleString()} Fbu`} subtitle="Net after expenses" icon={Award} color="blue" />
                <DashboardCard title="Global Expenses" value={`${(stats?.totalExpenses || 0).toLocaleString()} Fbu`} subtitle="Total operations" icon={TrendingDown} color="rose" />
            </div>

            {/* Tax & Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 p-6 rounded-3xl shadow-sm text-white flex justify-between items-center relative overflow-hidden">
                    <Activity size={120} className="absolute -right-4 -bottom-4 opacity-10" />
                    <div className="relative z-10">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Tax Breakdown</p>
                        <div className="flex gap-6 mt-2">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-tighter">TVA (18%)</p>
                                <p className="font-black text-lg text-emerald-400">{(stats?.totalTva || 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Non-TVA</p>
                                <p className="font-black text-lg text-blue-400">{(stats?.totalNtva || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <DashboardCard title="Pending Transfers" value={stats?.pendingTransfers || '0'} subtitle="Requires approval" icon={ArrowLeftRight} color="amber" />
                <DashboardCard title="Low Stock Alerts" value={stats?.lowStockCount || '0'} subtitle="Global inventory warning" icon={AlertCircle} color="rose" />
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Shop */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Store className="text-brand-500" size={18} /> Top Performing Shop
                    </h3>
                    <div className="bg-brand-50 dark:bg-brand-900/10 p-4 rounded-2xl flex justify-between items-center border border-brand-100 dark:border-brand-800">
                        <div>
                            <p className="font-black text-lg text-brand-600 dark:text-brand-400">{stats?.topShop?.name || 'Loading...'}</p>
                            <p className="text-sm font-medium text-gray-500 mt-1">{(stats?.topShop?.revenue || 0).toLocaleString()} Fbu generated</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-300">
                            <Award size={24} />
                        </div>
                    </div>
                </div>

                {/* Audit Highlights */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Activity className="text-purple-500" size={18} /> Recent Security Activity
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">Stock Deduction</span>
                            <span className="text-[10px] font-black text-gray-400">2 mins ago</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">Price Rule Update</span>
                            <span className="text-[10px] font-black text-gray-400">15 mins ago</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickActionButton onClick={() => navigate('/shops')} icon={PlusCircle} label="Add Shop" color="purple" />
                <QuickActionButton onClick={() => navigate('/reports')} icon={Activity} label="Global Analytics" color="emerald" />
                <QuickActionButton onClick={() => navigate('/audit-logs')} icon={Activity} label="Security Logs" color="blue" />
                <QuickActionButton onClick={() => navigate('/users')} icon={Users} label="Manage Users" color="amber" />
            </div>
        </div>
    );
};

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const { activeShopId } = useAuth();
    const [stats, setStats] = React.useState(null);

    React.useEffect(() => {
        const fetchStats = async () => {
            if (!activeShopId) return;
            try {
                const data = await financialService.getShopStats(activeShopId);
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch shop stats", error);
            }
        };
        fetchStats();
    }, [activeShopId]);
    
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Shop Performance</h1>
                    <p className="text-gray-500 font-medium text-sm tracking-tight uppercase">Shop ID: <span className="font-bold text-brand-600">{activeShopId || '---'}</span></p>
                </div>
            </div>

            {/* Core KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardCard title="Shop Sales (Today)" value={`${(stats?.todaySales || 0).toLocaleString()} Fbu`} subtitle="+5% from avg" icon={ShoppingBag} color="emerald" />
                <DashboardCard title="Shop Expenses" value={`${(stats?.totalExpenses || 0).toLocaleString()} Fbu`} subtitle="Operations & Salaries" icon={TrendingDown} color="rose" />
                <DashboardCard title="Net Profit" value={`${(stats?.netProfit || 0).toLocaleString()} Fbu`} subtitle="Real-time margin" icon={Wallet} color="blue" />
                <DashboardCard title="Low Stock Alerts" value={stats?.lowStockCount || '0'} subtitle="Requires action" icon={AlertCircle} color="amber" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickActionButton onClick={() => navigate('/sales')} icon={ShoppingCart} label="View Sales" color="emerald" />
                <QuickActionButton onClick={() => navigate('/stock')} icon={Package} label="Manage Stock" color="amber" />
                <QuickActionButton onClick={() => navigate('/expenses')} icon={Wallet} label="Add Expense" color="rose" />
                <QuickActionButton onClick={() => navigate('/reports')} icon={FileText} label="Shop Report" color="blue" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cashier Performance */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm h-full">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Users className="text-brand-500" size={18} /> Cashier Performance
                    </h3>
                    <div className="space-y-3">
                        {(stats?.cashierPerformances || []).map((c, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div>
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{c.name}</p>
                                    <p className="text-xs text-gray-500">{c.salesCount} Tickets</p>
                                </div>
                                <span className="font-black text-emerald-600">{(c.revenue || 0).toLocaleString()} Fbu</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Products */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm h-full">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Award className="text-amber-500" size={18} /> Top Selling Products
                    </h3>
                    <div className="space-y-3">
                        {(stats?.topProducts || []).map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-black text-gray-400">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">{p.name}</p>
                                        <p className="text-xs text-gray-500">{p.soldQuantity} units sold</p>
                                    </div>
                                </div>
                                <span className="font-black text-gray-900 dark:text-white">{(p.revenue || 0).toLocaleString()} Fbu</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CashierDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = React.useState(null);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const [isSearching, setIsSearching] = React.useState(false);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await financialService.getDailyStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch daily stats", error);
            }
        };
        fetchStats();
    }, []);

    const handleSearch = async (val) => {
        setSearchQuery(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const data = await productService.getAll({ search: val });
            setSearchResults(Array.isArray(data) ? data : (data.products || []));
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
    };
    
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* BIG BUTTON */}
            <QuickActionButton 
                onClick={() => navigate('/pos')} 
                icon={ShoppingCart} 
                label="NEW SALE" 
                color="emerald"
                large={true} 
            />

            {/* Grid 1: Sales & Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Today Sales */}
                <div className="bg-gradient-to-br from-brand-500 to-brand-600 p-8 rounded-3xl shadow-lg shadow-brand-500/20 text-white relative overflow-hidden">
                    <Wallet size={140} className="absolute -right-8 -bottom-8 text-white opacity-10" />
                    <div className="relative z-10">
                        <h3 className="font-bold opacity-90 mb-2 flex items-center gap-2 uppercase tracking-widest text-xs">
                            <Clock size={16} /> My Sales Today
                        </h3>
                        <div className="text-5xl font-black mb-2 tracking-tighter">{(stats?.myTotal || 0).toLocaleString()} <span className="text-xl opacity-60">Fbu</span></div>
                        <div className="text-xs font-black bg-white/20 inline-flex items-center px-4 py-1.5 rounded-full mt-2 uppercase tracking-widest">
                            {stats?.myCount || 0} Tickets Processed
                        </div>
                    </div>
                </div>

                {/* Quick Stats: Cash & Mobile Money */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center">
                    <h3 className="font-bold text-gray-400 dark:text-gray-500 mb-4 text-[10px] uppercase tracking-[2px]">Register Breakdown</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <span className="font-black text-sm uppercase tracking-tight flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Cash</span>
                            <span className="font-black text-gray-900 dark:text-white">{(stats?.cashTotal || 0).toLocaleString()} Fbu</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <span className="font-black text-sm uppercase tracking-tight flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Mobile Money</span>
                            <span className="font-black text-gray-900 dark:text-white">{(stats?.mobileTotal || 0).toLocaleString()} Fbu</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid 2: Recent Sales & Search */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fast Search */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm h-full flex flex-col relative overflow-hidden">
                    <h3 className="font-black text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2 uppercase tracking-widest text-sm">
                        <Search className="text-brand-500" size={20} /> Fast Product Check
                    </h3>
                    <div className="relative group mb-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Type barcode or name..."
                            className="w-full pl-14 pr-6 py-5 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-black text-xl dark:text-white"
                        />
                        <Scan className="absolute left-5 top-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={28} />
                        {isSearching && <Loader2 className="absolute right-5 top-6 animate-spin text-brand-500" size={24} />}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 custom-scrollbar">
                        {searchResults.map(p => (
                            <div key={p.id} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-800 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 overflow-hidden shrink-0">
                                        <img src={p.image_url || '/placeholder-product.png'} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-gray-900 dark:text-white leading-tight">{p.name}</p>
                                        <p className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest mt-0.5">{p.barcode}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-gray-900 dark:text-white leading-none">{Number(p.sellingPrice).toLocaleString()} <span className="text-[10px]">Fbu</span></p>
                                    <p className={`text-[10px] font-black uppercase mt-1 ${p.GlobalStock?.quantity < 5 ? 'text-rose-500' : 'text-emerald-500'}`}>Stock: {p.GlobalStock?.quantity || 0}</p>
                                </div>
                            </div>
                        ))}
                        {searchQuery && searchResults.length === 0 && !isSearching && (
                            <p className="text-center py-10 text-gray-400 font-bold uppercase text-[10px] tracking-widest opacity-50">No products matching "{searchQuery}"</p>
                        )}
                    </div>
                </div>

                {/* Recent My Sales */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm h-full">
                    <h3 className="font-black text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2 uppercase tracking-widest text-sm">
                        <Activity className="text-brand-500" size={20} /> My Recent Activity
                    </h3>
                    <div className="space-y-3">
                        {(stats?.recentSales || []).map((sale, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${sale.paymentMethod === 'CASH' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <CreditCard size={18} />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-gray-900 dark:text-white">Ticket #{sale.id.split('-')[0].toUpperCase()}</p>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-tighter mt-0.5">{new Date(sale.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {sale.paymentMethod}</p>
                                    </div>
                                </div>
                                <span className="font-black text-brand-600 text-lg">+{Number(sale.total_amount).toLocaleString()} <span className="text-xs">Fbu</span></span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Redirect logic for generic /dashboard path
    React.useEffect(() => {
        if (location.pathname === '/dashboard') {
            if (user?.role === 'owner') navigate('/dashboard/admin', { replace: true });
            if (user?.role === 'manager') navigate('/dashboard/shop', { replace: true });
        }
    }, [user, location, navigate]);
    
    // Dynamic Role Routing
    if (user?.role === 'owner') return <OwnerDashboard />;
    if (user?.role === 'manager') return <ManagerDashboard />;
    if (user?.role === 'cashier' || user?.role === 'user') return <CashierDashboard />;
    
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center">
                <AlertCircle size={48} className="mx-auto text-rose-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invalid Role Detected</h2>
                <p className="text-gray-500">Please contact the system administrator.</p>
            </div>
        </div>
    );
};

export default Dashboard;
