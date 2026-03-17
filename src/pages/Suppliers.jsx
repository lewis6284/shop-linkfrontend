import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/basicDataService';
import { Truck, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            console.log("📂 [Suppliers] Fetching all suppliers...");
            const data = await getSuppliers();
            console.log("✅ [Suppliers] Received data:", data);
            setSuppliers(data);
        } catch (error) {
            console.error("❌ [Suppliers] Load failed:", error);
            toast.error("Failed to load suppliers");
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        console.log("📤 [Suppliers] Adding new supplier:", formData);
        try {
            await createSupplier(formData);
            toast.success("Supplier added");
            setFormData({ name: '', phone: '', email: '' });
            setIsAddModalOpen(false);
            loadData();
        } catch (error) {
            console.error("❌ [Suppliers] Addition failed:", error.response?.data || error.message);
            toast.error("Failed to add supplier");
        }
    };

    const handleEditClick = (supplier) => {
        setFormData({ name: supplier.name, phone: supplier.phone || '', email: supplier.email || '' });
        setEditingId(supplier.id);
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        console.log(`📤 [Suppliers] Updating supplier ${editingId}:`, formData);
        try {
            await updateSupplier(editingId, formData);
            toast.success("Supplier updated");
            setIsEditModalOpen(false);
            setFormData({ name: '', phone: '', email: '' });
            setEditingId(null);
            loadData();
        } catch (error) {
            console.error("❌ [Suppliers] Update failed:", error.response?.data || error.message);
            toast.error("Failed to update supplier");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this supplier?")) return;
        try {
            await deleteSupplier(id);
            toast.success("Supplier deleted");
            loadData();
        } catch (error) {
            const errorMessage = error.response?.data?.error || "Failed to delete supplier";
            toast.error(errorMessage);
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
                    <p className="text-sm text-gray-500">Manage external suppliers</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ name: '', phone: '', email: '' });
                        setIsAddModalOpen(true);
                    }}
                    className="btn-primary flex items-center gap-2 bg-brand-600"
                >
                    <Plus size={20} /> Add Supplier
                </button>
            </div>

            <Table headers={['Supplier Name', 'Phone', 'Email', 'Actions']}>
                {suppliers.map(item => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium text-gray-800 flex items-center gap-2">
                            <Truck size={16} className="text-brand-500" /> {item.name}
                        </TableCell>
                        <TableCell className="text-gray-500">{item.phone || '-'}</TableCell>
                        <TableCell className="text-gray-500">{item.email || '-'}</TableCell>
                        <TableCell>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditClick(item)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    title="Edit"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </Table>

            {/* Add Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Supplier">
                <form onSubmit={handleAdd} className="space-y-4">
                    <div>
                        <label className="label">Supplier Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Phone</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+123..."
                            />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                className="input-field"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="supplier@example.com"
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full btn-primary bg-brand-600">Add Supplier</button>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Supplier">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="label">Supplier Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Phone</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+123..."
                            />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                className="input-field"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="supplier@example.com"
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full btn-primary bg-blue-600">Update Supplier</button>
                </form>
            </Modal>
        </>
    );
};

export default Suppliers;
