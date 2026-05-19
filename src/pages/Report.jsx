import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ArrowUpCircle, ArrowDownCircle, Users, Loader2 } from 'lucide-react';
import { financialService } from '../services/financialService';

const Reports = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await financialService.getGlobalStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to load reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-brand-600" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Financial Analytics</h1>
                    <p className="text-sm font-medium text-gray-500">Comprehensive overview of SaaS performance</p>
                </div>
                <button className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 font-bold transition-all flex items-center gap-2 shadow-sm">
                    <TrendingUp size={18} /> Export Data
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ArrowUpCircle size={100} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-2xl">
                            <ArrowUpCircle size={24} />
                        </div>
                        <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest">Total Revenue</h3>
                    </div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                        {(stats?.totalSales || 0).toLocaleString()} <span className="text-sm">Fbu</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-black mt-2 uppercase tracking-tight">+14.2% from last month</div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={100} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-2xl">
                            <TrendingUp size={24} />
                        </div>
                        <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest">Total Gross Profit</h3>
                    </div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                        {(stats?.netProfit || 0).toLocaleString()} <span className="text-sm">Fbu</span>
                    </div>
                    <div className="text-[10px] text-blue-600 font-black mt-2 uppercase tracking-tight">Across all product sales</div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users size={100} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-2xl">
                            <Users size={24} />
                        </div>
                        <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest">Total Customers</h3>
                    </div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">{stats?.totalCustomers || '0'}</div>
                    <div className="text-[10px] text-purple-600 font-black mt-2 uppercase tracking-tight">Across all shops</div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm h-[450px]">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Revenue Performance Analytics</h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Revenue Trend
                        </div>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={stats?.chartData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.2} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 900 }} dy={15} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 900 }} tickFormatter={(val) => `${val / 1000}k`} />
                        <Tooltip
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#111827', padding: '12px' }}
                            itemStyle={{ color: '#F3F4F6', fontSize: '12px', fontWeight: 'bold' }}
                            labelStyle={{ color: '#9CA3AF', marginBottom: '8px', fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Reports;


