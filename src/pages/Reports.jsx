import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ArrowUpCircle, ArrowDownCircle, Users } from 'lucide-react';
import { getManualRevenues, getAutomaticRevenues } from '../services/revenueService';
import { getExpenses } from '../services/expenseService';
import { getCandidates } from '../services/candidateService';
import { getCandidatePayments, getSalaryPayments } from '../services/paymentService';
import { getDashboardStats } from '../services/dashboardService';
import toast from 'react-hot-toast';

const Reports = () => {
    const [data, setData] = useState([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        newCandidates: 0,
        // Added to match backend stats structure if needed, but we calculate newCandidates locally
        totalCandidates: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                console.log("📂 [Reports] Fetching consolidated report data...");
                // Fetch consolidated stats from backend for accuracy on totals
                const backendStats = await getDashboardStats();
                console.log("📊 [Reports] Backend Dashboard Stats:", backendStats);

                const [
                    manualRev,
                    autoRev,
                    expensesData,
                    candidatesData,
                    candidatePayments,
                    salaryPayments
                ] = await Promise.all([
                    getManualRevenues(),
                    getAutomaticRevenues(),
                    getExpenses(),
                    getCandidates(),
                    getCandidatePayments(),
                    getSalaryPayments()
                ]);

                console.log("📈 [Reports] Raw data received:", { manualRev, autoRev, expensesData, candidatesData, candidatePayments, salaryPayments });

                // Calculate Totals (Frontend calculation for newCandidates only)
                const newCandidates = candidatesData.filter(c => {
                    const date = new Date(c.created_at);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length;

                setStats({
                    totalRevenue: backendStats.totalRevenue,
                    totalExpenses: backendStats.totalExpenses,
                    totalCandidates: backendStats.totalCandidates,
                    newCandidates
                });

                // Prepare Chart Data (Last 6 months)
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
                // Automatic revenues
                autoRev.forEach(r => addToMonth(r.date || r.created_at, r.amount, 'revenue'));

                expensesData.forEach(e => addToMonth(e.date || e.created_at, e.amount, 'expenses'));
                salaryPayments.forEach(s => addToMonth(s.payment_date || s.created_at, s.amount, 'expenses'));

                const finalChartData = Object.values(months);
                console.log("📊 [Reports] Final chart data prepared:", finalChartData);
                setData(finalChartData);
                setLoading(false);
            } catch (error) {
                console.error("❌ [Reports] Fetch error:", error.response?.data || error.message);
                toast.error("Failed to load reports data");
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Financial Reports</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Overview of your financial performance</p>
                </div>
                <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors flex items-center gap-2">
                    <TrendingUp size={16} /> Export Report
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg"><ArrowUpCircle size={20} /></div>
                        <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase">Total Revenue</h3>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalRevenue.toLocaleString()} Fbu</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-bold mt-1">Lifetime Revenue</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg"><ArrowDownCircle size={20} /></div>
                        <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase">Total Expenses</h3>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalExpenses.toLocaleString()} Fbu</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-bold mt-1">Lifetime Expenses</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg"><Users size={20} /></div>
                        <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase">New Candidates</h3>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.newCandidates}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1">This Month</div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm h-96">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-6">Revenue vs Expenses (Last 6 Months)</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.3} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#1F2937', color: '#F3F4F6' }}
                        />
                        <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="#D1FAE5" />
                        <Area type="monotone" dataKey="expenses" stackId="1" stroke="#F43F5E" fill="#FFE4E6" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Reports;
