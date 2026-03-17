import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import { getExpenseCategories, createExpenseCategory, deleteExpenseCategory } from '../services/basicDataService';
import { Tag, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ExpenseCategories = () => {
    const [categories, setCategories] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newItemName, setNewItemName] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getExpenseCategories();
            setCategories(data);
        } catch (error) {
            toast.error("Failed to load categories");
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await createExpenseCategory({ name: newItemName });
            toast.success("Category added");
            setNewItemName('');
            setIsAddModalOpen(false);
            loadData();
        } catch (error) { toast.error("Failed to add category"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await deleteExpenseCategory(id);
            toast.success("Category deleted");
            loadData();
        } catch (error) { toast.error("Failed to delete category"); }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Expense Categories</h1>
                    <p className="text-sm text-gray-500">Manage categories for expenses</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn-primary flex items-center gap-2 bg-brand-600"
                >
                    <Plus size={20} /> Add Category
                </button>
            </div>

            <Table headers={['Category Name', 'Actions']}>
                {categories.map(item => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium text-gray-800 flex items-center gap-2">
                            <Tag size={16} className="text-brand-500" /> {item.name}
                        </TableCell>
                        <TableCell>
                            <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 p-1">
                                <Trash2 size={18} />
                            </button>
                        </TableCell>
                    </TableRow>
                ))}
            </Table>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Expense Category">
                <form onSubmit={handleAdd} className="space-y-4">
                    <div>
                        <label className="label">Category Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            required
                            placeholder="e.g. Travel, Office Supplies"
                        />
                    </div>
                    <button type="submit" className="w-full btn-primary bg-brand-600">Add Category</button>
                </form>
            </Modal>
        </>
    );
};

export default ExpenseCategories;
