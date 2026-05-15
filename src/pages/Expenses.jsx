import React, { useState, useEffect } from 'react';
import { expenseService } from '../services/expenseService';
import { 
    Plus, Search, Filter, MoreHorizontal, TrendingDown, 
    Calendar, DollarSign, Tag, FileText, Loader2, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        ExpenseTypeId: '',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expenseData, typeData] = await Promise.all([
                expenseService.getAll(),
                expenseService.getTypes()
            ]);
            setExpenses(Array.isArray(expenseData) ? expenseData : (expenseData.expenses || []));
            setTypes(Array.isArray(typeData) ? typeData : (typeData.types || []));
        } catch (error) {
            toast.error("Failed to load expenses");
            setExpenses([]);
            setTypes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await expenseService.create(formData);
            toast.success("Expense recorded successfully");
            setIsModalOpen(false);
            setFormData({
                ExpenseTypeId: '',
                amount: '',
                description: '',
                expense_date: new Date().toISOString().split('T')[0]
            });
            fetchData();
        } catch (error) {
            toast.error("Failed to record expense");
        }
    };

    const filteredExpenses = expenses.filter(exp => 
        exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.ExpenseType?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingDown className="text-rose-500" /> Shop Expenses
                    </h1>
                    <p className="text-gray-500 font-medium text-sm">Track and manage operational costs and salaries</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                >
                    <Plus size={20} /> Record Expense
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total This Month</p>
                    <p className="text-3xl font-black text-rose-500">
                        {expenses.reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString()} <span className="text-xs">Fbu</span>
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Most Frequent Category</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white">Operational</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Expense</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white">
                        {expenses[0] ? `${Number(expenses[0].amount).toLocaleString()} Fbu` : 'N/A'}
                    </p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Search by description or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none text-sm font-bold transition-all"
                    />
                </div>
                <button className="px-4 py-2.5 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center gap-2 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                    <Filter size={18} /> Filters
                </button>
            </div>

            {/* Table Area */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/20 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex justify-center"><Loader2 className="animate-spin text-brand-600" size={32} /></div>
                                    </td>
                                </tr>
                            ) : filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs opacity-50">
                                        No expenses found
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-lg"><Calendar size={14} /></div>
                                                <span className="font-bold text-sm text-gray-900 dark:text-white">{new Date(exp.expense_date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black px-2 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg uppercase tracking-widest">
                                                {exp.ExpenseType?.name || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-xs truncate">{exp.description}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-sm font-black text-rose-500">{Number(exp.amount).toLocaleString()} Fbu</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors">
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for adding expense */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-md w-full animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Record Expense</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><Plus className="rotate-45" size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Tag size={12} /> Category *
                                </label>
                                <select 
                                    required
                                    value={formData.ExpenseTypeId}
                                    onChange={(e) => setFormData({...formData, ExpenseTypeId: e.target.value})}
                                    className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-gray-900 dark:text-white"
                                >
                                    <option value="">Select Category</option>
                                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <DollarSign size={12} /> Amount (Fbu) *
                                </label>
                                <input 
                                    type="number"
                                    required
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-black text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar size={12} /> Date *
                                </label>
                                <input 
                                    type="date"
                                    required
                                    value={formData.expense_date}
                                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                                    className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={12} /> Description
                                </label>
                                <textarea 
                                    placeholder="Details about this expense..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows="3"
                                    className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 px-6 border border-gray-100 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 font-black transition-colors"
                                >
                                    CANCEL
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-3 px-6 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-black shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                                >
                                    RECORD
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
