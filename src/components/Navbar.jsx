import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Bell, Search, User, LogOut, Settings as SettingsIcon,
    Menu, Plus, DollarSign, TrendingDown, Lock, Moon, Sun
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(
        localStorage.getItem('theme') === 'dark'
    );

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 transition-colors duration-200">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg lg:hidden text-gray-500 dark:text-gray-400 transition-colors"
                >
                    <Menu size={20} />
                </button>

                <Link to="/dashboard" className="flex items-center gap-2 group">
                    <span className="text-lg font-black text-brand-600 dark:text-brand-400 tracking-tight group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                        Accounting System
                    </span>
                </Link>
            </div>

            {/* Global Search - Hidden on small screens for now to save space */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
                <div className="relative group w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-brand-100 dark:focus:border-brand-900 focus:bg-white dark:focus:bg-gray-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900/20 transition-all outline-none text-gray-700 dark:text-gray-200"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-3">

                {/* Dark Mode Toggle */}
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 text-gray-400 hover:text-brand-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Settings Icon (Visible) */}
                {user?.role?.toLowerCase() === 'admin' && (
                    <button
                        onClick={() => navigate('/settings')}
                        className="hidden sm:block p-2 text-gray-400 hover:text-brand-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        title="Settings"
                    >
                        <SettingsIcon size={20} />
                    </button>
                )}

                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-brand-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                </button>

                {/* Logout Icon (Visible) */}
                <button
                    onClick={handleLogout}
                    className="hidden sm:block p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    title="Sign Out"
                >
                    <LogOut size={20} />
                </button>

                <div className="h-8 w-px bg-gray-100 dark:bg-gray-700 mx-1 hidden sm:block"></div>

                {/* User Profile */}
                <div className="relative group">
                    <div className="flex items-center gap-3 pl-2 cursor-pointer">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                {user?.name}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {user?.role}
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-100 dark:shadow-none">
                            <User size={20} />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
