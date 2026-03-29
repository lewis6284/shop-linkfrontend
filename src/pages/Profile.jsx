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
        <div className="max-w-5xl mx-auto py-10 px-4">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    My Profile
                </h1>
                <p className="text-gray-500 mt-1">
                    Manage your account information
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Profile Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col items-center text-center">

                        <div className="relative mb-5">
                            <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 
                            flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>

                            <button className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 
                            p-2 rounded-xl shadow border hover:scale-105 transition">
                                <Camera size={18} />
                            </button>
                        </div>

                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {user?.name}
                        </h2>

                        <p className="text-sm text-gray-500 mb-6">
                            {user?.email}
                        </p>

                        <div className="w-full space-y-3 border-t pt-5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Role</span>
                                <span className="font-medium text-indigo-600">
                                    {user?.role}
                                </span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Status</span>
                                <span className="flex items-center gap-1 text-green-600 font-medium">
                                    <CheckCircle size={14} /> Active
                                </span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Form */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl 
                shadow-sm border border-gray-100 dark:border-gray-700 p-8">

                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Account Settings
                        </h3>

                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 
                                rounded-xl text-sm font-medium hover:bg-indigo-100 transition"
                            >
                                Edit
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-6">

                        <div className="grid md:grid-cols-2 gap-6">

                            {/* Name */}
                            <div>
                                <label className="text-sm text-gray-500 mb-1 block">
                                    Full Name
                                </label>

                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-10 h-12 rounded-xl border 
                                        border-gray-200 dark:border-gray-600
                                        bg-gray-50 dark:bg-gray-900
                                        focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="text-sm text-gray-500 mb-1 block">
                                    Email
                                </label>

                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        disabled={!isEditing}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 h-12 rounded-xl border 
                                        border-gray-200 dark:border-gray-600
                                        bg-gray-50 dark:bg-gray-900
                                        focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                        </div>

                        {isEditing && (
                            <div className="border-t pt-6">
                                <h4 className="flex items-center gap-2 font-medium mb-4">
                                    <Shield size={16} /> Change Password
                                </h4>

                                <div className="grid md:grid-cols-2 gap-6">

                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="password"
                                            placeholder="New password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full pl-10 h-12 rounded-xl border border-gray-200 dark:border-gray-600
                                            focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="password"
                                            placeholder="Confirm password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full pl-10 h-12 rounded-xl border border-gray-200 dark:border-gray-600
                                            focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                </div>
                            </div>
                        )}

                        {isEditing && (
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700
                                    text-white h-12 rounded-xl font-medium
                                    flex items-center justify-center gap-2 transition"
                                >
                                    <Save size={18} />
                                    {isLoading ? "Saving..." : "Save Changes"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 h-12 bg-gray-100 dark:bg-gray-700 
                                    rounded-xl font-medium hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;