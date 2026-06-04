import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Edit2, FileText, Phone, Plus, Stamp, Trash2 } from 'lucide-react';
import Table, { TableRow, TableCell } from '../components/Table';
import companySettingService from '../services/companySettingService';
import { getImageUrl } from '../utils/imageUrl';

const blankForm = {
    company_name: '',
    nif: '',
    rc: '',
    phone: '',
    stampFile: null
};

const CompanySettings = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [formData, setFormData] = useState(blankForm);
    const [stampPreview, setStampPreview] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const data = await companySettingService.getAll();
            setRecords(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load company settings', error);
            toast.error(error.response?.data?.message || 'Failed to load company settings');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (record = null) => {
        setEditingRecord(record);
        setFormData(record ? {
            company_name: record.company_name || '',
            nif: record.nif || '',
            rc: record.rc || '',
            phone: record.phone || '',
            stampFile: null
        } : blankForm);
        setStampPreview(record?.stamp_url ? getImageUrl(record.stamp_url) : '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRecord(null);
        setFormData(blankForm);
        setStampPreview('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleStampChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'image/png') {
            toast.error('Stamp must be a PNG image');
            event.target.value = '';
            return;
        }

        setFormData((current) => ({ ...current, stampFile: file }));
        setStampPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!formData.company_name.trim()) {
            toast.error('Company name is required');
            return;
        }

        try {
            setSaving(true);
            if (editingRecord) {
                await companySettingService.update(editingRecord.id, formData);
                toast.success('Company settings updated');
            } else {
                await companySettingService.create(formData);
                toast.success('Company settings created');
            }
            closeModal();
            fetchRecords();
        } catch (error) {
            console.error('Failed to save company settings', error);
            toast.error(error.response?.data?.message || 'Failed to save company settings');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Delete company settings for ${record.company_name}?`)) return;

        try {
            await companySettingService.delete(record.id);
            toast.success('Company settings deleted');
            fetchRecords();
        } catch (error) {
            console.error('Failed to delete company settings', error);
            toast.error(error.response?.data?.message || 'Failed to delete company settings');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Building2 className="text-brand-600" /> Company Settings
                    </h1>
                    <p className="text-gray-500 font-medium text-sm">Owner-only legal company information and stamp.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                >
                    <Plus size={20} /> Add Company
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <Table headers={['Company', 'NIF', 'RC', 'Phone', 'Stamp', 'Actions']}>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                            </TableCell>
                        </TableRow>
                    ) : records.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-20 text-gray-500 font-bold">
                                No company settings created yet.
                            </TableCell>
                        </TableRow>
                    ) : records.map((record) => (
                        <TableRow key={record.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900 dark:text-white">{record.company_name}</p>
                                        <p className="text-[10px] text-gray-400 font-mono uppercase">{record.id.substring(0, 8)}...</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="font-bold text-gray-700 dark:text-gray-300">{record.nif || 'N/A'}</span>
                            </TableCell>
                            <TableCell>
                                <span className="font-bold text-gray-700 dark:text-gray-300">{record.rc || 'N/A'}</span>
                            </TableCell>
                            <TableCell>
                                <span className="font-bold text-gray-700 dark:text-gray-300">{record.phone || 'N/A'}</span>
                            </TableCell>
                            <TableCell>
                                {record.stamp_url ? (
                                    <img
                                        src={getImageUrl(record.stamp_url)}
                                        alt={`${record.company_name} stamp`}
                                        className="h-12 w-20 object-contain rounded-lg border border-gray-100 dark:border-gray-700 bg-white"
                                    />
                                ) : (
                                    <span className="text-gray-400 text-xs font-bold">No stamp</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openModal(record)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(record)}
                                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </Table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-2xl w-full animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
                            {editingRecord ? 'Edit Company Settings' : 'Create Company Settings'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Company Name *</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        name="company_name"
                                        type="text"
                                        required
                                        value={formData.company_name}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-5 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all font-bold dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">NIF</label>
                                    <div className="relative">
                                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            name="nif"
                                            type="text"
                                            value={formData.nif}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-5 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">RC</label>
                                    <div className="relative">
                                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            name="rc"
                                            type="text"
                                            value={formData.rc}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-5 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        name="phone"
                                        type="text"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-5 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Stamp PNG</label>
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                    <div className="w-36 h-24 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-center overflow-hidden">
                                        {stampPreview ? (
                                            <img src={stampPreview} alt="Stamp preview" className="w-full h-full object-contain bg-white p-2" />
                                        ) : (
                                            <Stamp className="text-gray-300" size={32} />
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png"
                                        onChange={handleStampChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-xl file:border-0 file:bg-brand-50 file:px-4 file:py-3 file:text-sm file:font-bold file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/30 dark:file:text-brand-300"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                                >
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanySettings;
