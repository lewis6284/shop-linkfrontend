import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, UserCheck, Wallet,
    CreditCard, Receipt, FileText, LogOut, Menu, X, Landmark
} from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Candidates', path: '/candidates', icon: Users },
        { name: 'Employees', path: '/employees', icon: UserCheck },
        { name: 'Accounts', path: '/accounts', icon: Landmark },
        { name: 'Payments', path: '/payments', icon: Wallet },
        { name: 'Revenues', path: '/revenues', icon: CreditCard },
        { name: 'Expenses', path: '/expenses', icon: FileText },
        { name: 'Journal', path: '/journal', icon: FileText }, // Reusing FileText or specialized book icon
        { name: 'Receipts', path: '/receipts', icon: Receipt },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-xl transition-all duration-300 ease-in-out flex flex-col z-20`}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h1 className={`font-bold text-xl text-brand-600 ${!isSidebarOpen && 'hidden'}`}>FinApp</h1>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-gray-100 rounded-md">
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-2 px-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`flex items-center p-3 rounded-lg transition-colors ${isActive
                                                ? 'bg-brand-50 text-brand-600'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-brand-600'
                                            }`}
                                    >
                                        <Icon size={20} />
                                        <span className={`ml-3 font-medium ${!isSidebarOpen && 'hidden'}`}>{item.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t">
                    <div className={`flex items-center mb-4 ${!isSidebarOpen && 'justify-center'}`}>
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                            {user?.name?.[0] || 'U'}
                        </div>
                        <div className={`ml-3 ${!isSidebarOpen && 'hidden'}`}>
                            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${!isSidebarOpen && 'justify-center'}`}
                    >
                        <LogOut size={20} />
                        <span className={`ml-3 font-medium ${!isSidebarOpen && 'hidden'}`}>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
