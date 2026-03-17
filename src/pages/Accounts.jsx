import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../services/accountService';
import { useGlobal } from '../context/GlobalContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Wallet, Edit, Trash2, Landmark, Smartphone, CreditCard, Coins } from 'lucide-react';
import toast from 'react-hot-toast';

const Accounts = () => {
    const { agencies, banks } = useGlobal();
    const { user } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);

    const [accountForm, setAccountForm] = useState({ name: '', type: 'CASH', balance: 0, currency: 'FBu', agency_id: '', bank_id: '' });

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            console.log("📂 [Accounts] Fetching all accounts...");
            const data = await getAccounts();
            console.log("✅ [Accounts] Received data:", data);
            setAccounts(data);
        } catch (error) {
            console.error("❌ [Accounts] Load failed:", error);
            toast.error('Failed to load accounts');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        console.log("📤 [Accounts] Creating account with data:", accountForm);
        try {
            await createAccount(accountForm);
            toast.success('Account created successfully');
            setIsAddModalOpen(false);
            loadAccounts();
            setAccountForm({ name: '', type: 'CASH', balance: 0, currency: 'FBu', agency_id: user?.agency_id || '', bank_id: '' });
        } catch (error) {
            console.error("❌ [Accounts] Creation failed:", error.response?.data || error.message);
            toast.error('Failed to create account');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        console.log(`📤 [Accounts] Updating account ${selectedAccount.id} with data:`, accountForm);
        try {
            await updateAccount(selectedAccount.id, accountForm);
            toast.success('Account updated');
            setIsEditModalOpen(false);
            loadAccounts();
        } catch (error) {
            console.error("❌ [Accounts] Update failed:", error.response?.data || error.message);
            toast.error('Failed to update account');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteAccount(selectedAccount.id);
            toast.success('Account deleted');
            setIsDeleteModalOpen(false);
            loadAccounts();
        } catch (error) {
            toast.error('Cannot delete account with existing transactions');
        }
    };

    const openEditModal = (account) => {
        setSelectedAccount(account);
        setAccountForm({
            name: account.name,
            type: account.type,
            balance: account.balance,
            currency: account.currency || 'FBu',
            agency_id: account.agency_id,
            bank_id: account.bank_id || ''
        });
        setIsEditModalOpen(true);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'BANK': return <Landmark size={24} />;
            case 'MOBILE': return <Smartphone size={24} />;
            default: return <Wallet size={24} />;
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'BANK': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'MOBILE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-brand-50 text-brand-600 border-brand-100';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Financial Accounts</h1>
                    <p className="text-gray-500 text-sm">Manage your cash, bank and mobile money accounts</p>
                </div>
                <button
                    onClick={() => { setAccountForm({ name: '', type: 'CASH', balance: 0, currency: 'FBu', agency_id: user?.agency_id || '', bank_id: '' }); setIsAddModalOpen(true); }}
                    className="btn-primary flex items-center gap-2 bg-brand-600"
                >
                    <Plus size={20} /> Add Account
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {accounts.map(acc => (
                    <div key={acc.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-16 h-16 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform`}>
                            {getIcon(acc.type)}
                        </div>
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl ${getColor(acc.type)} border`}>
                                {getIcon(acc.type)}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{acc.type}</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800 mb-1">{acc.name}</p>
                            <p className="text-2xl font-black text-gray-900">{acc.balance.toLocaleString()} <span className="text-xs font-normal text-gray-400">{acc.currency || 'FBu'}</span></p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <Table headers={['Account Name', 'Type', 'Status', 'Balance', 'Actions']}>
                    {accounts.map(acc => (
                        <TableRow key={acc.id}>
                            <TableCell className="font-bold text-gray-800">{acc.name}</TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${getColor(acc.type)} border`}>
                                    {acc.type}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                    ACTIVE
                                </span>
                            </TableCell>
                            <TableCell className="font-mono font-bold text-gray-900">{acc.balance.toLocaleString()} {acc.currency || 'FBu'}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openEditModal(acc)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-xl transition-colors" title="Edit">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => { setSelectedAccount(acc); setIsDeleteModalOpen(true); }} className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </Table>
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={isAddModalOpen || isEditModalOpen} onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} title={isEditModalOpen ? "Modify Account" : "Open New Account"}>
                <form onSubmit={isEditModalOpen ? handleUpdate : handleCreate} className="space-y-4">
                    <div>
                        <label className="label">Account Name</label>
                        <input type="text" required className="input-field" value={accountForm.name} placeholder="e.g. Main Operations" onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="label">Account Type</label>
                        <select className="input-field" value={accountForm.type} onChange={e => setAccountForm({ ...accountForm, type: e.target.value })}>
                            <option value="CASH">CASH (Physical Money)</option>
                            <option value="BANK">BANK (Commercial Account)</option>
                            <option value="MOBILE">MOBILE (Fintech/Mobile Money)</option>
                        </select>
                    </div>
                    {accountForm.type === 'BANK' && (
                        <div>
                            <label className="label">Associated Bank</label>
                            <select
                                className="input-field"
                                value={accountForm.bank_id}
                                onChange={e => setAccountForm({ ...accountForm, bank_id: e.target.value })}
                                required
                            >
                                <option value="">Select Bank</option>
                                {banks.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Currency</label>
                            <select className="input-field" value={accountForm.currency} onChange={e => setAccountForm({ ...accountForm, currency: e.target.value })}>
                                <option value="FBu">FBu (Burundi Franc)</option>
                                <option value="OMR">OMR (Omani Rial)</option>
                                <option value="SAR">SAR (Saudi Riyal)</option>
                                <option value="AED">AED (UAE Dirham)</option>
                            </select>
                        </div>
                        {user?.role === 'ADMIN' && (
                            <div>
                                <label className="label">Agency</label>
                                <select className="input-field" value={accountForm.agency_id} onChange={e => setAccountForm({ ...accountForm, agency_id: e.target.value })} required={!isEditModalOpen}>
                                    <option value="">Select Agency</option>
                                    {agencies.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    {!isEditModalOpen && (
                        <div>
                            <label className="label">Opening Balance</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-400 font-bold">{accountForm.currency}</span>
                                <input type="number" className="input-field pl-12" value={accountForm.balance} onChange={e => setAccountForm({ ...accountForm, balance: e.target.value })} />
                            </div>
                        </div>
                    )}
                    <button type="submit" className="btn-primary w-full py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg hover:shadow-brand-200 transition-all mt-6">
                        {isEditModalOpen ? 'Save Changes' : 'Establish Account'}
                    </button>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Security Confirmation">
                <div className="p-2">
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        Are you sure you wish to decommission <strong>{selectedAccount?.name}</strong>?
                        <br /><span className="text-rose-500 font-bold text-sm">Caution: System will block deletion if legacy transactions exist.</span>
                    </p>
                    <div className="flex gap-4">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="btn-secondary flex-1 font-bold">Abort</button>
                        <button onClick={handleDelete} className="btn-primary bg-rose-600 hover:bg-rose-700 flex-1 text-white font-bold">Confirm Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Accounts;
