import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Users, UserCheck, Wallet,
    ArrowDownCircle, ArrowUpCircle, BookOpen,
    FileText, Settings, LogOut, Landmark, UserPlus,
    Truck, Tag, Receipt, TrendingUp, BarChart, Briefcase, Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, toggle }) => {
    const { user, logout } = useAuth();

    const sections = [
        {
            title: 'Main',
            items: [
                { path: '/dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'accountant'] },
            ]
        },
        {
            title: 'Operations',
            items: [
                { path: '/candidates', name: 'Candidates', icon: <Users size={20} />, roles: ['admin', 'accountant'] },
                { path: '/employees', name: 'Employees', icon: <UserCheck size={20} />, roles: ['admin'] },
                { path: '/suppliers', name: 'Suppliers', icon: <Truck size={20} />, roles: ['admin', 'accountant'] },
            ]
        },
        {
            title: 'Finance',
            items: [
                //{ path: '/payments', name: 'Candidate Payments', icon: <Wallet size={20} />, roles: ['admin', 'accountant'] },
                //{ path: '/salary-payments', name: 'Salary Payments', icon: <Briefcase size={20} />, roles: ['admin', 'accountant'] },
                { path: '/revenues', name: 'Revenues', icon: <ArrowUpCircle size={20} />, roles: ['admin', 'accountant'] },
                { path: '/expenses', name: 'Expenses', icon: <ArrowDownCircle size={20} />, roles: ['admin', 'accountant'] },
                { path: '/accounts', name: 'Accounts', icon: <Landmark size={20} />, roles: ['admin', 'accountant'] },
                { path: '/journal', name: 'Journal', icon: <BookOpen size={20} />, roles: ['admin', 'accountant'] },
                { path: '/receipts', name: 'Receipts', icon: <FileText size={20} />, roles: ['admin', 'accountant'] },
                { path: '/reports', name: 'Reports', icon: <TrendingUp size={20} />, roles: ['admin', 'accountant'] },
            ]
        }

    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={toggle}
                ></div>
            )}

            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'}
            `}>
                <div className="h-16 flex items-center px-6 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-100">
                            F
                        </div>
                        {isOpen && (
                            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">FinApp</h1>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
                    {sections.map((section, idx) => {
                        const userRole = user?.role?.toLowerCase();
                        const visibleItems = section.items.filter(item => item.roles.includes(userRole));
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={idx} className="space-y-2">
                                {isOpen && (
                                    <h2 className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-[2px] mb-3">
                                        {section.title}
                                    </h2>
                                )}
                                <div className="space-y-1">
                                    {visibleItems.map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) => `
                                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                                                ${isActive
                                                    ? 'bg-brand-50 text-brand-600 shadow-sm'
                                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                                            `}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <span className={`transition-transform group-hover:scale-110 ${isOpen ? '' : 'mx-auto'}`}>
                                                        {item.icon}
                                                    </span>
                                                    {isOpen && (
                                                        <span className="font-bold text-sm tracking-tight animate-in fade-in slide-in-from-left-2 duration-300 whitespace-nowrap">
                                                            {item.name}
                                                        </span>
                                                    )}
                                                    {/* Active Indicator Line */}
                                                    <div className={`
                                                        absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-600 rounded-r-full transition-opacity
                                                        ${isActive ? 'opacity-100' : 'opacity-0'}
                                                    `}>
                                                    </div>
                                                </>
                                            )}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
