import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Lock, Save, Camera, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user, updateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        confirmPassword: ''
    });

    const handleUpdate = async (e) => {
        e.preventDefault();
        
        if (formData.password && formData.password !== formData.confirmPassword) {
            return toast.error("Passwords do not match");
        }

        setIsLoading(true);
        try {
            const payload = {
                name: formData.name,
                email: formData.email
            };
            if (formData.password) payload.password = formData.password;

            await updateProfile(payload);
            toast.success("Profile updated successfully");
            setIsEditing(false);
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">My Profile</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage your account information and security settings</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-100/50 dark:shadow-none flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-brand-200 dark:shadow-none">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <button className="absolute -bottom-2 -right-2 p-3 bg-white dark:bg-gray-700 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-600 text-brand-600 dark:text-brand-400 hover:scale-110 transition-transform">
                                <Camera size={20} />
                            </button>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{user?.name}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">{user?.email}</p>
                        
                        <div className="w-full space-y-3 pt-6 border-t border-gray-50 dark:border-gray-700">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Role</span>
                                <span className="px-3 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg font-bold text-[10px] uppercase tracking-wider">
                                    {user?.role}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Status</span>
                                <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-bold text-[10px] uppercase tracking-wider">
                                    <CheckCircle size={12} /> Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-100/50 dark:shadow-none">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Account Settings</h3>
                            {!isEditing && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 text-brand-600 dark:text-brand-400 font-bold text-sm bg-brand-50 dark:bg-brand-900/30 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Full Name</label>
                                    <div className="relative group">
                                        <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isEditing ? 'text-brand-500' : 'text-gray-400'}`} size={18} />
                                        <input 
                                            type="text"
                                            disabled={!isEditing}
                                            required
                                            className={`input-field pl-12 h-14 rounded-2xl ${!isEditing ? 'bg-gray-50 dark:bg-gray-900 border-transparent cursor-not-allowed' : 'bg-white dark:bg-gray-900'}`}
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Email Address</label>
                                    <div className="relative group">
                                        <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isEditing ? 'text-brand-500' : 'text-gray-400'}`} size={18} />
                                        <input 
                                            type="email"
                                            disabled={!isEditing}
                                            required
                                            className={`input-field pl-12 h-14 rounded-2xl ${!isEditing ? 'bg-gray-50 dark:bg-gray-900 border-transparent cursor-not-allowed' : 'bg-white dark:bg-gray-900'}`}
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="pt-6 mt-6 border-t border-gray-50 dark:border-gray-700 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-6">
                                        <Shield size={18} className="text-brand-500" />
                                        Update Password
                                        <span className="text-[10px] font-medium text-gray-400 ml-2">(Optional)</span>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">New Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" size={18} />
                                                <input 
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="input-field pl-12 h-14 rounded-2xl bg-white dark:bg-gray-900"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Confirm New Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" size={18} />
                                                <input 
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="input-field pl-12 h-14 rounded-2xl bg-white dark:bg-gray-900"
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isEditing && (
                                <div className="flex gap-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <button 
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold h-14 rounded-2xl shadow-lg shadow-brand-100 dark:shadow-none flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isLoading ? "Saving Changes..." : <><Save size={20} /> Save Profile</>}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                name: user?.name || '',
                                                email: user?.email || '',
                                                password: '',
                                                confirmPassword: ''
                                            });
                                        }}
                                        className="px-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-bold h-14 rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
