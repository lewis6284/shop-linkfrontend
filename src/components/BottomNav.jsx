import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    CreditCard,
    User,
    BarChart2,
    ArrowLeftRight,
    Wallet,
    FileText,
    Store,
    Users,
    Settings
} from 'lucide-react';

const BottomNav = () => {
    const { user } = useAuth();
    
    // Safety check: hide nav if no user (e.g., Login page)
    if (!user) return null;

    const role = user?.role?.toLowerCase() || 'cashier';

    // STRICT Role-based navigation maps
    // Intelligence: items are filtered to only show what's absolutely necessary for each role
    const navItems = {
        owner: [
            { path: '/dashboard/admin', name: 'Global', icon: LayoutDashboard },
            { path: '/pos', name: 'POS', icon: ShoppingCart },
            { path: '/shops', name: 'Shops', icon: Store },
            { path: '/reports', name: 'Finance', icon: BarChart2 },
            { path: '/users', name: 'Staff', icon: Users },
        ],
        manager: [
            { path: '/dashboard/shop', name: 'Dashboard', icon: LayoutDashboard },
            { path: '/pos', name: 'POS', icon: ShoppingCart },
            { path: '/products', name: 'Stock', icon: Package },
            { path: '/reports', name: 'Reports', icon: FileText },
            { path: '/users', name: 'Staff', icon: Users },
        ],
        cashier: [
            { path: '/dashboard', name: 'Home', icon: LayoutDashboard },
            { path: '/pos', name: 'POS', icon: ShoppingCart },
            { path: '/sales', name: 'Sales', icon: CreditCard },
            { path: '/customers', name: 'Clients', icon: Users },
            { path: '/profile', name: 'Me', icon: User },
        ]
    };

    const items = navItems[role] || navItems.cashier;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[60] bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 pb-safe md:hidden shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.1)] transition-all duration-300">
            <div className="flex items-center justify-around px-2 h-16">
                {items.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 relative
                            ${isActive 
                                ? 'text-brand-600 dark:text-brand-400' 
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                {/* Premium Active Indicator Dot */}
                                {isActive && (
                                    <span className="absolute -top-1 w-1.5 h-1.5 bg-brand-600 dark:bg-brand-400 rounded-full animate-in fade-in zoom-in duration-300" />
                                )}

                                <div className={`
                                    p-1.5 rounded-xl transition-all duration-300 ease-out
                                    ${isActive 
                                        ? 'bg-brand-50 dark:bg-brand-900/40 -translate-y-1.5 scale-110 shadow-lg shadow-brand-500/10' 
                                        : 'hover:bg-gray-50 dark:hover:bg-white/5'}
                                `}>
                                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className={`
                                    text-[9px] uppercase tracking-wider font-black transition-all duration-300
                                    ${isActive ? 'opacity-100 scale-105' : 'opacity-60 font-bold'}
                                `}>
                                    {item.name}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
