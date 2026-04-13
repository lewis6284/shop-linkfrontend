import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../Table';
import Modal from '../Modal';
import { Pencil, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateCandidatePayment, cancelCandidatePayment, getPaymentSummary } from '../../services/candidateService';
import { getCandidatePaymentTypes } from '../../services/basicDataService';
import { getAccounts } from '../../services/accountService';

const CandidatePayments = ({ candidate, totalPaid, onRefresh }) => {
    const [editModal, setEditModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [saving, setSaving] = useState(false);
    const [summary, setSummary] = useState(null);
    const [form, setForm] = useState({ amount: '', payment_date: '', account_id: '', payment_type_id: '' });

    useEffect(() => {
        getCandidatePaymentTypes().then(setPaymentTypes).catch(() => { });
        getAccounts().then(setAccounts).catch(() => { });
        loadSummary();
    }, [candidate.id]);

    const loadSummary = async () => {
        try {
            const data = await getPaymentSummary(candidate.id);
            setSummary(data);
        } catch (err) {
            console.error("Failed to load payment summary", err);
        }
    };

    const openEdit = (payment) => {
        setSelectedPayment(payment);
        setForm({
            amount: payment.amount,
            payment_date: payment.payment_date?.slice(0, 10) || '',
            account_id: payment.account_id,
            payment_type_id: payment.payment_type_id,
        });
        setEditModal(true);
    };

    const closeEdit = () => {
        setEditModal(false);
        setSelectedPayment(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateCandidatePayment(selectedPayment.id, form);
            toast.success('Payment updated');
            closeEdit();
            if (onRefresh) onRefresh();
            loadSummary();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to update payment');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this payment? A reversing journal entry will be recorded. This cannot be undone.')) return;
        try {
            await cancelCandidatePayment(id);
            toast.success('Payment cancelled');
            if (onRefresh) onRefresh();
            loadSummary();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to cancel payment');
        }
    };

    const activePayments = candidate.CandidatePayments?.filter(p => p.status !== 'CANCELLED') || [];
    const allPayments = candidate.CandidatePayments || [];

    return (
        <div className="space-y-6">
            {/* Global Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between">
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Total Package</span>
                        <span className="text-2xl font-black text-gray-800 dark:text-gray-100 mt-2">{summary.totalPackage?.toLocaleString() || 0} <span className="text-sm font-medium text-gray-400 dark:text-gray-500">FBU</span></span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 p-5 flex flex-col justify-between">
                        <span className="text-emerald-500 dark:text-emerald-400 text-sm font-bold uppercase">Total Paid</span>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-500 mt-2">{summary.totalPaid?.toLocaleString() || 0} <span className="text-sm font-medium text-emerald-400 dark:text-emerald-600">FBU</span></span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 p-5 flex flex-col justify-between">
                        <span className="text-red-500 dark:text-red-400 text-sm font-bold uppercase">Total Remaining</span>
                        <span className="text-2xl font-black text-red-600 dark:text-red-500 mt-2">{summary.totalRemaining?.toLocaleString() || 0} <span className="text-sm font-medium text-red-400 dark:text-red-600">FBU</span></span>
                    </div>
                </div>
            )}

            {/* Historic Transactions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Financial History</h2>
                        {allPayments.length !== activePayments.length && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{allPayments.length - activePayments.length} payment(s) cancelled</p>
                        )}
                    </div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-xl">
                        Total: {totalPaid.toLocaleString()}
                    </div>
                </div>
                <Table headers={['Date', 'Type', 'Amount', 'Account', 'Status', 'Actions']}>
                    {allPayments.map(p => {
                        const isCancelled = p.status === 'CANCELLED';
                        return (
                            <TableRow key={p.id} className={isCancelled ? 'opacity-50 bg-gray-50 dark:bg-gray-900/30' : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/50'}>
                                <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                                    <span className={isCancelled ? 'line-through' : ''}>
                                        {new Date(p.payment_date).toLocaleDateString()}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 px-2 py-1 rounded text-xs font-bold">
                                        {p.CandidatePaymentType?.name || 'Payment'}
                                    </span>
                                </TableCell>
                                <TableCell className={`font-mono font-bold ${isCancelled ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    +{parseFloat(p.amount).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-sm text-gray-500 dark:text-gray-400">{p.Account?.name || '-'}</TableCell>
                                <TableCell>
                                    {isCancelled ? (
                                        <span className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 px-2 py-1 rounded text-xs font-bold">CANCELLED</span>
                                    ) : (
                                        <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded text-xs font-bold">ACTIVE</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {!isCancelled && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEdit(p)}
                                                className="p-1.5 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition-colors"
                                                title="Edit payment"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleCancel(p.id)}
                                                className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                title="Cancel payment"
                                            >
                                                <XCircle size={15} />
                                            </button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    {allPayments.length === 0 && (
                        <tr><td colSpan="6" className="p-8 text-center text-gray-400 dark:text-gray-500">No payments recorded yet.</td></tr>
                    )}
                </Table>
            </div>

            {/* Edit Modal */}
            <Modal isOpen={editModal} onClose={closeEdit} title="Edit Payment">
                <div className="space-y-4">
                    <div>
                        <label className="label dark:text-gray-300 mb-1">Amount</label>
                        <input
                            type="number"
                            className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            value={form.amount}
                            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="label dark:text-gray-300 mb-1">Payment Date</label>
                        <input
                            type="date"
                            className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            value={form.payment_date}
                            onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="label dark:text-gray-300 mb-1">Payment Type</label>
                        <select
                            className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            value={form.payment_type_id}
                            onChange={e => setForm(f => ({ ...f, payment_type_id: e.target.value }))}
                        >
                            <option value="">-- Select type --</option>
                            {paymentTypes.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label dark:text-gray-300 mb-1">Account</label>
                        <select
                            className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            value={form.account_id}
                            onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
                        >
                            <option value="">-- Select account --</option>
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={closeEdit} className="btn-secondary">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="btn-primary">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CandidatePayments;
