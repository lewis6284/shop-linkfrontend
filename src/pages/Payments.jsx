import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { getCandidatePayments } from '../services/paymentService'; // Keep original import if valid
import { createCandidatePayment, getCandidates } from '../services/candidateService';
import { useGlobal } from '../context/GlobalContext';
import { Plus, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

const Payments = () => { // Keeps name 'Payments' to match file/route, but acts as Candidate Payments
    const { candidatePaymentTypes, accounts } = useGlobal();
    const [candidatePayments, setCandidatePayments] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);

    // Form States
    const [candPayForm, setCandPayForm] = useState({ candidate_id: '', payment_type_id: '', amount: '', account_id: '', payment_date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getCandidatePayments();
            setCandidatePayments(data);
            const cands = await getCandidates();
            setCandidates(cands);
        } catch (error) {
            console.error("Failed to load payments");
        }
    };

    const handleCandPayment = async (e) => {
        e.preventDefault();
        try {
            await createCandidatePayment(candPayForm);
            toast.success("Receipt generated successfully");
            setIsAddModalOpen(false);
            setCandPayForm({ candidate_id: '', payment_type_id: '', amount: '', account_id: '', payment_date: new Date().toISOString().split('T')[0] });
            loadData();
        } catch (error) { toast.error("Failed to record payment"); }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Candidate Payments</h1>
                    <p className="text-sm text-gray-500">Manage payments from candidates</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn-primary flex items-center gap-2 bg-brand-600"
                >
                    <Plus size={20} /> Record New Payment
                </button>
            </div>

            <Table headers={['Date', 'Candidate', 'Type', 'Amount', 'Account', 'QR']}>
                {candidatePayments.map(p => (
                    <TableRow key={p.id}>
                        <TableCell className="text-sm text-gray-500">{p.payment_date}</TableCell>
                        <TableCell>
                            <div className="font-bold text-gray-800">{p.Candidate?.name}</div>
                            <div className="text-[10px] text-brand-600 font-bold">{p.Candidate?.candidate_code}</div>
                        </TableCell>
                        <TableCell><span className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded font-medium">{p.CandidatePaymentType?.name}</span></TableCell>
                        <TableCell className="font-mono font-bold text-emerald-600">+{parseFloat(p.amount).toLocaleString()} <span className="text-[10px]">{p.currency}</span></TableCell>
                        <TableCell className="text-sm">{p.Account?.name}</TableCell>
                        <TableCell>
                            <button onClick={() => { setSelectedPayment(p); setIsQRModalOpen(true); }} className="text-gray-400 hover:text-brand-600"><QrCode size={18} /></button>
                        </TableCell>
                    </TableRow>
                ))}
            </Table>

            {/* Record Payment Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Record Candidate Payment">
                <form onSubmit={handleCandPayment} className="space-y-4">
                    <div>
                        <label className="label">Candidate</label>
                        <select className="input-field" value={candPayForm.candidate_id} onChange={e => setCandPayForm({ ...candPayForm, candidate_id: e.target.value })} required>
                            <option value="">Select Candidate</option>
                            {candidates.map(c => <option key={c.id} value={c.id}>{c.name} ({c.candidate_code})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Payment Type</label>
                            <select className="input-field" value={candPayForm.payment_type_id} onChange={e => setCandPayForm({ ...candPayForm, payment_type_id: e.target.value })} required>
                                <option value="">Type</option>
                                {candidatePaymentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Amount</label>
                            <input type="number" className="input-field" value={candPayForm.amount} onChange={e => setCandPayForm({ ...candPayForm, amount: e.target.value })} required />
                        </div>
                    </div>
                    <div>
                        <label className="label">Account</label>
                        <select className="input-field" value={candPayForm.account_id} onChange={e => setCandPayForm({ ...candPayForm, account_id: e.target.value })} required>
                            <option value="">Select Account</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>)}
                        </select>
                    </div>
                    <button type="submit" className="w-full btn-primary bg-emerald-600">Generate Receipt</button>
                </form>
            </Modal>

            {/* QR Code Modal */}
            <Modal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} title="Payment Verification QR">
                <div className="flex flex-col items-center p-6">
                    <QRCodeGenerator value={`PAY:CAND:${selectedPayment?.id}:${selectedPayment?.amount}`} size={200} />
                    <p className="mt-4 text-gray-500 text-sm text-center">Scan to verify transaction authenticity</p>
                    <button onClick={() => setIsQRModalOpen(false)} className="mt-6 btn-secondary">Close</button>
                </div>
            </Modal>
        </>
    );
};

export default Payments;
