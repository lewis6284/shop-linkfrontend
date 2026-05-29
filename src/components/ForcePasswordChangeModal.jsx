import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ShieldAlert, KeyRound } from 'lucide-react';

const ForcePasswordChangeModal = () => {
    const { user, updateUser, logout } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (!user || !user.requires_password_change) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            return toast.error("New passwords do not match!");
        }
        if (newPassword.length < 6) {
            return toast.error("Password must be at least 6 characters long.");
        }

        const loadingId = toast.loading("Updating password...");
        try {
            setLoading(true);
            const response = await api.post('/auth/change-password', {
                oldPassword,
                newPassword
            });

            // If success, response.data.data contains the updated user
            toast.success("Password updated successfully!", { id: loadingId });
            updateUser({ requires_password_change: false });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update password. Check your current password.", { id: loadingId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="bg-brand-600 p-6 text-center text-white space-y-2 relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShieldAlert size={80} />
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                        <KeyRound size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-wider">Security Update</h2>
                    <p className="text-sm font-medium text-brand-100">
                        Please set a new password to secure your account before continuing.
                    </p>
                </div>
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/50 font-bold dark:text-white"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/50 font-bold dark:text-white"
                                required
                                minLength={6}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/50 font-bold dark:text-white"
                                required
                                minLength={6}
                                disabled={loading}
                            />
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Update Password'}
                            </button>
                            <button
                                type="button"
                                onClick={logout}
                                disabled={loading}
                                className="px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                            >
                                Logout
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForcePasswordChangeModal;
