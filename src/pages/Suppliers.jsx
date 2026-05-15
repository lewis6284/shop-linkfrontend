import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supplierService } from '../services/supplierService';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import { Truck, Search, Edit2, Trash2, Phone, Mail, MapPin, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const Suppliers = () => {
    const { user } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        phone: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const data = await supplierService.getAll();
            setSuppliers(Array.isArray(data) ? data : (data?.suppliers || []));
        } catch (error) {
            toast.error("Failed to load suppliers");
            setSuppliers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name,
                contact: supplier.contact || '',
                phone: supplier.phone || '',
                email: supplier.email || '',
                address: supplier.address || ''
            });
        } else {
            setEditingSupplier(null);
            setFormData({ name: '', contact: '', phone: '', email: '', address: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await supplierService.update(editingSupplier.id, formData);
                toast.success("Supplier updated");
            } else {
                await supplierService.create(formData);
                toast.success("Supplier added");
            }
            setIsModalOpen(false);
            fetchSuppliers();
        } catch (error) {
            toast.error("Failed to save supplier");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to remove this supplier?")) {
            try {
                await supplierService.delete(id);
                toast.success("Supplier removed");
                fetchSuppliers();
            } catch (error) {
                toast.error("Action failed");
            }
        }
    };

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.contact?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isAuthorized = user?.role === 'owner' || user?.role === 'manager';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Truck className="text-brand-600" /> Suppliers & Partners
                    </h1>
                    <p className="text-gray-500 font-medium text-sm">Manage your supply chain and procurement contacts</p>
                </div>
                {isAuthorized && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
                    >
                        <Plus size={20} /> Add Supplier
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by company name or contact person..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-transparent rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                />
            </div>

            <Table headers={['Supplier', 'Contact Person', 'Details', 'Actions']}>
                {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10">Loading...</TableCell></TableRow>
                ) : filteredSuppliers.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-20 text-gray-400">No suppliers found.</TableCell></TableRow>
                ) : filteredSuppliers.map(s => (
                    <TableRow key={s.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                    <Truck size={20} />
                                </div>
                                <p className="font-bold text-gray-900 dark:text-white">{s.name}</p>
                            </div>
                        </TableCell>
                        <TableCell>
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{s.contact || 'N/A'}</p>
                        </TableCell>
                        <TableCell>
                            <div className="space-y-1">
                                {s.phone && <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-tighter"><Phone size={10} /> {s.phone}</p>}
                                {s.email && <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 lowercase"><Mail size={10} /> {s.email}</p>}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1">
                                <button onClick={() => handleOpenModal(s)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(s.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </Table>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSupplier ? 'Edit Supplier' : 'New Supplier'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Company Name</label>
                        <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 font-bold" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contact Person</label>
                        <input value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 font-bold" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Phone</label>
                            <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 font-mono" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Address</label>
                        <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 border rounded-xl font-black text-xs uppercase tracking-widest text-gray-500">Cancel</button>
                        <button type="submit" className="px-10 py-3 bg-brand-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-500/20">Save Supplier</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Suppliers;
