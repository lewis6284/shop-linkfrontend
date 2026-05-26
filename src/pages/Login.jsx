import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Mail } from 'lucide-react';
import BackgroundWatermark from '../components/BackgroundWatermark';
import api from '../services/api';

import { getImageUrl } from '../utils/imageUrl';

const Login = () => {
    const { login, user, isAuthenticated, shop } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'owner') {
                navigate('/dashboard/admin', { replace: true });
            } else if (user.role === 'manager') {
                navigate('/dashboard/shop', { replace: true });
            } else {
                navigate('/pos', { replace: true });
            }
        }
    }, [isAuthenticated, user, navigate]);

    // Fallback logo: first letter of shop name or 'S'
    const shopInitial = shop?.name?.charAt(0).toUpperCase() || 'S';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data.data;

            // Store token and user in context
            login(user, token);
            toast.success('Welcome back!');

            // Route dynamically based on role
            if (user.role === 'owner') {
                navigate('/dashboard/admin');
            } else if (user.role === 'manager') {
                navigate('/dashboard/shop');
            } else {
                navigate('/pos');
            }
        } catch (error) {
            console.error("Login Error:", error);
            toast.error(error.response?.data?.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center 
        bg-[#020617] relative overflow-hidden transition-colors duration-1000">
            
            {/* BRILLIANT COSMIC STARRY SKY */}
            <div className="absolute inset-0 z-0">
                {/* Nebula Clouds */}
                <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-brand-600/20 rounded-full blur-[150px] animate-pulse duration-[15s]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[1200px] h-[1200px] bg-blue-600/10 rounded-full blur-[180px] animate-pulse duration-[20s]"></div>
                
                {/* DENSE STAR FIELD */}
                <div className="absolute inset-0">
                    {[...Array(150)].map((_, i) => (
                        <div
                            key={`star-${i}`}
                            className="absolute bg-white rounded-full animate-twinkle shadow-[0_0_5px_white]"
                            style={{
                                width: `${Math.random() * 2 + 1}px`,
                                height: `${Math.random() * 2 + 1}px`,
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 10}s`,
                                opacity: Math.random() * 0.8 + 0.2
                            }}
                        />
                    ))}
                    
                    {/* BRIGHT GLINT STARS */}
                    {[...Array(15)].map((_, i) => (
                        <div
                            key={`glint-${i}`}
                            className="absolute animate-twinkle"
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`,
                            }}
                        >
                            <div className="absolute w-1 h-8 bg-white/20 blur-[2px] -translate-x-1/2 -translate-y-1/2"></div>
                            <div className="absolute w-8 h-1 bg-white/20 blur-[2px] -translate-x-1/2 -translate-y-1/2"></div>
                            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                        </div>
                    ))}
                </div>

                {/* Ambient Backlight */}
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/10 via-transparent to-blue-600/10"></div>
            </div>

            <BackgroundWatermark />



            <div
                className="w-full h-full sm:h-auto sm:max-w-md p-6 sm:p-10 bg-black/50 backdrop-blur-[50px] 
                sm:rounded-[50px] shadow-[0_0_150px_rgba(var(--brand-600-rgb),0.2)] border-x-0 sm:border border-white/10 relative z-10 flex flex-col justify-center animate-in fade-in zoom-in duration-1000 animate-shimmer"
            >


                {/* Logo Section */}
                {/* <div className="text-center mb-10">
                    <div className="w-24 h-24 mx-auto mb-6 bg-white dark:bg-gray-800 rounded-3xl flex items-center justify-center shadow-2xl shadow-black/20 overflow-hidden ring-4 ring-white/10 group relative">
                        <img
                            src={getImageUrl(shop?.logo_url)}
                            alt={shop?.name || 'ShopLink'}
                            className="w-full h-full object-contain p-4 transition-transform group-hover:scale-110 duration-500"
                        />
                    </div>

                    <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        {shop?.name || (
                            <>
                                <span className="text-brand-500 uppercase">Shop</span>
                                <span className="text-white uppercase">Link</span>
                            </>
                        )}
                    </h1>

                    <p className="text-gray-400 text-sm font-bold uppercase tracking-[0.3em] mt-3 opacity-80">
                        {shop ? `${shop.type} ACCESS` : 'SaaS Business Suite'}
                    </p>
                </div> */}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Email */}
                    <div className="group">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">
                            Email Address
                        </label>

                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-500 transition-colors" size={18} />
                            <input
                                type="email"
                                required
                                placeholder="you@company.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 p-4 rounded-2xl border border-white/5
                                bg-white/5 text-gray-100
                                focus:bg-white/10 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10
                                outline-none transition-all font-bold placeholder:text-gray-600"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="group">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">
                            Password
                        </label>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 p-4 rounded-2xl border border-white/5
                                bg-white/5 text-gray-100
                                focus:bg-white/10 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                                outline-none transition-all font-bold placeholder:text-gray-600"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Link
                            to="/forgot-password"
                            className="text-xs font-bold text-gray-400 hover:text-white transition-all tracking-wider"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    {/* Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full bg-gradient-to-r from-brand-600 to-blue-600 
                        text-white font-black py-4 rounded-2xl shadow-xl shadow-brand-600/20
                        transition-all duration-300 relative overflow-hidden group
                        ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95 hover:shadow-brand-600/40'}`}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {isLoading ? 'SIGNING IN...' : 'ACCESS DASHBOARD'}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    </button>

                </form>

            </div>

        </div>
    );
};

export default Login;