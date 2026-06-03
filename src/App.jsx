import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Shops from './pages/Shops';
import POS from './pages/POS';
import AuditLogs from './pages/AuditLogs';
import Users from './pages/Users';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Report from './pages/Report';
import Unauthorized from './pages/Unauthorized';
import ForcePasswordChangeModal from './components/ForcePasswordChangeModal';

const App = () => {
    return (
        <AuthProvider>
            <Router basename='shoplink'>
                <Toaster position="top-right" />
                <ForcePasswordChangeModal />
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* Shops Management — now inside Layout */}
                    <Route
                        path="/shops"
                        element={
                            <ProtectedRoute allowedRoles={['owner']} skipShopGuard>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Shops />} />
                    </Route>

                    {/* POS — now inside Layout */}
                    <Route
                        path="/pos"
                        element={
                            <ProtectedRoute allowedRoles={['cashier', 'manager', 'owner']}>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<POS />} />
                    </Route>

                    {/* Admin Dashboard (Owner) — nested inside Layout */}
                    <Route
                        path="/dashboard/admin"
                        element={
                            <ProtectedRoute allowedRoles={['owner']}>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Dashboard />} />
                        <Route path="report" element={<Report />} />
                    </Route>

                    {/* Shop Dashboard (Manager) — nested inside Layout */}
                    <Route
                        path="/dashboard/shop"
                        element={
                            <ProtectedRoute allowedRoles={['manager']}>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Dashboard />} />
                        <Route path="report" element={<Report />} />
                    </Route>

                    <Route
                        path="/users"
                        element={
                            <ProtectedRoute allowedRoles={['owner', 'manager']}>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Users />} />
                    </Route>

                    <Route
                        path="/products"
                        element={
                            <ProtectedRoute allowedRoles={['owner', 'manager']}>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Products />} />
                    </Route>

                    <Route
                        path="/stock"
                        element={
                            <ProtectedRoute allowedRoles={['owner', 'manager','cashier']}>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Stock />} />
                    </Route>

                    <Route
                        path="/sales"
                        element={
                            <ProtectedRoute allowedRoles={['owner', 'manager', 'cashier']}>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Sales />} />
                    </Route>

                    <Route
                        path="/customers"
                        element={
                            <ProtectedRoute allowedRoles={['owner', 'manager', 'cashier']}>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Customers />} />
                    </Route>

                    {/* Generic /dashboard — redirects to correct role route */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Dashboard />} />
                    </Route>

                    <Route
                        path="/audit-logs"
                        element={
                            <ProtectedRoute allowedRoles={['owner']}>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<AuditLogs />} />
                    </Route>

                    <Route
                        path="/reports"
                        element={
                            <ProtectedRoute allowedRoles={['owner', 'manager']}>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Report />} />
                    </Route>

                    <Route
                        path="/suppliers"
                        element={
                            <ProtectedRoute allowedRoles={['owner', 'manager']}>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Suppliers />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
