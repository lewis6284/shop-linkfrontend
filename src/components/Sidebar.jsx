import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Users, Store, Wallet,
    ShoppingCart, Package, BarChart2,
    ArrowLeftRight, CreditCard, FileText, Truck,
    PanelLeftClose, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUrl';

const Sidebar = ({ isOpen, toggle }) => {
    const { user, logout, shop } = useAuth();

    const dashboardPath =
        user?.role === 'owner' ? '/dashboard/admin' :
            user?.role === 'manager' ? '/dashboard/shop' :
                '/pos';

    // Fallback logo: first letter of shop name or 'S'
    const shopInitial = shop?.name?.charAt(0).toUpperCase() || 'S';

    const sections = [
        {
            title: 'Main',
            items: [
                { path: dashboardPath, name: 'Home', icon: <LayoutDashboard size={20} />, roles: ['owner', 'manager'] },
                { path: '/pos', name: 'POS', icon: <ShoppingCart size={20} />, roles: ['owner', 'manager', 'cashier'] },
                { path: '/shops', name: 'Shops', icon: <Store size={20} />, roles: ['owner'] },
                { path: '/users', name: 'Staff', icon: <Users size={20} />, roles: ['owner', 'manager'] },
                { path: '/audit-logs', name: 'Security', icon: <Activity size={20} />, roles: ['owner'] },
            ]
        },
        {
            title: 'Inventory',
            items: [
                { path: '/products', name: 'Products', icon: <Package size={20} />, roles: ['owner', 'manager'] },
                { path: '/stock', name: 'Stock', icon: <BarChart2 size={20} />, roles: ['owner', 'manager','cashier'] },
            ]
        },
        {
            title: 'Finances',
            items: [
                { path: '/sales', name: 'Sales', icon: <CreditCard size={20} />, roles: ['owner', 'manager', 'cashier'] },
                { path: '/reports', name: 'Reports', icon: <FileText size={20} />, roles: ['owner', 'manager'] },
            ]
        },
        {
            title: 'Contacts',
            items: [
                // { path: '/customers', name: 'Customers', icon: <Users size={20} />, roles: ['owner', 'manager', 'cashier'] },
                { path: '/suppliers', name: 'Suppliers', icon: <Truck size={20} />, roles: ['owner', 'manager'] },
            ]
        }
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-40 md:hidden animate-in fade-in duration-300"
                    onClick={toggle}
                ></div>
            )}

            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out overflow-hidden
                ${isOpen ? 'translate-x-0 w-72 border-r' : '-translate-x-full md:translate-x-0 w-0 border-r-0'}
            `}>
                {/* Inner container with fixed width to prevent text wrapping during transition */}
                <div className="w-72 h-full flex flex-col overflow-hidden shrink-0">
                    <div className="h-24 flex items-center justify-between px-6 border-b border-gray-50 dark:border-gray-800/50 shrink-0 bg-gray-50/30 dark:bg-gray-900/50">
                        <div className="flex items-center gap-3 overflow-hidden">
                            {/* Logo Image */}
                            <div className="w-12 h-12 flex-shrink-0 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 overflow-hidden group border border-gray-100 dark:border-gray-800">
                                <img 
                                    src={getImageUrl(shop?.logo_url)} 
                                    alt={shop?.name || 'ShopLink'} 
                                    className="w-full h-full object-contain p-1.5 transition-transform group-hover:scale-110" 
                                />
                            </div>
                            
                            <div className="animate-in fade-in slide-in-from-left-2 duration-500 min-w-0">
                                <h1 className="text-sm font-black text-gray-900 dark:text-white truncate tracking-tight">
                                    {shop?.name || 'ShopLink'}
                                </h1>
                                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
                                    {shop?.type === 'WAREHOUSE' ? 'Warehouse Hub' : 'Retail Store'}
                                </p>
                            </div>
                        </div>
                        {isOpen && (
                            <button
                                onClick={toggle}
                                className="p-2 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all shadow-sm md:block hidden"
                                title="Close Sidebar"
                            >
                                <PanelLeftClose size={20} />
                            </button>
                        )}
                    </div>

                    <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
                        {sections.map((section, idx) => {
                            const userRole = user?.role?.toLowerCase();
                            const visibleItems = section.items.filter(item => item.roles.includes(userRole));
                            if (visibleItems.length === 0) return null;

                            return (
                                <div key={idx} className="space-y-2">
                                    <h2 className="px-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[2px] mb-3">
                                        {section.title}
                                    </h2>
                                    <div className="space-y-1">
                                        {visibleItems.map((item) => (
                                            <NavLink
                                                key={item.path}
                                                to={item.path}
                                                className={({ isActive }) => `
                                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                                                ${isActive
                                                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shadow-sm'
                                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'}
                                            `}
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        <span className={`transition-transform group-hover:scale-110`}>
                                                            {item.icon}
                                                        </span>
                                                        <span className="font-bold text-sm tracking-tight whitespace-nowrap">
                                                            {item.name}
                                                        </span>
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

                    {/* Optional: Add a simple help/support or footer if needed */}
                    <div className="p-4 mt-auto border-t border-gray-50 dark:border-gray-800/50 shrink-0">
                        <div className="p-4 bg-brand-50 dark:bg-brand-900/10 rounded-2xl">
                            <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1">System Version</p>
                            <p className="text-xs text-gray-500 font-medium">v1.2.0 - stable</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
