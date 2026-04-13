import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Bell, Search, User, LogOut, Settings as SettingsIcon,
    Menu, Plus, DollarSign, TrendingDown, Lock, Moon, Sun,
    Loader2, X, ChevronDown
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { globalSearch } from '../services/searchService';

const Navbar = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'dark' : true; // Default to true if not set
    });

    // Global Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    
    const searchRef = useRef(null);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    useEffect(() => {
        const fetchResults = async () => {
            if (!searchQuery.trim() || searchQuery.length < 2) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }
            setIsSearching(true);
            try {
                const results = await globalSearch(searchQuery);
                setSearchResults(Array.isArray(results) ? results : []);
                setShowDropdown(true);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsSearching(false);
            }
        };

        const debounceTimer = setTimeout(fetchResults, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    // Close elements when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target) && !searchQuery) {
                setIsSearchExpanded(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchQuery]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 transition-all duration-200">
            <div className={`flex items-center gap-4 ${isSearchExpanded ? 'hidden sm:flex' : 'flex'}`}>
                <button
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg lg:hidden text-gray-500 dark:text-gray-400 transition-colors"
                >
                    <Menu size={20} />
                </button>

                <Link to="/dashboard" className="hidden xs:flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-black text-lg">A</div>
                </Link>
            </div>

            {/* Global Search */}
            <div 
                ref={searchRef}
                className={`flex-1 transition-all duration-300 ease-in-out relative ${isSearchExpanded ? 'mx-0 sm:mx-8 max-w-full' : 'max-w-xl mx-2 sm:mx-8'}`}
            >
                <div className={`relative group w-full ${!isSearchExpanded && 'hidden md:block'}`}>
                    {isSearching ? (
                        <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-500 animate-spin" size={18} />
                    ) : (
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                    )}
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (e.target.value.length >= 2) setShowDropdown(true);
                        }}
                        onFocus={() => { if (searchQuery.length >= 2) setShowDropdown(true); }}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                        placeholder="Search system..."
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-brand-100 dark:focus:border-brand-900 focus:bg-white dark:focus:bg-gray-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900/20 transition-all outline-none text-gray-700 dark:text-gray-200"
                    />
                </div>

                {/* Mobile Search Trigger */}
                {!isSearchExpanded && (
                    <button 
                        onClick={() => setIsSearchExpanded(true)}
                        className="md:hidden p-2 text-gray-400 hover:text-brand-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                        <Search size={20} />
                    </button>
                )}

                {/* Expanded Search for Mobile */}
                {isSearchExpanded && (
                    <div className="md:hidden flex items-center gap-2 w-full animate-in fade-in zoom-in-95 duration-200">
                        <div className="relative flex-1">
                             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-500" size={18} />
                             <input
                                autoFocus
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-0 outline-none text-gray-700 dark:text-gray-200"
                            />
                        </div>
                        <button 
                            onClick={() => { setIsSearchExpanded(false); setSearchQuery(''); }}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Search Dropdown */}
                {showDropdown && (searchQuery.length >= 2) && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 max-h-96 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                        {searchResults.length > 0 ? (
                            searchResults.map((result, idx) => (
                                <Link
                                    key={`${result.type}-${result.id}-${idx}`}
                                    to={result.link}
                                    onClick={() => { setShowDropdown(false); setSearchQuery(''); setIsSearchExpanded(false); }}
                                    className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{result.title}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-500 bg-brand-50 dark:bg-brand-900/30 px-1.5 py-0.5 rounded">
                                                {result.type}
                                            </span>
                                            <span className="text-xs text-gray-500 truncate">{result.subtitle}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : !isSearching ? (
                            <div className="p-4 text-center text-gray-500 text-sm">No results found</div>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Right Actions */}
            <div className={`flex items-center gap-1 sm:gap-2 ${isSearchExpanded ? 'hidden sm:flex' : 'flex'}`}>
                
                {/* Dark Mode Toggle - Direct Icon */}
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 text-gray-400 hover:text-brand-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Settings Icon - Direct for Admin */}
                {user?.role?.toLowerCase() === 'admin' && (
                    <button
                        onClick={() => navigate('/settings')}
                        className="p-2 text-gray-400 hover:text-brand-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                        <SettingsIcon size={20} />
                    </button>
                )}

                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-brand-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                </button>

                {/* Logout Icon - Direct */}
                <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                    <LogOut size={20} />
                </button>

                <div className="h-6 w-px bg-gray-100 dark:bg-gray-700 mx-1"></div>

                {/* User Profile Info */}
                <div
                    className="flex items-center gap-3 pl-1 sm:pl-2 cursor-pointer group"
                    onClick={() => navigate('/profile')}
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 transition-colors">{user?.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user?.role}</p>
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-100 dark:shadow-none transition-transform group-hover:scale-105">
                        <User size={18} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
