import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import { getAgencies, createAgency, updateAgency, deleteAgency } from '../services/agencyService';
import { Building2, Plus, Edit, Trash2, MapPin, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const Agencies = () => {
    const [agencies, setAgencies] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({ name: '', location: '', currency: 'Fbu', code: '', address: '', country: 'Burundi' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            console.log("📂 [Agencies] Fetching all agencies...");
            const data = await getAgencies();
            console.log("✅ [Agencies] Received data:", data);
            setAgencies(data);
        } catch (error) {
            console.error("❌ [Agencies] Load failed:", error);
            toast.error("Failed to load agencies");
        }
    };

    const handleOpenAdd = () => {
        setFormData({ name: '', location: '', currency: 'Fbu', code: '', address: '', country: 'Burundi' });
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (agency) => {
        setFormData({
            name: agency.name,
            location: agency.location || '',
            currency: agency.currency || 'Fbu',
            code: agency.code || '',
            address: agency.address || '',
            country: agency.country || 'Burundi'
        });
        setSelectedId(agency.id);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("📤 [Agencies] Submitting form data:", formData);
        try {
            if (isEditMode) {
                console.log(`🔄 [Agencies] Updating agency ID: ${selectedId}`);
                await updateAgency(selectedId, formData);
                toast.success("Agency updated");
            } else {
                console.log("🆕 [Agencies] Creating new agency...");
                await createAgency(formData);
                toast.success("Agency created");
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error("❌ [Agencies] Operation failed:", error.response?.data || error.message);
            toast.error("Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this agency?")) return;
        try {
            await deleteAgency(id);
            toast.success("Agency deleted");
            loadData();
        } catch (error) {
            toast.error("Failed to delete agency");
        }
    };

    return (
        <div className="pb-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Agencies</h1>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                        <Building2 size={14} className="text-brand-500" />
                        Manage business agencies and branches
                    </p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all font-semibold shadow-sm focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                    <Plus size={20} /> Add New Agency
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <Table headers={['Agency Name', 'Code', 'Location', 'Address', 'Country', 'Currency', 'Actions']}>
                    {agencies.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                                No agencies found.
                            </TableCell>
                        </TableRow>
                    ) : agencies.map((agency) => (
                        <TableRow key={agency.id} className="hover:bg-gray-50/50">
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs">
                                        {agency.name.substring(0, 1).toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-gray-900">{agency.name}</span>
                                </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs font-bold text-gray-400">{agency.code || '-'}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={14} className="text-gray-400" /> {agency.location || '-'}
                                </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">{agency.address || '-'}</TableCell>
                            <TableCell className="text-sm text-gray-500">{agency.country || '-'}</TableCell>
                            <TableCell>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                    {agency.currency}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenEdit(agency)}
                                        className="text-gray-400 hover:text-brand-600 p-1.5 rounded-lg hover:bg-brand-50 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(agency.id)}
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Agency" : "Add New Agency"}>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 tracking-wider">
                            <Building2 size={12} className="text-gray-400" /> Agency Name
                        </label>
                        <input
                            type="text"
                            required
                            className="input-field"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Bujumbura Office"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 tracking-wider">
                                <Globe size={12} className="text-gray-400" /> Agency Code
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="BJM-01"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 tracking-wider">
                                <MapPin size={12} className="text-gray-400" /> Default Currency
                            </label>
                            <select
                                className="input-field"
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            >
                                <option value="Fbu">FBu (Burundi Franc)</option>
                                <option value="OMR">OMR (Omani Rial)</option>
                                <option value="SAR">SAR (Saudi Riyal)</option>
                                <option value="AED">AED (UAE Dirham)</option>
                                <option value="USD">USD (US Dollar)</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 tracking-wider">
                                <MapPin size={12} className="text-gray-400" /> Location
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="City or Region"
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
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 tracking-wider">
                            <MapPin size={12} className="text-gray-400" /> Full Address
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="e.g. Avenue du Large, Bujumbura"
                        />
                    </div>
                    <div className="pt-2">
                        <button type="submit" className="w-full btn-primary bg-brand-600 shadow-lg shadow-brand-100 py-3 font-bold text-lg">
                            {isEditMode ? 'Update Agency' : 'Register Agency'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Agencies;
