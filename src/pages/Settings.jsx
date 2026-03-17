import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Tag, Receipt, BarChart, Building2, Landmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { user } = useAuth();

    const settingsItems = [
        { path: '/register', name: 'Add Staff', description: 'Manage employee accounts', icon: <UserPlus className="w-8 h-8 text-brand-600 mb-4 group-hover:scale-110 transition-transform" />, roles: ['admin'] },
        { path: '/expense-categories', name: 'Expense Categories', description: 'Manage expense categories', icon: <Tag className="w-8 h-8 text-brand-600 mb-4 group-hover:scale-110 transition-transform" />, roles: ['admin'] },
        { path: '/candidate-payment-types', name: 'Payment Types', description: 'Set candidate payment types', icon: <Receipt className="w-8 h-8 text-brand-600 mb-4 group-hover:scale-110 transition-transform" />, roles: ['admin'] },
        { path: '/revenue-types', name: 'Revenue Types', description: 'Manage revenue streams', icon: <BarChart className="w-8 h-8 text-brand-600 mb-4 group-hover:scale-110 transition-transform" />, roles: ['admin'] },
        { path: '/agencies', name: 'Agencies', description: 'Manage partner agencies', icon: <Building2 className="w-8 h-8 text-brand-600 mb-4 group-hover:scale-110 transition-transform" />, roles: ['admin'] },
        { path: '/banks', name: 'Banks', description: 'Manage system bank accounts', icon: <Landmark className="w-8 h-8 text-brand-600 mb-4 group-hover:scale-110 transition-transform" />, roles: ['admin'] },
    ];

    const currentRole = user?.role?.toLowerCase() || '';

    // Filter items based on user role
    const visibleItems = settingsItems.filter(item => item.roles.includes(currentRole));

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 border-b pb-4">Settings</h1>
                <p className="text-gray-500 mt-2">Manage system configurations and administrative options</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleItems.map((item, index) => (
                    <Link
                        key={index}
                        to={item.path}
                        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-200 group flex flex-col items-start"
                    >
                        <div className="bg-brand-50 p-3 rounded-xl mb-4 text-brand-600 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                            {React.cloneElement(item.icon, { className: 'w-6 h-6' })}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.description}</p>
                    </Link>
                ))}
                
                {visibleItems.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
                        You do not have permission to view any settings.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
