import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../Table';
import Modal from '../Modal';
import { Pencil, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateCandidatePayment, cancelCandidatePayment } from '../../services/candidateService';
import { getCandidatePaymentTypes } from '../../services/basicDataService';
import { getAccounts } from '../../services/accountService';

const CandidatePayments = ({ candidate, totalPaid, onRefresh }) => {
    const [editModal, setEditModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ amount: '', payment_date: '', account_id: '', payment_type_id: '' });

    useEffect(() => {
        getCandidatePaymentTypes().then(setPaymentTypes).catch(() => {});
        getAccounts().then(setAccounts).catch(() => {});
    }, []);

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
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to cancel payment');
        }
    };

    const activePayments = candidate.CandidatePayments?.filter(p => p.status !== 'CANCELLED') || [];
    const allPayments = candidate.CandidatePayments || [];

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Financial History</h2>
                        {allPayments.length !== activePayments.length && (
                            <p className="text-xs text-gray-400 mt-0.5">{allPayments.length - activePayments.length} payment(s) cancelled</p>
                        )}
                    </div>
                    <div className="text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-xl">
                        Total: {totalPaid.toLocaleString()}
                    </div>
                </div>
                <Table headers={['Date', 'Type', 'Amount', 'Account', 'Status', 'Actions']}>
                    {allPayments.map(p => {
                        const isCancelled = p.status === 'CANCELLED';
                        return (
                            <TableRow key={p.id} className={isCancelled ? 'opacity-50 bg-gray-50' : ''}>
                                <TableCell className="text-sm text-gray-500">
                                    <span className={isCancelled ? 'line-through' : ''}>
                                        {new Date(p.payment_date).toLocaleDateString()}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="bg-brand-50 text-brand-700 px-2 py-1 rounded text-xs font-bold">
                                        {p.CandidatePaymentType?.name || 'Payment'}
                                    </span>
                                </TableCell>
                                <TableCell className={`font-mono font-bold ${isCancelled ? 'text-gray-400 line-through' : 'text-emerald-600'}`}>
                                    +{parseFloat(p.amount).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">{p.Account?.name || '-'}</TableCell>
                                <TableCell>
                                    {isCancelled ? (
                                        <span className="bg-red-50 text-red-500 px-2 py-1 rounded text-xs font-bold">CANCELLED</span>
                                    ) : (
                                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-bold">ACTIVE</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {!isCancelled && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEdit(p)}
                                                className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                                title="Edit payment"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleCancel(p.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
                        <tr><td colSpan="6" className="p-8 text-center text-gray-400">No payments recorded yet.</td></tr>
                    )}
                </Table>
            </div>

            {/* Edit Modal */}
            <Modal isOpen={editModal} onClose={closeEdit} title="Edit Payment">
                <div className="space-y-4">
                    <div>
                        <label className="label mb-1">Amount</label>
                        <input
                            type="number"
                            className="input-field"
                            value={form.amount}
                            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="label mb-1">Payment Date</label>
                        <input
                            type="date"
                            className="input-field"
                            value={form.payment_date}
                            onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="label mb-1">Payment Type</label>
                        <select
                            className="input-field"
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
                        <label className="label mb-1">Account</label>
                        <select
                            className="input-field"
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
        </>
    );
};

export default CandidatePayments;
