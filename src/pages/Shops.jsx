import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Store, Plus, ArrowRight, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Table, { TableRow, TableCell } from '../components/Table';
import StatusBadge from '../components/StatusBadge';

const Shops = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const { setShopContext } = useAuth();
    const navigate = useNavigate();

    // Form state for creating a new shop
    const [isCreating, setIsCreating] = useState(false);
    const [editingShop, setEditingShop] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'RETAIL',
        address: '',
        phone: '',
        email: '',
        logo_url: ''
    });

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            setLoading(true);
            const response = await api.get('/shops');
            const data = response.data.data || response.data;
            setShops(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch shops", error);
            toast.error("Failed to load shops");
            setShops([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectShop = (shopId) => {
        setShopContext(shopId);
        toast.success("Shop selected successfully!");
        navigate('/dashboard/admin');
    };

    const handleOpenEdit = (shop) => {
        setEditingShop(shop);
        setFormData({
            name: shop.name,
            type: shop.type,
            address: shop.address || '',
            phone: shop.phone || '',
            email: shop.email || '',
            logo_url: shop.logo_url || ''
        });
        setIsCreating(true);
    };

    const handleToggleStatus = async (shop) => {
        const newStatus = shop.status === 'active' ? 'inactive' : 'active';
        try {
            await api.put(`/shops/${shop.id}`, { status: newStatus });
            toast.success(`Shop ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
            fetchShops();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this shop? This will archive all its data.")) {
            try {
                await api.delete(`/shops/${id}`);
                toast.success("Shop deleted successfully");
                fetchShops();
            } catch (error) {
                toast.error("Failed to delete shop");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        try {
            setLoading(true);
            let finalLogoUrl = formData.logo_url;

            // 1. Handle File Upload if present
            const fileInput = document.getElementById('shop-logo-upload');
            if (fileInput && fileInput.files[0]) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', fileInput.files[0]);
                
                const uploadRes = await api.post('/uploads', uploadFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalLogoUrl = uploadRes.data.url;
            }

            if (editingShop) {
                // Update
                await api.put(`/shops/${editingShop.id}`, {
                    ...formData,
                    logo_url: finalLogoUrl || '/logo.png'
                });
                toast.success("Shop updated successfully!");
            } else {
                // Create Shop
                await api.post('/shops', {
                    ...formData,
                    logo_url: finalLogoUrl || '/logo.png',
                    status: 'active'
                });
                toast.success("Shop created successfully!");
            }
            
            setFormData({ name: '', type: 'RETAIL', address: '', phone: '', email: '', logo_url: '' });
            setIsCreating(false);
            setEditingShop(null);
            fetchShops();
            
        } catch (error) {
            console.error("Failed to save shop", error);
            toast.error(error.response?.data?.message || "Failed to save shop");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Store className="text-brand-600" /> My Shops
                    </h1>
                    <p className="text-gray-500 font-medium text-sm">Centralized management of your shop network</p>
                </div>
                <button
                    onClick={() => { setEditingShop(null); setIsCreating(true); }}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                >
                    <Plus size={20} /> New Shop
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <Table headers={['Shop', 'Type', 'Location', 'Contact', 'Status', 'Actions']}>
                    {loading && !shops.length ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                            </TableCell>
                        </TableRow>
                    ) : shops.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-20 text-gray-500 font-bold">No shops registered yet.</TableCell>
                        </TableRow>
                    ) : (
                        shops.map((shop) => (
                            <TableRow key={shop.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center p-2 border border-gray-100 dark:border-gray-600 overflow-hidden">
                                            <img src={shop.logo_url || '/logo.png'} alt="" className="w-full h-full object-contain" />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 dark:text-white">{shop.name}</p>
                                            <p className="text-[10px] text-gray-400 font-mono uppercase">{shop.id.substring(0, 8)}...</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-[10px] font-black px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full tracking-widest uppercase">
                                        {shop.type}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate max-w-[150px]">{shop.address || 'N/A'}</p>
                                </TableCell>
                                <TableCell>
                                    <div className="text-xs space-y-0.5">
                                        <p className="font-bold text-gray-700 dark:text-gray-300">{shop.phone || 'No Phone'}</p>
                                        <p className="text-gray-400">{shop.email || 'No Email'}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <button onClick={() => handleToggleStatus(shop)} title="Click to toggle status">
                                        <StatusBadge status={shop.status || 'active'} />
                                    </button>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleSelectShop(shop.id)}
                                            className="px-4 py-2 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl font-black text-[10px] hover:bg-brand-600 hover:text-white transition-all"
                                        >
                                            ENTER
                                        </button>
                                        <button onClick={() => handleOpenEdit(shop)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(shop.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </Table>
            </div>

            {isCreating && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-2xl w-full animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">{editingShop ? 'Edit Shop' : 'Create New Shop'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Shop Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all font-bold dark:text-white"
                                        placeholder="e.g. Downtown Boutique"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Operation Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                        className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-gray-900 font-bold dark:text-white"
                                    >
                                        <option value="RETAIL">Retail (Fast POS)</option>
                                        <option value="WAREHOUSE">Warehouse (Stock Only)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Phone Number</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold dark:text-white"
                                        placeholder="+257 ..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold dark:text-white"
                                        placeholder="shop@example.com"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Physical Address</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold dark:text-white h-20"
                                        placeholder="Full address details..."
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Shop Logo (Upload)</label>
                                    <div className="relative group">
                                        <input
                                            id="shop-logo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium px-1">Upload a professional logo for your brand (PNG, JPG, max 5MB)</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => { setIsCreating(false); setEditingShop(null); }}
                                    className="flex-1 py-4 px-6 border border-gray-100 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 font-black transition-colors"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 px-6 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-black shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                                >
                                    {editingShop ? 'SAVE CHANGES' : 'CREATE SHOP'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Shops;
