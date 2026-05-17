import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { UserPlus, Search, Edit2, Trash2, Shield, Filter, Mail, Phone, Lock, User as UserIcon, Store, UserCheck, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';

const Users = () => {
    const { user: currentUser, activeShopId } = useAuth();
    const [users, setUsers] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [shopFilter, setShopFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        pin_code: '',
        role: 'cashier',
        ShopId: '',
        is_active: true
    });

    useEffect(() => {
        if (currentUser) {
            fetchData();
        }
    }, [currentUser, activeShopId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersData, shopsData] = await Promise.all([
                userService.getUsers(),
                (currentUser?.role === 'owner' || currentUser?.role === 'manager') ? userService.getShops() : Promise.resolve([])
            ]);
            
            // Defensive data handling
            const usersList = Array.isArray(usersData) ? usersData : (usersData?.data || usersData?.users || []);
            const shopsList = Array.isArray(shopsData) ? shopsData : (shopsData?.data || shopsData?.shops || []);
            
            setUsers(usersList);
            setShops(shopsList);
            
            // Default ShopId for Managers
            if (currentUser?.role === 'manager') {
                setFormData(prev => ({ ...prev, ShopId: activeShopId }));
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Failed to load users");
            setUsers([]);
            setShops([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                full_name: user.full_name,
                username: user.username,
                email: user.email,
                phone: user.phone || '',
                password: '', // Don't show password
                pin_code: user.pin_code || '',
                role: user.role,
                ShopId: user.ShopId || '',
                is_active: user.is_active
            });
        } else {
            setEditingUser(null);
            setFormData({
                full_name: '',
                username: '',
                email: '',
                phone: '',
                password: '',
                pin_code: '',
                role: currentUser?.role === 'manager' ? 'cashier' : 'manager',
                ShopId: currentUser?.role === 'manager' ? activeShopId : '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await userService.updateUser(editingUser.id, formData);
                toast.success("User updated successfully");
            } else {
                await userService.createUser(formData);
                toast.success("User created successfully");
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Failed to save user", error);
            toast.error(error.response?.data?.message || "Failed to save user");
        }
    };

    const handleToggleStatus = async (userToToggle) => {
        const action = userToToggle.is_active ? 'deactivate' : 'activate';
        if (window.confirm(`Are you sure you want to ${action} ${userToToggle.full_name}?`)) {
            try {
                await userService.updateUser(userToToggle.id, { is_active: !userToToggle.is_active });
                toast.success(`User ${action}d successfully`);
                fetchData();
            } catch (error) {
                toast.error(`Failed to ${action} user`);
            }
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter ? u.role === roleFilter : true;
        const matchesShop = shopFilter ? u.ShopId === shopFilter : true;
        const matchesStatus = statusFilter ? (statusFilter === 'ACTIVE' ? u.is_active : !u.is_active) : true;
        return matchesSearch && matchesRole && matchesShop && matchesStatus;
    });

    // Permission checks
    const canCreate = currentUser?.role === 'owner' || currentUser?.role === 'manager';
    const canEdit = (targetUser) => {
        if (currentUser?.role === 'owner') return true;
        if (currentUser?.role === 'manager' && targetUser.role === 'cashier' && targetUser.ShopId === activeShopId) return true;
        return false;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="text-brand-600" /> User Management
                    </h1>
                    <p className="text-gray-500 font-medium text-sm">Manage staff roles and shop access</p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                    >
                        <UserPlus size={20} /> Create User
                    </button>
                )}
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search name, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 outline-none text-sm"
                >
                    <option value="">All Roles</option>
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                </select>
                {currentUser?.role === 'owner' && (
                    <select
                        value={shopFilter}
                        onChange={(e) => setShopFilter(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 outline-none text-sm"
                    >
                        <option value="">All Shops</option>
                        {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                )}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 outline-none text-sm"
                >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                </select>
            </div>

            {/* Users Table */}
            <Table headers={['User', 'Role', 'Shop', 'Status', 'Last Login', 'Actions']}>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                        </TableCell>
                    </TableRow>
                ) : filteredUsers.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-20 text-gray-500 font-medium">
                            No users found matching your filters.
                        </TableCell>
                    </TableRow>
                ) : filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-black">
                                    {u.full_name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{u.full_name}</p>
                                    <p className="text-xs text-gray-500">@{u.username}</p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                                u.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                                u.role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                {u.role}
                            </span>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1 text-xs font-medium">
                                <Store size={14} className="text-gray-400" />
                                {u.Shop?.name || 'N/A (Global)'}
                            </div>
                        </TableCell>
                        <TableCell>
                            {u.id !== currentUser.id && canEdit(u) ? (
                                <div className="flex items-center gap-3">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={u.is_active} 
                                            onChange={() => handleToggleStatus(u)} 
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 transition-colors"></div>
                                    </label>
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {u.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 opacity-60">
                                    <div className="relative inline-flex items-center">
                                        <div className={`w-11 h-6 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 ${
                                            u.is_active ? 'bg-emerald-500 after:translate-x-full after:border-white' : 'bg-gray-200 dark:bg-gray-700'
                                        }`}></div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {u.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            )}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                            {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                {canEdit(u) && (
                                    <>
                                        <button 
                                            onClick={() => handleOpenModal(u)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="Edit User"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        {u.id !== currentUser.id && (
                                            <button 
                                                onClick={() => handleToggleStatus(u)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    u.is_active 
                                                        ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20' 
                                                        : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                                }`}
                                                title={u.is_active ? 'Deactivate User' : 'Activate User'}
                                            >
                                                {u.is_active ? <UserMinus size={16} /> : <UserCheck size={16} />}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </Table>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingUser ? 'Edit User' : 'Create New User'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    required
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                                <input
                                    required
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    className="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20"
                                    placeholder="johndoe"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20"
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20"
                                placeholder="+257 ..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Initial Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    required={!editingUser}
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">PIN Code (POS)</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    maxLength="4"
                                    value={formData.pin_code}
                                    onChange={(e) => setFormData({...formData, pin_code: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20"
                                    placeholder="1234"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Role</label>
                            <select
                                required
                                value={formData.role}
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20"
                            >
                                {currentUser?.role === 'owner' && <option value="manager">Manager</option>}
                                <option value="cashier">Cashier</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Shop</label>
                            <select
                                required
                                disabled={currentUser?.role === 'manager'}
                                value={formData.ShopId}
                                onChange={(e) => setFormData({...formData, ShopId: e.target.value})}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
                            >
                                <option value="">Select Shop</option>
                                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-2 border rounded-xl text-gray-600 hover:bg-gray-50 font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-bold shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                        >
                            {editingUser ? 'Update User' : 'Create User'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Users;
