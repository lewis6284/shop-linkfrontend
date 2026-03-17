import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getAccounts } from '../services/accountService';
import { getExpenseCategories, getCandidatePaymentTypes, getRevenueTypes, getSuppliers } from '../services/basicDataService';
import { getAgencies } from '../services/agencyService';
import { getBanks } from '../services/bankService';
import { getEmployees } from '../services/employeeService';
import toast from 'react-hot-toast';

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
    const [accounts, setAccounts] = useState([]);
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [candidatePaymentTypes, setCandidatePaymentTypes] = useState([]);
    const [revenueTypes, setRevenueTypes] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);

    const { user } = useAuth();

    const refreshGlobalData = async () => {
        try {
            setLoading(true);
            const [accRes, expRes, candRes, revRes, supRes, empRes, agencyRes, bankRes] = await Promise.all([
                getAccounts(),
                getExpenseCategories(),
                getCandidatePaymentTypes(),
                getRevenueTypes(),
                getSuppliers(),
                getEmployees(),
                getAgencies(),
                getBanks()
            ]);

            setAccounts(accRes);
            setExpenseCategories(expRes);
            setCandidatePaymentTypes(candRes);
            setRevenueTypes(revRes);
            setSuppliers(supRes);
            setEmployees(empRes);
            setAgencies(agencyRes);
            setBanks(bankRes);
        } catch (error) {
            console.error("Failed to load global data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Load data when user is authenticated
        if (user) {
            refreshGlobalData();
        }
    }, [user]);

    return (
        <GlobalContext.Provider value={{
            accounts,
            expenseCategories,
            candidatePaymentTypes,
            revenueTypes,
            suppliers,
            employees,
            agencies,
            banks,
            loading,
            refreshGlobalData
        }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobal = () => useContext(GlobalContext);
