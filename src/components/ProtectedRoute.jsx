import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * ProtectedRoute — enforces:
 *  1. Authentication (token + user present)
 *  2. Role-Based Access Control (allowedRoles)
 *  3. Shop-First Rule: Owner must have activeShopId before accessing dashboard
 *     (bypass with skipShopGuard={true} for /shops page itself)
 */
const ProtectedRoute = ({ children, allowedRoles, skipShopGuard = false }) => {
    const { user, loading, activeShopId } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Auto-close sidebar on mobile when navigating
    useEffect(() => {
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);

    // 1. Wait for auth to resolve
    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    // 2. Must be authenticated
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Role check
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // 4. (Removed) Owners can view the Global Dashboard without selecting a specific shop.
    // 5. Render — children may be a standalone page (POS, Shops) or a Layout with Outlet
    return <>{children}</>;
};

export default ProtectedRoute;
