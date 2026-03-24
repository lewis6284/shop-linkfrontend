import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { GlobalProvider } from './context/GlobalContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';

import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import CandidateDetails from './pages/CandidateDetails';
import Employees from './pages/Employees';
import EmployeeDetails from './pages/EmployeeDetails';
import Accounts from './pages/Accounts';
import Payments from './pages/Payments'; // now restricted to Candidate Payments
import SalaryPayments from './pages/SalaryPayments';
import Revenues from './pages/Revenues';
import Expenses from './pages/Expenses';
import Journal from './pages/Journal';
import Receipts from './pages/Receipts';
import ExpenseCategories from './pages/ExpenseCategories';
import CandidatePaymentTypes from './pages/CandidatePaymentTypes';
import RevenueTypes from './pages/RevenueTypes';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Agencies from './pages/Agencies';
import Banks from './pages/Banks';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <GlobalProvider>
        <Router basename='/accounting-app'>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />


            {/* Protected Routes */}

            <Route path="/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/candidates" element={
              <ProtectedRoute>
                <Candidates />
              </ProtectedRoute>
            } />
            <Route path="/candidates/:id" element={
              <ProtectedRoute>
                <CandidateDetails />
              </ProtectedRoute>
            } />
            <Route path="/employees" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Employees />
              </ProtectedRoute>
            } />
            <Route path="/employees/:id" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <EmployeeDetails />
              </ProtectedRoute>
            } />
            <Route path="/payments" element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            } />
            <Route path="/salary-payments" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <SalaryPayments />
              </ProtectedRoute>
            } />
            <Route path="/accounts" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Accounts />
              </ProtectedRoute>
            } />
            <Route path="/revenues" element={
              <ProtectedRoute>
                <Revenues />
              </ProtectedRoute>
            } />
            <Route path="/expenses" element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            } />
            <Route path="/journal" element={
              <ProtectedRoute>
                <Journal />
              </ProtectedRoute>
            } />
            <Route path="/receipts" element={
              <ProtectedRoute>
                <Receipts />
              </ProtectedRoute>
            } />
            <Route path="/suppliers" element={
              <ProtectedRoute>
                <Suppliers />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/expense-categories" element={
              <ProtectedRoute>
                <ExpenseCategories />
              </ProtectedRoute>
            } />
            <Route path="/candidate-payment-types" element={
              <ProtectedRoute>
                <CandidatePaymentTypes />
              </ProtectedRoute>
            } />
            <Route path="/revenue-types" element={
              <ProtectedRoute>
                <RevenueTypes />
              </ProtectedRoute>
            } />
            <Route path="/agencies" element={
              <ProtectedRoute>
                <Agencies />
              </ProtectedRoute>
            } />
            <Route path="/banks" element={
              <ProtectedRoute>
                <Banks />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />

          </Routes>
        </Router>
        <Toaster position="top-right" />
      </GlobalProvider>
    </AuthProvider>
  );
}

export default App;
