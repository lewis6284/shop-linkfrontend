import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { getExpenses, createExpense, deleteExpense } from '../services/expenseService';
import { useGlobal } from '../context/GlobalContext';
import { Plus, TrendingDown, Trash2, QrCode, AlertCircle, Calendar, Hash, Tag, User, Users, FileText, CreditCard, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

const Expenses = () => {
    const { expenseCategories, accounts, employees, suppliers, refreshGlobalData } = useGlobal();
    const [expenses, setExpenses] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);

    const [expenseForm, setExpenseForm] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category_id: '',
        beneficiary_type: 'OTHER', // SUPPLIER, EMPLOYEE, OTHER
        beneficiary_id: '',
        account_id: '',
        description: ''
    });

    useEffect(() => {
        loadExpenses();
        // Ensure global data is fresh
        refreshGlobalData();
    }, []);

    const loadExpenses = async () => {
        try {
            console.log("📂 [Expenses] Fetching all expenses...");
            const data = await getExpenses();
            console.log("✅ [Expenses] Received data:", data);
            setExpenses(data);
        } catch (error) {
            console.error("❌ [Expenses] Load failed:", error);
            toast.error('Failed to load expenses');
        }
    };

    const handleCreateExpense = async (e) => {
        e.preventDefault();
        console.log("📤 [Expenses] Recording manual expense:", expenseForm);
        try {
            await createExpense(expenseForm);
            toast.success(`Expense recorded successfully`);
            setIsAddModalOpen(false);
            loadExpenses();
            setExpenseForm({ date: new Date().toISOString().split('T')[0], amount: '', category_id: '', beneficiary_type: 'OTHER', beneficiary_id: '', account_id: '', description: '' });
        } catch (error) {
            console.error("❌ [Expenses] Record failed:", error.response?.data || error.message);
            toast.error('Failed to record expense');
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return;
        try {
            await deleteExpense(id);
            toast.success('Expense deleted');
            loadExpenses();
        } catch (error) {
            toast.error('Failed to delete expense');
        }
    };

    const getAmountColor = (amount) => {
        if (amount > 1000000) return 'text-rose-700 bg-rose-50';
        if (amount > 500000) return 'text-orange-700 bg-orange-50';
        return 'text-gray-700 bg-gray-50';
    };

    return (
        <div className="pb-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                        <TrendingDown size={14} className="text-rose-500" />
                        Track and manage company expenditures
                    </p>
                </div>
                <button
                    onClick={() => {
                        setExpenseForm({ date: new Date().toISOString().split('T')[0], amount: '', category_id: '', beneficiary_type: 'OTHER', beneficiary_id: '', account_id: '', description: '' });
                        setIsAddModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all font-semibold shadow-sm shadow-rose-200"
                >
                    <Plus size={20} /> Record New Expense
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <Table headers={['Date', 'Category', 'Beneficiary', 'Account', 'Description', 'Amount', 'Actions']}>
                    {expenses.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                                No expenses recorded yet.
                            </TableCell>
                        </TableRow>
                    ) : expenses.map((exp) => (
                        <TableRow key={exp.id} className="hover:bg-gray-50/50">
                            <TableCell className="text-gray-500 font-medium">{exp.date}</TableCell>
                            <TableCell>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                    {exp.category_name}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-900">{exp.beneficiary_name || 'Other'}</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                        {exp.beneficiary_type}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-sm font-medium text-gray-600">{exp.account_name}</TableCell>
                            <TableCell className="text-sm text-gray-500 max-w-xs truncate" title={exp.description}>
                                {exp.description || <span className="italic opacity-50">No description</span>}
                            </TableCell>
                            <TableCell>
                                <span className={`font-mono font-bold px-3 py-1.5 rounded-lg text-sm ${getAmountColor(exp.amount)}`}>
                                    -{exp.amount?.toLocaleString()} Fbu
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => { setSelectedExpense(exp); setIsQRModalOpen(true); }}
                                        className="text-gray-400 hover:text-brand-600 p-1.5 rounded-lg hover:bg-brand-50 transition-colors"
                                        title="View QR Code"
                                    >
                                        <QrCode size={18} />
                                    </button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </Table>
            </div>

            {/* Add Expense Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Record New Expense" maxWidth="max-w-xl">
                <form onSubmit={handleCreateExpense} className="space-y-6 pt-2">
                    <div className="bg-gradient-to-r from-rose-50 to-transparent border-l-4 border-rose-500 p-4 rounded-r-lg">
                        <p className="text-rose-800 text-sm font-medium leading-relaxed">
                            This transaction will be recorded as an <span className="font-bold">EXIT</span> in the general journal and immediately affect your account balance.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <Calendar size={14} className="text-gray-400" /> Transaction Date
                            </label>
                            <input type="date" required className="input-field" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <Tag size={14} className="text-gray-400" /> Category
                            </label>
                            <select className="input-field" value={expenseForm.category_id} onChange={e => setExpenseForm({ ...expenseForm, category_id: e.target.value })} required>
                                <option value="">Select Category</option>
                                {expenseCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <Users size={14} className="text-gray-400" /> Beneficiary Type
                            </label>
                            <select className="input-field" value={expenseForm.beneficiary_type} onChange={e => setExpenseForm({ ...expenseForm, beneficiary_type: e.target.value, beneficiary_id: '' })}>
                                <option value="OTHER">Other / General</option>
                                <option value="EMPLOYEE">Employee</option>
                                <option value="SUPPLIER">Supplier</option>
                            </select>
                        </div>

                        {expenseForm.beneficiary_type === 'EMPLOYEE' && (
                            <div className="space-y-1.5 animate-in slide-in-from-left-2 duration-200">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                    <User size={14} className="text-gray-400" /> Employee
                                </label>
                                <select className="input-field" value={expenseForm.beneficiary_id} onChange={e => setExpenseForm({ ...expenseForm, beneficiary_id: e.target.value })} required>
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name} {emp.job_function ? `(${emp.job_function})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {expenseForm.beneficiary_type === 'SUPPLIER' && (
                            <div className="space-y-1.5 animate-in slide-in-from-left-2 duration-200">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                    <Truck size={14} className="text-gray-400" /> Supplier
                                </label>
                                <select className="input-field" value={expenseForm.beneficiary_id} onChange={e => setExpenseForm({ ...expenseForm, beneficiary_id: e.target.value })} required>
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(sup => (
                                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <FileText size={14} className="text-gray-400" /> Description
                        </label>
                        <textarea className="input-field min-h-[80px] resize-none" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="What was this expense for?"></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <Hash size={14} className="text-gray-400" /> Amount (Fbu)
                            </label>
                            <div className="relative">
                                <input type="number" step="0.01" required className="input-field font-mono font-bold" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <CreditCard size={14} className="text-gray-400" /> Payment Account
                            </label>
                            <select className="input-field" value={expenseForm.account_id} onChange={e => setExpenseForm({ ...expenseForm, account_id: e.target.value })} required>
                                <option value="">Select Account</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all font-bold text-lg shadow-md shadow-rose-200 active:scale-[0.98]"
                        >
                            Confirm & Record Expense
                        </button>
                    </div>

                    {expenseForm.amount > 1000000 && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-xs animate-pulse">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                            <span>This is a high-value transaction (&gt; 1,000,000 Fbu). Please double-check all details before recording.</span>
                        </div>
                    )}
                </form>
            </Modal>

            {/* QR Code Modal */}
            <Modal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} title="Expense Voucher QR">
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl m-2">
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 mb-6">
                        <QRCodeGenerator
                            value={`EXP:${selectedExpense?.id}:${selectedExpense?.amount}:${selectedExpense?.date}`}
                            size={200}
                        />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-gray-900 font-bold">Voucher ID: EXP-{selectedExpense?.id}</p>
                        <p className="text-gray-500 text-sm">{selectedExpense?.amount?.toLocaleString()} Fbu on {selectedExpense?.date}</p>
                    </div>
                    <button onClick={() => setIsQRModalOpen(false)} className="mt-8 px-8 py-2 bg-gray-900 text-white rounded-lg hover:bg-black font-semibold transition-all">Done</button>
                </div>
            </Modal>
        </div>
    );
};

export default Expenses;
