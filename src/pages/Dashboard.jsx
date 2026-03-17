import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    Users,
    Activity,
    AlertCircle,
    PlusCircle,
    Wallet,
    UserPlus,
    CreditCard
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getManualRevenues, getAutomaticRevenues } from '../services/revenueService';
import { getExpenses } from '../services/expenseService';
import { getCandidates } from '../services/candidateService';
import { getCandidatePayments, getSalaryPayments } from '../services/paymentService';
import { getDashboardStats } from '../services/dashboardService';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        totalCandidates: 0,
        pendingApprovals: 0
    });
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch consolidated stats from backend
                const backendStats = await getDashboardStats();
                setStats(backendStats);

                // Fetch data for charts and tables (still needed for visualization)
                const [
                    manualRev,
                    autoRev,
                    expensesData,
                    candidatePayments,
                    salaryPayments
                ] = await Promise.all([
                    getManualRevenues(),
                    getAutomaticRevenues(),
                    getExpenses(),
                    getCandidatePayments(),
                    getSalaryPayments()
                ]);

                // Prepare Chart Data (Last 6 months)
                const processChartData = () => {
                    const months = {};
                    const today = new Date();
                    for (let i = 5; i >= 0; i--) {
                        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                        const monthName = d.toLocaleString('default', { month: 'short' });
                        months[monthName] = { name: monthName, revenue: 0, expenses: 0 };
                    }

                    const addToMonth = (dateStr, amount, type) => {
                        if (!dateStr) return;
                        const date = new Date(dateStr);
                        if (isNaN(date.getTime())) return;

                        const monthName = date.toLocaleString('default', { month: 'short' });
                        if (months[monthName]) {
                            months[monthName][type] += Number(amount);
                        }
                    };

                    manualRev.forEach(r => addToMonth(r.date || r.created_at, r.amount, 'revenue'));
                    candidatePayments.forEach(r => addToMonth(r.payment_date || r.created_at, r.amount, 'revenue'));
                    // Automatic revenues (if any independent ones exist)
                    autoRev.forEach(r => addToMonth(r.date || r.created_at, r.amount, 'revenue'));

                    expensesData.forEach(e => addToMonth(e.date || e.created_at, e.amount, 'expenses'));
                    salaryPayments.forEach(s => addToMonth(s.payment_date || s.created_at, s.amount, 'expenses'));

                    return Object.values(months);
                };

                setChartData(processChartData());

                // Recent Transactions
                const allTransactions = [
                    ...manualRev.map(i => ({ ...i, type: 'revenue', label: 'Manual Revenue', date: i.date || i.created_at })),
                    ...candidatePayments.map(i => ({ ...i, type: 'revenue', label: 'Candidate Payment', date: i.payment_date || i.created_at })),
                    ...expensesData.map(i => ({ ...i, type: 'expense', label: 'Expense', date: i.date || i.created_at })),
                    ...salaryPayments.map(i => ({ ...i, type: 'expense', label: 'Salary Payment', date: i.payment_date || i.created_at }))
                ].sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 5);

                setRecentTransactions(allTransactions);
                setLoading(false);

            } catch (error) {
                console.error("Dashboard fetch error:", error);
                toast.error("Failed to load dashboard data");
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400">Financial Overview & Recent Activity</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard
                    title="Total Revenue"
                    value={`${stats.totalRevenue.toLocaleString()} Fbu`}
                    icon={TrendingUp}
                    color="emerald"
                />
                <DashboardCard
                    title="Total Expenses"
                    value={`${stats.totalExpenses.toLocaleString()} Fbu`}
                    icon={TrendingDown}
                    color="rose"
                />
                <DashboardCard
                    title="Total Candidates"
                    value={stats.totalCandidates}
                    icon={Users}
                    color="blue"
                />
                <DashboardCard
                    title="Pending Approvals"
                    value={stats.pendingApprovals}
                    icon={AlertCircle}
                    color="amber"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickActionButton
                    onClick={() => navigate('/revenues')}
                    icon={PlusCircle}
                    label="Add Revenue"
                    color="emerald"
                />
                <QuickActionButton
                    onClick={() => navigate('/expenses')}
                    icon={Wallet}
                    label="Add Expense"
                    color="rose"
                />
                <QuickActionButton
                    onClick={() => navigate('/candidates')}
                    icon={UserPlus}
                    label="New Candidate"
                    color="blue"
                />
                <QuickActionButton
                    onClick={() => navigate('/payments')}
                    icon={CreditCard}
                    label="Process Payment"
                    color="purple"
                />
            </div>

            {/* Charts & Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm h-96">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-6">Revenue vs Expenses (Last 6 Months)</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                            <CartesianGrid vertical={false} stroke="#E5E7EB" strokeOpacity={0.3} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#1F2937', color: '#F3F4F6' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                            <Area type="monotone" dataKey="expenses" stroke="#F43F5E" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm h-full max-h-96 overflow-hidden flex flex-col">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 shrink-0">Recent Transactions</h3>
                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        {recentTransactions.map((t, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg shrink-0 ${t.type === 'revenue' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                        <Activity size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate pr-2">{t.label}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className={`font-bold text-sm whitespace-nowrap ${t.type === 'revenue' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {t.type === 'revenue' ? '+' : '-'}{Number(t.amount).toLocaleString()} {t.currency || 'Fbu'}
                                </span>
                            </div>
                        ))}
                        {recentTransactions.length === 0 && (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-center text-gray-400 text-sm">No recent transactions</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardCard = ({ title, value, icon: Icon, color }) => {
    const colorClasses = {
        emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
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
        </div>
    );
};

const QuickActionButton = ({ onClick, icon: Icon, label, color }) => {
    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:group-hover:bg-emerald-900/40',
        rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:group-hover:bg-rose-900/40',
        blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:group-hover:bg-blue-900/40',
        purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:group-hover:bg-purple-900/40',
    };

    return (
        <button onClick={onClick} className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group">
            <div className={`p-3 rounded-full transition-colors ${colorClasses[color]}`}>
                <Icon size={24} />
            </div>
            <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{label}</span>
        </button>
    );
};

export default Dashboard;
