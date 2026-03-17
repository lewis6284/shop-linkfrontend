import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
// We cannot use useGlobal inside AuthProvider because AuthProvider wraps GlobalProvider usually? 
// Wait, usually GlobalProvider wraps AuthProvider or vice versa. 
// Let's assume GlobalProvider is INSIDE AuthProvider in App.jsx (App.jsx: Auth -> Global -> Router)
// So we cannot use GlobalContext here easily without circular dependency if we move refreshGlobalData here.
// Instead, we will trigger refreshGlobalData in the Login Page or Dashboard.
// I will keep AuthContext simple for now.

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/users/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            return data.user;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const register = async (name, email, password, role) => {
        try {
            await api.post('/users/register', { name, email, password, role });
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
