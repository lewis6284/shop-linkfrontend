import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import { getCandidatePaymentTypes, createCandidatePaymentType, deleteCandidatePaymentType } from '../services/basicDataService';
import { Receipt, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CandidatePaymentTypes = () => {
    const [types, setTypes] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newItemName, setNewItemName] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getCandidatePaymentTypes();
            setTypes(data);
        } catch (error) {
            toast.error("Failed to load types");
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await createCandidatePaymentType({ name: newItemName });
            toast.success("Payment Type added");
            setNewItemName('');
            setIsAddModalOpen(false);
            loadData();
        } catch (error) { toast.error("Failed to add type"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await deleteCandidatePaymentType(id);
            toast.success("Type deleted");
            loadData();
        } catch (error) { toast.error("Failed to delete type"); }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Payment Types</h1>
                    <p className="text-sm text-gray-500">Manage types of payments for candidates</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn-primary flex items-center gap-2 bg-brand-600"
                >
                    <Plus size={20} /> Add Payment Type
                </button>
            </div>

            <Table headers={['Payment Type', 'Actions']}>
                {types.map(item => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium text-gray-800 flex items-center gap-2">
                            <Receipt size={16} className="text-brand-500" /> {item.name}
                        </TableCell>
                        <TableCell>
                            <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 p-1">
                                <Trash2 size={18} />
                            </button>
                        </TableCell>
                    </TableRow>
                ))}
            </Table>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Payment Type">
                <form onSubmit={handleAdd} className="space-y-4">
                    <div>
                        <label className="label">Type Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            required
                            placeholder="e.g. Visa Fee, Uniform"
                        />
                    </div>
                    <button type="submit" className="w-full btn-primary bg-brand-600">Add Type</button>
                </form>
            </Modal>
        </>
    );
};

export default CandidatePaymentTypes;
