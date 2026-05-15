import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { customerService } from '../services/customerService';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { UserPlus, Search, Edit2, Trash2, User, Phone, Mail, MapPin, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const Customers = () => {
    const { user } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        customer_type: 'RETAIL'
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const data = await customerService.getAll();
            setCustomers(Array.isArray(data) ? data : (data?.customers || []));
        } catch (error) {
            toast.error("Failed to load customers");
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name,
                phone: customer.phone || '',
                email: customer.email || '',
                address: customer.address || '',
                customer_type: customer.customer_type || 'RETAIL'
            });
        } else {
            setEditingCustomer(null);
            setFormData({ name: '', phone: '', email: '', address: '', customer_type: 'RETAIL' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await customerService.update(editingCustomer.id, formData);
                toast.success("Customer updated");
            } else {
                await customerService.create(formData);
                toast.success("Customer added");
            }
            setIsModalOpen(false);
            fetchCustomers();
        } catch (error) {
            toast.error("Failed to save customer");
        }
    };

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.phone?.includes(searchTerm)
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="text-brand-600" /> Customers
                    </h1>
                    <p className="text-gray-500 font-medium text-sm">Manage your client database and loyalty</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
                >
                    <UserPlus size={20} /> Add Customer
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-transparent rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                />
            </div>

            <Table headers={['Customer', 'Contact', 'Type', 'Actions']}>
                {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10">Loading...</TableCell></TableRow>
                ) : filteredCustomers.map(c => (
                    <TableRow key={c.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-black">
                                    {c.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{c.name}</p>
                                    <p className="text-xs text-gray-400 truncate max-w-[150px]">{c.address || 'No address'}</p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="space-y-1">
                                <p className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <Phone size={12} className="text-gray-400" /> {c.phone || 'N/A'}
                                </p>
                                <p className="text-xs flex items-center gap-2 text-gray-500">
                                    <Mail size={12} className="text-gray-400" /> {c.email || 'N/A'}
                                </p>
                            </div>
                        </TableCell>
                        <TableCell>
                            <StatusBadge status={c.customer_type} />
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1">
                                <button onClick={() => handleOpenModal(c)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </Table>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? 'Edit Customer' : 'New Customer'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                        <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                            <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
                        <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Customer Type</label>
                        <select value={formData.customer_type} onChange={e => setFormData({...formData, customer_type: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20">
                            <option value="RETAIL">Retail (Standard)</option>
                            <option value="PARTNER">Partner (Discount)</option>
                            <option value="WHOLESALE">Wholesale (Bulk)</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border rounded-xl font-bold">Cancel</button>
                        <button type="submit" className="px-8 py-2 bg-brand-600 text-white rounded-xl font-bold shadow-lg">Save Customer</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Customers;
