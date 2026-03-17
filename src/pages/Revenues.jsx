import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { getManualRevenues, getAutomaticRevenues, createManualRevenue, deleteManualRevenue } from '../services/revenueService';
import { useGlobal } from '../context/GlobalContext';
import { Plus, TrendingUp, RefreshCw, Trash2, QrCode, Calendar, Tag, FileText, Hash, Wallet, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const Revenues = () => {
    const { revenueTypes, accounts, refreshGlobalData } = useGlobal();
    const [manualRevenues, setManualRevenues] = useState([]);
    const [automaticRevenues, setAutomaticRevenues] = useState([]);
    const [activeTab, setActiveTab] = useState('manual');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedRevenue, setSelectedRevenue] = useState(null);

    const [revenueForm, setRevenueForm] = useState({
        revenue_type_id: '',
        revenue_name: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        account_id: '',
        description: ''
    });

    useEffect(() => {
        loadRevenues();
        refreshGlobalData();
    }, []);

    const loadRevenues = async () => {
        try {
            console.log("📂 [Revenues] Fetching all revenues...");
            const man = await getManualRevenues();
            const auto = await getAutomaticRevenues();
            console.log("✅ [Revenues] Received manual:", man);
            console.log("✅ [Revenues] Received automatic:", auto);
            setManualRevenues(man);
            setAutomaticRevenues(auto);
        } catch (error) {
            console.error("❌ [Revenues] Load failed:", error);
            toast.error('Failed to load revenues');
        }
    };

    const handleCreateRevenue = async (e) => {
        e.preventDefault();
        console.log("📤 [Revenues] Recording manual revenue:", revenueForm);
        try {
            await createManualRevenue(revenueForm);
            toast.success(`Revenue recorded successfully`);
            setIsAddModalOpen(false);
            loadRevenues();
            setRevenueForm({ revenue_type_id: '', revenue_name: '', amount: '', date: new Date().toISOString().split('T')[0], account_id: '', description: '' });
        } catch (error) {
            console.error("❌ [Revenues] Record failed:", error.response?.data || error.message);
            toast.error('Failed to record revenue');
        }
    };

    const handleDeleteRevenue = async (id) => {
        if (!window.confirm('Are you sure you want to delete this revenue entry?')) return;
        try {
            await deleteManualRevenue(id);
            toast.success('Revenue deleted');
            loadRevenues();
        } catch (error) {
            toast.error('Failed to delete revenue');
        }
    };

    return (
        <div className="pb-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Revenues</h1>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                        <TrendingUp size={14} className="text-emerald-500" />
                        Monitor income streams and receivables
                    </p>
                </div>
                <button
                    onClick={() => {
                        setRevenueForm({ revenue_type_id: '', revenue_name: '', amount: '', date: new Date().toISOString().split('T')[0], account_id: '', description: '' });
                        setIsAddModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-semibold shadow-sm shadow-emerald-200"
                >
                    <Plus size={20} /> Record Manual Revenue
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="flex border-b border-gray-100 bg-gray-50/30">
                    <button
                        className={`px-8 py-4 text-sm font-bold transition-all relative ${activeTab === 'manual' ? 'text-emerald-600 bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('manual')}
                    >
                        Manual Entries
                        {activeTab === 'manual' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />}
                    </button>
                    <button
                        className={`px-8 py-4 text-sm font-bold transition-all relative ${activeTab === 'automatic' ? 'text-emerald-600 bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('automatic')}
                    >
                        Automatic Logs
                        {activeTab === 'automatic' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />}
                    </button>
                </div>

                <div className="p-0">
                    {activeTab === 'manual' ? (
                        <Table headers={['Date', 'Revenue Name', 'Type', 'Account', 'Amount', 'Actions']}>
                            {manualRevenues.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-400">No manual entries found.</TableCell></TableRow>
                            ) : manualRevenues.map((rev) => (
                                <TableRow key={rev.id} className="hover:bg-gray-50/50 text-sm">
                                    <TableCell className="text-gray-500 font-medium">{rev.date}</TableCell>
                                    <TableCell className="font-bold text-gray-900">{rev.revenue_name}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                            {rev.revenue_type_name || 'General'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-medium text-gray-600">{rev.account_name}</TableCell>
                                    <TableCell>
                                        <span className="font-mono font-bold text-emerald-600 text-base">
                                            +{rev.amount?.toLocaleString()} Fbu
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => { setSelectedRevenue({ ...rev, type: 'MANUAL' }); setIsQRModalOpen(true); }}
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
                    ) : (
                        <Table headers={['Date', 'Source Module', 'Candidate', 'Account', 'Amount', 'Actions']}>
                            {automaticRevenues.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-400">No automatic logs found.</TableCell></TableRow>
                            ) : automaticRevenues.map((rev) => (
                                <TableRow key={rev.id} className="hover:bg-gray-50/50 text-sm">
                                    <TableCell className="text-gray-500 font-medium">{rev.date}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                                            <RefreshCw size={12} className="text-emerald-500" /> {rev.source_table}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-gray-900">{rev.candidate_name || <span className="text-gray-400 font-normal italic">System Gen</span>}</TableCell>
                                    <TableCell className="font-medium text-gray-600">{rev.account_name}</TableCell>
                                    <TableCell>
                                        <span className="font-mono font-bold text-emerald-600 text-base">
                                            +{rev.amount?.toLocaleString()} Fbu
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => { setSelectedRevenue({ ...rev, type: 'AUTO' }); setIsQRModalOpen(true); }}
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
                    )}
                </div>
            </div>

            {/* Add Revenue Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Record Manual Revenue" maxWidth="max-w-xl">
                <form onSubmit={handleCreateRevenue} className="space-y-6 pt-2">
                    <div className="bg-gradient-to-r from-emerald-50 to-transparent border-l-4 border-emerald-500 p-4 rounded-r-lg">
                        <p className="text-emerald-800 text-sm font-medium leading-relaxed">
                            This will record an <span className="font-bold text-emerald-900 italic uppercase">Entry</span> transaction.
                            Funds will be immediately added to the selected account.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <DollarSign size={14} className="text-gray-400" /> Revenue Name
                            </label>
                            <input type="text" required className="input-field" value={revenueForm.revenue_name} onChange={e => setRevenueForm({ ...revenueForm, revenue_name: e.target.value })} placeholder="e.g. Project Payment" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <Tag size={14} className="text-gray-400" /> Revenue Type
                            </label>
                            <select className="input-field" value={revenueForm.revenue_type_id} onChange={e => setRevenueForm({ ...revenueForm, revenue_type_id: e.target.value })} required>
                                <option value="">Select Type</option>
                                {revenueTypes.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <FileText size={14} className="text-gray-400" /> Description
                        </label>
                        <textarea className="input-field min-h-[80px] resize-none" value={revenueForm.description} onChange={e => setRevenueForm({ ...revenueForm, description: e.target.value })} placeholder="Optional details..."></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <Calendar size={14} className="text-gray-400" /> Date
                            </label>
                            <input type="date" required className="input-field" value={revenueForm.date} onChange={e => setRevenueForm({ ...revenueForm, date: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <Hash size={14} className="text-gray-400" /> Amount (Fbu)
                            </label>
                            <input type="number" step="0.01" required className="input-field font-mono font-bold" value={revenueForm.amount} onChange={e => setRevenueForm({ ...revenueForm, amount: e.target.value })} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Wallet size={14} className="text-gray-400" /> Deposit To Account
                        </label>
                        <select className="input-field" value={revenueForm.account_id} onChange={e => setRevenueForm({ ...revenueForm, account_id: e.target.value })} required>
                            <option value="">Select Account</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-bold text-lg shadow-md shadow-emerald-200 active:scale-[0.98]"
                        >
                            Confirm & Record Revenue
                        </button>
                    </div>
                </form>
            </Modal>

            {/* QR Code Modal */}
            <Modal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} title="Revenue Receipt QR">
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl m-2">
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 mb-6">
                        <QRCodeGenerator
                            value={`REV:${selectedRevenue?.type}:${selectedRevenue?.id}:${selectedRevenue?.amount}`}
                            size={200}
                        />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-gray-900 font-bold">Receipt ID: REV-{selectedRevenue?.id}</p>
                        <p className="text-emerald-600 font-bold">+{selectedRevenue?.amount?.toLocaleString()} Fbu</p>
                        <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest font-bold">Scan for validation</p>
                    </div>
                    <button onClick={() => setIsQRModalOpen(false)} className="mt-8 px-8 py-2 bg-gray-900 text-white rounded-lg hover:bg-black font-semibold transition-all">Close</button>
                </div>
            </Modal>
        </div>
    );
};

export default Revenues;
