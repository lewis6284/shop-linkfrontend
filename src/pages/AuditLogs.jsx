import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Activity, Search, Filter, Loader2, User, 
    Shield, Clock, Database, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/audit-logs');
            setLogs(Array.isArray(response.data) ? response.data : (response.data.logs || []));
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

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="text-brand-600" /> Audit Logs
                </h1>
                <p className="text-gray-500 font-medium text-sm">Security and activity monitoring across all shops</p>
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
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none text-sm font-bold transition-all"
                    />
                </div>
                <button className="px-4 py-2.5 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center gap-2 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Filter size={18} /> Category
                </button>
            </div>

            {/* Logs List */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-600" size={32} /></div>
                ) : filteredLogs.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs opacity-50">
                        No activity logs found
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {filteredLogs.map(log => (
                            <div key={log.id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors flex items-start gap-4">
                                <div className={`p-3 rounded-2xl shrink-0 ${
                                    log.action_type === 'DELETE' ? 'bg-rose-50 text-rose-600' :
                                    log.action_type === 'UPDATE' ? 'bg-blue-50 text-blue-600' :
                                    'bg-emerald-50 text-emerald-600'
                                }`}>
                                    <Database size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight">{log.action_type}</span>
                                            <span className="text-gray-400 font-bold text-xs">on</span>
                                            <span className="font-black text-brand-600 dark:text-brand-400 text-sm uppercase tracking-tight">{log.table_name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <Clock size={12} /> {new Date(log.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <User size={12} className="text-gray-400" />
                                            {log.User?.full_name || 'System'}
                                        </div>
                                        {log.Shop?.name && (
                                            <div className="flex items-center gap-1">
                                                <Shield size={12} className="text-gray-400" />
                                                {log.Shop.name}
                                            </div>
                                        )}
                                    </div>
                                    {log.new_values && (
                                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 text-[10px] font-mono text-gray-500 overflow-hidden truncate">
                                            {JSON.stringify(log.new_values)}
                                        </div>
                                    )}
                                </div>
                                <ChevronRight size={18} className="text-gray-300 self-center" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
