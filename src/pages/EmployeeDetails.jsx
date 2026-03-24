import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmployeeById } from '../services/employeeService';
import { getSalarySummary, createAdvance, recordLoanRepayment } from '../services/salaryService';
import { createSalaryPayment } from '../services/paymentService';
import { useGlobal } from '../context/GlobalContext';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { 
    ArrowLeft, User, CreditCard, History, Wallet, 
    TrendingDown, Plus, BadgeDollarSign, CalendarDays,
    Info, Building2, Phone, Briefcase, ChevronRight,
    CheckCircle2, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { accounts } = useGlobal();
    
    const [employee, setEmployee] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loans, setLoans] = useState(null);
    const [details, setDetails] = useState({ advances: [], payments: [], repayments: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('financials');
    
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState('PAYMENT'); // PAYMENT, ADVANCE, LOAN, REPAYMENT
    const [selectedLoanId, setSelectedLoanId] = useState(null);
    
    const [formData, setFormData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        account_id: '',
        description: '',
        payment_type: 'PARTIAL'
    });

    useEffect(() => {
        loadData();
    }, [id, selectedMonth]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [empData, summaryData] = await Promise.all([
                getEmployeeById(id),
                getSalarySummary(id, selectedMonth)
            ]);
            setEmployee(empData);
            setSummary(summaryData.summary);
            setLoans(summaryData.loans);
            setDetails(summaryData.details);
        } catch (error) {
            toast.error("Failed to load employee data");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (e) => {
        e.preventDefault();
        
        // UX Business Validation
        if (actionType === 'PAYMENT' || actionType === 'ADVANCE') {
            if (parseFloat(formData.amount) > parseFloat(summary.remaining_salary)) {
                return toast.error(`Denied: Exceeds remaining salary (${summary.remaining_salary} Fbu)`);
            }
        }

        if (actionType === 'REPAYMENT') {
            const loan = loans.active_loans.find(l => l.id === parseInt(selectedLoanId));
            if (parseFloat(formData.amount) > parseFloat(loan.balance)) {
                return toast.error(`Denied: Exceeds loan balance (${loan.balance} Fbu)`);
            }
        }

        try {
            if (actionType === 'PAYMENT') {
                await createSalaryPayment({
                    employee_id: id,
                    month: selectedMonth,
                    amount: formData.amount,
                    payment_date: formData.date,
                    account_id: formData.account_id,
                    payment_type: formData.payment_type
                });
                toast.success("Salary payment recorded");
            } else if (actionType === 'REPAYMENT') {
                await recordLoanRepayment({
                    employee_advance_id: selectedLoanId,
                    amount: formData.amount,
                    date: formData.date,
                    description: formData.description
                });
                toast.success("Loan repayment recorded");
            } else {
                await createAdvance({
                    employee_id: id,
                    amount: formData.amount,
                    date: formData.date,
                    type: actionType,
                    description: formData.description
                });
                toast.success(`${actionType} recorded successfully`);
            }
            
            setIsActionModalOpen(false);
            setFormData({ ...formData, amount: '', description: '' });
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const openModal = (type, loanId = null) => {
        setActionType(type);
        setSelectedLoanId(loanId);
        setFormData({
            ...formData,
            amount: type === 'PAYMENT' ? (summary?.remaining_salary || '') : '',
            account_id: accounts?.[0]?.id || '',
            payment_type: type === 'PAYMENT' ? 'PARTIAL' : 'PARTIAL'
        });
        setIsActionModalOpen(true);
    };

    if (loading && !employee) return <div className="p-8 text-center text-gray-500">Loading Professional Dashboard...</div>;
    if (!employee) return <div className="p-8 text-center text-gray-500">Employee not found.</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <button onClick={() => navigate('/employees')} className="flex items-center text-gray-500 hover:text-brand-600 transition-colors font-medium">
                <ArrowLeft size={20} className="mr-2" /> Back to Staff
            </button>

            {/* Premium Header */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-8 items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full -mr-32 -mt-32 opacity-50" />
                
                <div className="w-24 h-24 bg-brand-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-brand-200 shrink-0 z-10">
                    {employee.name.charAt(0)}
                </div>
                
                <div className="flex-1 text-center lg:text-left z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 mb-2">
                        <h1 className="text-3xl font-black text-gray-900">{employee.name}</h1>
                        <StatusBadge status={employee.status} />
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                            ${employee.status_month === 'PAID' ? 'bg-emerald-100 text-emerald-700' : employee.status_month === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                            {employee.status_month || 'UNPAID'}
                        </span>
                    </div>
                    <div className="text-gray-500 flex flex-wrap justify-center lg:justify-start gap-4 items-center text-sm font-medium">
                        <span className="bg-gray-100 px-3 py-1 rounded-lg text-brand-700 font-mono">{employee.employee_code}</span>
                        <div className="flex items-center gap-1.5"><Briefcase size={16} /> {employee.job_function}</div>
                        <div className="flex items-center gap-1.5"><Building2 size={16} /> {employee.Agency?.name}</div>
                    </div>
                </div>

                <div className="flex flex-col items-center lg:items-end gap-2 z-10">
                    <div className="text-xs text-gray-400 uppercase font-black tracking-widest">Monthly Salary</div>
                    <div className="text-3xl font-black text-brand-600 font-mono">
                        {(parseFloat(employee?.monthly_salary) || 0).toLocaleString()} <span className="text-sm text-gray-400">Fbu</span>
                    </div>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Wallet size={24} /></div>
                        <div className="text-right">
                           <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Salary Base</div>
                           <div className="text-xl font-black text-gray-800 font-mono">{summary?.total_salary.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><TrendingDown size={24} /></div>
                        <div className="text-right">
                           <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Deductions</div>
                           <div className="text-xl font-black text-amber-600 font-mono">-{ (parseFloat(summary?.total_advances || 0) + parseFloat(summary?.total_payments || 0) + parseFloat(summary?.total_loan_deductions || 0)).toLocaleString() }</div>
                        </div>
                    </div>
                </div>
                <div className="bg-brand-600 p-6 rounded-2xl shadow-lg shadow-brand-200 text-white relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 opacity-10"><BadgeDollarSign size={100} /></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 bg-white/20 text-white rounded-xl"><CreditCard size={24} /></div>
                        <div className="text-right">
                           <div className="text-xs text-white/70 font-bold uppercase tracking-wider">Remaining Balance</div>
                           <div className="text-2xl font-black font-mono">{(summary?.remaining_salary || 0).toLocaleString()} Fbu</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-4 border-b border-gray-100 overflow-x-auto pb-px">
                {[
                    { id: 'financials', label: 'Financial Management', icon: CreditCard },
                    { id: 'history', label: 'Transaction History', icon: History },
                    { id: 'profile', label: 'Identity & Files', icon: User }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 whitespace-nowrap
                            ${activeTab === tab.id 
                                ? 'border-brand-600 text-brand-600 bg-brand-50/50 rounded-t-xl' 
                                : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'financials' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Control Panel */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <CalendarDays size={18} className="text-brand-600" /> Selective Month
                                </h3>
                                <input 
                                    type="month" 
                                    className="input-field" 
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                />
                                <div className="mt-4 p-3 bg-brand-50 rounded-xl text-xs text-brand-700 leading-relaxed">
                                    Calculations automatically adjust based on the selected month and year.
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4">Quick Actions</h3>
                                <div className="grid gap-3">
                                    <button 
                                        onClick={() => openModal('PAYMENT')}
                                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-100"
                                    >
                                        <BadgeDollarSign size={20} /> Record Payment
                                    </button>
                                    <button 
                                        onClick={() => openModal('ADVANCE')}
                                        className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-100"
                                    >
                                        <Plus size={20} /> Issue Advance
                                    </button>
                                    <button 
                                        onClick={() => openModal('LOAN')}
                                        className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-100"
                                    >
                                        <Plus size={20} /> Issue Loan
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Summary View */}
                        <div className="lg:col-span-2 space-y-8">
                             {/* Loan Management Card */}
                             <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                        <TrendingDown size={18} className="text-amber-600" /> Active Loans Balance
                                    </h3>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-gray-900 font-mono">{(loans?.remaining_loan_balance || 0).toLocaleString()} Fbu</div>
                                        <div className="text-[10px] text-gray-400 uppercase font-black">Across {loans?.active_loans?.length || 0} loans</div>
                                    </div>
                                </div>
                                <div className="p-0">
                                    {loans?.active_loans?.length > 0 ? (
                                        <Table headers={['Loan Date', 'Amount', 'Paid', 'Balance', 'Action']}>
                                            {loans.active_loans.map(loan => (
                                                <TableRow key={`loan-${loan.id}`}>
                                                    <TableCell className="text-xs font-medium">{new Date(loan.date).toLocaleDateString()}</TableCell>
                                                    <TableCell className="font-mono">{(loan.amount || 0).toLocaleString()}</TableCell>
                                                    <TableCell className="font-mono text-emerald-600">-{(loan.repaid || 0).toLocaleString()}</TableCell>
                                                    <TableCell className="font-mono font-bold">{(loan.balance || 0).toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <button 
                                                            onClick={() => openModal('REPAYMENT', loan.id)}
                                                            className="text-xs font-black text-brand-600 hover:text-brand-700 uppercase p-2 hover:bg-brand-50 rounded-lg transition-all"
                                                        >
                                                            Repay
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </Table>
                                    ) : (
                                        <div className="p-8 text-center text-gray-400 text-sm italic">No active loans for this employee.</div>
                                    )}
                                </div>
                             </div>

                             {/* Monthly Breakdown */}
                             <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-lg font-black text-gray-800">Current Month Breakdown</h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                            <span className="text-gray-500 font-medium">Monthly Contract Salary</span>
                                            <span className="font-mono font-bold text-gray-900">{(summary?.total_salary || 0).toLocaleString()} Fbu</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 font-medium">Monthly Advances</span>
                                                <span className="text-[10px] text-gray-400">Immediate salary deductions</span>
                                            </div>
                                            <span className="font-mono font-bold text-rose-500">-{(summary?.total_advances || 0).toLocaleString()} Fbu</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 font-medium">Loan Repayments</span>
                                                <span className="text-[10px] text-gray-400">Scheduled/One-off repayments</span>
                                            </div>
                                            <span className="font-mono font-bold text-rose-500">-{(summary?.total_loan_deductions || 0).toLocaleString()} Fbu</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                            <span className="text-gray-500 font-medium">Salary Payments Made</span>
                                            <span className="font-mono font-bold text-rose-500">-{(summary?.total_payments || 0).toLocaleString()} Fbu</span>
                                        </div>
                                        <div className="flex justify-between items-center py-6">
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-900 font-black text-xl">Remaining to Pay</span>
                                                {summary?.remaining_salary === 0 ? (
                                                    <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-black uppercase"><CheckCircle2 size={12}/> Fully Paid</span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-black uppercase"><AlertCircle size={12}/> Partial</span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-emerald-600 font-mono">
                                                    {(summary?.remaining_salary || 0).toLocaleString()} Fbu
                                                </div>
                                                <div className="text-[10px] text-gray-400 uppercase tracking-tighter">Valid for {selectedMonth}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                                <History className="text-brand-600" /> Transaction Audit Trail
                            </h2>
                        </div>
                        <div className="p-0">
                            <Table headers={['Date', 'Transaction Type', 'Amount', 'Reference', 'Account']}>
                                {/* Show Payments */}
                                {details.payments.map(p => (
                                    <TableRow key={`pay-${p.id}`} className="hover:bg-gray-50/50">
                                        <TableCell className="text-sm font-medium text-gray-500">{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><BadgeDollarSign size={14} /></div>
                                                <div>
                                                    <div className="font-bold text-gray-900">Salary Payment</div>
                                                    <div className="text-[10px] text-gray-400 uppercase font-black">{p.payment_type}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono font-bold text-rose-600">-{parseFloat(p.amount).toLocaleString()}</TableCell>
                                        <TableCell><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono uppercase">{p.month}</span></TableCell>
                                        <TableCell className="text-sm text-gray-500">{accounts.find(a => a.id === p.account_id)?.name || 'Account'}</TableCell>
                                    </TableRow>
                                ))}
                                {/* Show Advances */}
                                {details.advances.map(a => (
                                    <TableRow key={`adv-${a.id}`} className="hover:bg-gray-50/50">
                                        <TableCell className="text-sm font-medium text-gray-500">{new Date(a.date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${a.type === 'LOAN' ? 'bg-amber-50 text-amber-600' : 'bg-brand-50 text-brand-600'}`}>
                                                    <TrendingDown size={14} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{a.type}</div>
                                                    <div className="text-[10px] text-gray-400 uppercase font-black truncate max-w-[150px]">{a.description || 'Employee Advance'}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono font-bold text-rose-600">-{parseFloat(a.amount).toLocaleString()}</TableCell>
                                        <TableCell>
                                            {a.is_repaid ? (
                                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black uppercase">Settled</span>
                                            ) : (
                                                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase">Active {a.type}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-400">N/A</TableCell>
                                    </TableRow>
                                ))}
                                {/* Show Repayments */}
                                {details.repayments.map(r => (
                                    <TableRow key={`rep-${r.id}`} className="hover:bg-gray-50/50">
                                        <TableCell className="text-sm font-medium text-gray-500">{new Date(r.date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><CheckCircle2 size={14} /></div>
                                                <div>
                                                    <div className="font-bold text-gray-900">Loan Repayment</div>
                                                    <div className="text-[10px] text-gray-400 uppercase font-black">Ref: #{r.employee_advance_id}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono font-bold text-emerald-600">-{parseFloat(r.amount).toLocaleString()}</TableCell>
                                        <TableCell><span className="text-[10px] text-gray-400 uppercase font-black">{r.description || 'Monthly Repayment'}</span></TableCell>
                                        <TableCell className="text-sm text-gray-400">N/A</TableCell>
                                    </TableRow>
                                ))}

                                {details.payments.length === 0 && details.advances.length === 0 && details.repayments.length === 0 && (
                                    <tr><td colSpan="5" className="p-12 text-center text-gray-400 font-medium italic">No transactions found for this period.</td></tr>
                                )}
                            </Table>
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <div className="max-w-2xl">
                             <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Staff Profile Identity</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                                <div className="space-y-1">
                                    <label className="text-xs text-brand-600 font-black uppercase tracking-tighter">Legal Full Name</label>
                                    <div className="text-lg font-bold text-gray-900">{employee.name}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-brand-600 font-black uppercase tracking-tighter">Phone Contact</label>
                                    <div className="text-lg font-bold text-gray-900 flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 w-fit">
                                        <Phone size={16} className="text-gray-400" /> {employee.phone || 'N/A'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-brand-600 font-black uppercase tracking-tighter">Date of Hire</label>
                                    <div className="text-lg font-bold text-gray-900">{new Date(employee.hire_date).toLocaleDateString()}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-brand-600 font-black uppercase tracking-tighter">Agency Assignment</label>
                                    <div className="text-lg font-bold text-gray-900">{employee.Agency?.name || 'Main Center'}</div>
                                </div>
                             </div>

                             <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                                <div className="text-amber-600 mt-1"><Info size={20} /></div>
                                <div>
                                    <div className="font-bold text-amber-900">Privacy Notice</div>
                                    <p className="text-sm text-amber-800 leading-relaxed mt-1">
                                        Employee financial data is strictly confidential. Ensure you are authorized to view this information according to agency policy.
                                    </p>
                                </div>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            <Modal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} title={`${actionType === 'PAYMENT' ? 'Record Salary Payment' : actionType === 'REPAYMENT' ? 'Record Loan Repayment' : `Issue ${actionType}`}`}>
                <form onSubmit={handleAction} className="space-y-5">
                    <div className="bg-brand-50 rounded-2xl p-5 border border-brand-100 flex justify-between items-center">
                        <div>
                            <div className="text-xs text-brand-600 font-black uppercase tracking-widest mb-1">
                                {actionType === 'REPAYMENT' ? 'Remaining Loan' : 'Available Salary'}
                            </div>
                            <div className="text-lg font-black font-mono text-brand-900">
                                {actionType === 'REPAYMENT' 
                                    ? (loans?.active_loans?.find(l => l.id === selectedLoanId)?.balance || 0).toLocaleString() 
                                    : (summary?.remaining_salary || 0).toLocaleString()
                                } Fbu
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Period</div>
                            <div className="text-sm font-bold text-gray-700">{selectedMonth}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="label text-xs font-black uppercase">Amount</label>
                            <div className="relative">
                                <BadgeDollarSign className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="number" 
                                    required 
                                    className="input-field pl-10 font-mono font-bold" 
                                    value={formData.amount} 
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="label text-xs font-black uppercase">Date</label>
                            <input 
                                type="date" 
                                required 
                                className="input-field" 
                                value={formData.date} 
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                    </div>

                    {actionType === 'PAYMENT' ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="label text-xs font-black uppercase">Payment Type</label>
                                <select 
                                    className="input-field" 
                                    value={formData.payment_type}
                                    onChange={e => setFormData({ ...formData, payment_type: e.target.value })}
                                >
                                    <option value="PARTIAL">Partial Payment</option>
                                    <option value="FINAL">Final Settlement</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="label text-xs font-black uppercase">From Account</label>
                                <select 
                                    className="input-field" 
                                    value={formData.account_id}
                                    onChange={e => setFormData({ ...formData, account_id: e.target.value })}
                                    required
                                >
                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <label className="label text-xs font-black uppercase">Description / Purpose</label>
                            <textarea 
                                className="input-field min-h-[80px]" 
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder={actionType === 'REPAYMENT' ? 'Monthly repayment, partial payment, etc.' : `Reason for ${actionType.toLowerCase()}...`}
                            />
                        </div>
                    )}

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            className={`w-full py-4 rounded-2xl text-white font-black text-lg transition-all shadow-lg
                                ${actionType === 'PAYMENT' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : actionType === 'REPAYMENT' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-100'}`}
                        >
                            Confirm {actionType}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default EmployeeDetails;
