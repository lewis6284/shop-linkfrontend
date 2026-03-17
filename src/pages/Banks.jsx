import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import { getBanks, createBank, updateBank, deleteBank } from '../services/bankService';
import { Landmark, Plus, Edit, Trash2, Hash, Globe, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const Banks = () => {
    const [banks, setBanks] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({ name: '', code: '', address: '', country: 'Burundi' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            console.log("📂 [Banks] Fetching all banks...");
            const data = await getBanks();
            console.log("✅ [Banks] Received data:", data);
            setBanks(data);
        } catch (error) {
            console.error("❌ [Banks] Load failed:", error);
            toast.error("Failed to load banks");
        }
    };

    const handleOpenAdd = () => {
        setFormData({ name: '', code: '', address: '', country: 'Burundi' });
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (bank) => {
        setFormData({
            name: bank.name,
            code: bank.code || '',
            address: bank.address || '',
            country: bank.country || 'Burundi'
        });
        setSelectedId(bank.id);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("📤 [Banks] Submitting form data:", formData);
        try {
            if (isEditMode) {
                console.log(`🔄 [Banks] Updating bank ID: ${selectedId}`);
                await updateBank(selectedId, formData);
                toast.success("Bank updated");
            } else {
                console.log("🆕 [Banks] Creating new bank...");
                await createBank(formData);
                toast.success("Bank created");
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error("❌ [Banks] Operation failed:", error.response?.data || error.message);
            toast.error("Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this bank?")) return;
        try {
            await deleteBank(id);
            toast.success("Bank deleted");
            loadData();
        } catch (error) {
            toast.error("Failed to delete bank");
        }
    };

    return (
        <div className="pb-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Banks</h1>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                        <Landmark size={14} className="text-indigo-500" />
                        Manage registered banking institutions
                    </p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    <Plus size={20} /> Add New Bank
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <Table headers={['Bank Name', 'SWIFT/Code', 'Address', 'Country', 'Actions']}>
                    {banks.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-10 text-gray-400">
                                No banks registered yet.
                            </TableCell>
                        </TableRow>
                    ) : banks.map((bank) => (
                        <TableRow key={bank.id} className="hover:bg-gray-50/50">
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                                        {bank.name.substring(0, 2)}
                                    </div>
                                    <span className="font-semibold text-gray-900">{bank.name}</span>
                                </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs font-bold text-gray-400">{bank.code || <span className="italic opacity-50 font-normal">No Code</span>}</TableCell>
                            <TableCell className="text-sm text-gray-500">{bank.address || '-'}</TableCell>
                            <TableCell className="text-sm text-gray-500">{bank.country || '-'}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenEdit(bank)}
                                        className="text-gray-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(bank.id)}
                                        className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </Table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Bank" : "Add New Bank"}>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 tracking-wider">
                            <Landmark size={12} className="text-gray-400" /> Institution Name
                        </label>
                        <input
                            type="text"
                            required
                            className="input-field"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Bank of Africa"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 tracking-wider">
                            <Hash size={12} className="text-gray-400" /> SWIFT / Bank Code
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="BOA-BI-BJM"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 tracking-wider">
                            <Globe size={12} className="text-gray-400" /> Country
                        </label>
                        <select
                            className="input-field"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        >
                            <option value="Burundi">Burundi</option>
                            <option value="Oman">Oman</option>
                            <option value="Saudi Arabia">Saudi Arabia</option>
                            <option value="UAE">UAE</option>
                            <option value="USA">USA</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 tracking-wider">
                            <MapPin size={12} className="text-gray-400" /> Address
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="e.g. Headquarters, Bujumbura"
                        />
                    </div>
                    <div className="pt-2">
                        <button type="submit" className="w-full btn-primary bg-indigo-600 shadow-lg shadow-indigo-100 py-3 font-bold text-lg">
                            {isEditMode ? 'Update Bank' : 'Add Bank'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Banks;
