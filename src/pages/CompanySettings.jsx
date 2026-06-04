import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Edit2, FileText, Phone, Plus, Stamp } from 'lucide-react';
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
    const companyRecord = records[0] || null;

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

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Building2 className="text-brand-600" /> Company Settings
                    </h1>
                    <p className="text-gray-500 font-medium text-sm">Owner-only legal company information and stamp.</p>
                </div>
                {!loading && (
                    companyRecord ? (
                        <button
                            onClick={() => openModal(companyRecord)}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                        >
                            <Edit2 size={20} /> Edit Information
                        </button>
                    ) : (
                        <button
                            onClick={() => openModal()}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                        >
                            <Plus size={20} /> Add Company Information
                        </button>
                    )
                )}
            </div>

            {loading ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                </div>
            ) : companyRecord ? (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 md:p-8 space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 shrink-0">
                                <Building2 size={26} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Registered Company</p>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white break-words mt-1">
                                    {companyRecord.company_name}
                                </h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 p-4">
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">NIF</p>
                                <p className="font-black text-gray-900 dark:text-white break-words">{companyRecord.nif || 'N/A'}</p>
                            </div>
                            <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 p-4">
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">RC</p>
                                <p className="font-black text-gray-900 dark:text-white break-words">{companyRecord.rc || 'N/A'}</p>
                            </div>
                            <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 p-4">
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Phone</p>
                                <p className="font-black text-gray-900 dark:text-white break-words">{companyRecord.phone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-4">
                        <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                            <Stamp className="text-brand-600" size={20} />
                            <h3 className="font-black">Company Stamp</h3>
                        </div>
                        <div className="h-44 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-center overflow-hidden">
                            {companyRecord.stamp_url ? (
                                <img
                                    src={getImageUrl(companyRecord.stamp_url)}
                                    alt={`${companyRecord.company_name} stamp`}
                                    className="w-full h-full object-contain bg-white p-4"
                                />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <Stamp size={36} className="mx-auto mb-2" />
                                    <p className="text-xs font-bold">No stamp uploaded</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 md:p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 mx-auto mb-5">
                        <Building2 size={30} />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">No company information yet</h2>
                    <p className="text-gray-500 font-medium text-sm mt-2 max-w-md mx-auto">
                        Add the legal company information once. After it is saved, this page will only show the saved details and an edit option.
                    </p>
                    <button
                        onClick={() => openModal()}
                        className="mt-6 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                    >
                        <Plus size={20} /> Add Company Information
                    </button>
                </div>
            )}

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
