import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { getSalaryPayments, createSalaryPayment } from '../services/paymentService';
import { getEmployees } from '../services/employeeService';
import { useGlobal } from '../context/GlobalContext';
import { UserCheck, Plus, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

const SalaryPayments = () => {
    const { accounts } = useGlobal();
    const [salaryPayments, setSalaryPayments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);

    // Form States
    const [salaryPayForm, setSalaryPayForm] = useState({ employee_id: '', month: new Date().toISOString().slice(0, 7), amount: '', account_id: '', payment_date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getSalaryPayments();
            setSalaryPayments(data);
            const emps = await getEmployees();
            setEmployees(emps);
        } catch (error) {
            console.error("Failed to load payments");
            toast.error("Could not load salary data");
        }
    };

    const handleSalaryPayment = async (e) => {
        e.preventDefault();
        try {
            await createSalaryPayment(salaryPayForm);
            toast.success("Salary payment recorded");
            setIsAddModalOpen(false);
            setSalaryPayForm({ employee_id: '', month: new Date().toISOString().slice(0, 7), amount: '', account_id: '', payment_date: new Date().toISOString().split('T')[0] });
            loadData();
        } catch (error) { toast.error("Failed to record salary"); }
    };

    // Calculate total this month
    const totalThisMonth = salaryPayments
        .filter(p => p.month === new Date().toISOString().slice(0, 7))
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Salary Payments</h1>
                    <p className="text-sm text-gray-500">Manage employee salaries</p>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">
                        <span className="text-xs text-rose-600 font-bold uppercase tracking-wider">Total (This Month)</span>
                        <div className="text-xl font-black text-rose-700">{totalThisMonth.toLocaleString()}</div>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn-primary flex items-center gap-2 bg-rose-600 hover:bg-rose-700"
                    >
                        <Plus size={20} /> Pay Salary
                    </button>
                </div>
            </div>

            <Table headers={['Date', 'Employee', 'Month', 'Amount', 'Account', 'QR']}>
                {salaryPayments.map(p => (
                    <TableRow key={p.id}>
                        <TableCell className="text-sm text-gray-500">{p.payment_date}</TableCell>
                        <TableCell>
                            <div className="font-bold text-gray-800">{p.Employee?.name}</div>
                            <div className="text-[10px] text-rose-600 font-bold">{p.Employee?.employee_code}</div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                            {p.month}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-rose-600">-{parseFloat(p.amount).toLocaleString()} <span className="text-[10px]">{p.currency || 'USD'}</span></TableCell>
                        <TableCell className="text-sm">{p.Account?.name}</TableCell>
                        <TableCell>
                            <button onClick={() => { setSelectedPayment(p); setIsQRModalOpen(true); }} className="text-gray-400 hover:text-brand-600"><QrCode size={18} /></button>
                        </TableCell>
                    </TableRow>
                ))}
                {salaryPayments.length === 0 && (
                    <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-400">No salary payments found.</td>
                    </tr>
                )}
            </Table>

            {/* Record Payment Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Record Salary Payment">
                <form onSubmit={handleSalaryPayment} className="space-y-4">
                    <div>
                        <label className="label">Employee</label>
                        <select className="input-field" value={salaryPayForm.employee_id} onChange={e => setSalaryPayForm({ ...salaryPayForm, employee_id: e.target.value })} required>
                            <option value="">Select Employee</option>
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Month</label>
                            <input type="month" className="input-field" value={salaryPayForm.month} onChange={e => setSalaryPayForm({ ...salaryPayForm, month: e.target.value })} required />
                        </div>
                        <div>
                            <label className="label">Date</label>
                            <input type="date" className="input-field" value={salaryPayForm.payment_date} onChange={e => setSalaryPayForm({ ...salaryPayForm, payment_date: e.target.value })} required />
                        </div>
                    </div>
                    <div>
                        <label className="label">Amount</label>
                        <input type="number" className="input-field" value={salaryPayForm.amount} onChange={e => setSalaryPayForm({ ...salaryPayForm, amount: e.target.value })} required />
                    </div>
                    <div>
                        <label className="label">Account</label>
                        <select className="input-field" value={salaryPayForm.account_id} onChange={e => setSalaryPayForm({ ...salaryPayForm, account_id: e.target.value })} required>
                            <option value="">Select Account</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="w-full btn-primary bg-rose-600 hover:bg-rose-700">Record Salary Payment</button>
                </form>
            </Modal>

            {/* QR Code Modal */}
            <Modal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} title="Salary Payment QR">
                <div className="flex flex-col items-center p-6">
                    <QRCodeGenerator value={`PAY:SAL:${selectedPayment?.id}:${selectedPayment?.amount}`} size={200} />
                    <p className="mt-4 text-gray-500 text-sm text-center">Scan to verify salary payment</p>
                    <button onClick={() => setIsQRModalOpen(false)} className="mt-6 btn-secondary">Close</button>
                </div>
            </Modal>
        </>
    );
};

export default SalaryPayments;
