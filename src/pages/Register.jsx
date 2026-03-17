import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Lock, Mail, Shield } from 'lucide-react';

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('accountant'); // Default

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(name, email, password, role);
            toast.success('Staff added successfully!');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            toast.error('Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-100 to-purple-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50 backdrop-blur-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-brand-900">FinApp</h1>
                    <p className="text-gray-500 mt-2">Create a new account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                required
                                className="pl-10 w-full p-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                                placeholder="John Doe"
                                value={name} onChange={e => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="email"
                                required
                                className="pl-10 w-full p-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                                placeholder="you@company.com"
                                value={email} onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="password"
                                required
                                className="pl-10 w-full p-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                                placeholder="••••••••"
                                value={password} onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <select
                                className="pl-10 w-full p-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all bg-white"
                                value={role} onChange={e => setRole(e.target.value)}
                            >
                                <option value="accountant">Accountant</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-all transform hover:scale-[1.02] mt-4"
                    >
                        Add staff
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register;
