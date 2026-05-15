import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [activeShopId, setActiveShopId] = useState(localStorage.getItem('activeShopId'));
    const [shop, setShop] = useState(() => {
        const savedShop = localStorage.getItem('activeShopData');
        return savedShop ? JSON.parse(savedShop) : null;
    });
    const [loading, setLoading] = useState(true);

    const fetchShopDetails = async (shopId) => {
        if (!shopId) return;
        try {
            const response = await api.get(`/shops/${shopId}`);
            const shopData = response.data.data || response.data;
            setShop(shopData);
            localStorage.setItem('activeShopData', JSON.stringify(shopData));
        } catch (error) {
            console.error("Failed to fetch shop details:", error);
        }
    };

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                if (activeShopId) {
                    api.defaults.headers.common['X-Shop-Id'] = activeShopId;
                    // Fetch shop details if not already loaded or mismatch
                    if (!shop || shop.id !== activeShopId) {
                        fetchShopDetails(activeShopId);
                    }
                }

                const response = await api.get('/auth/me');
                setUser(response.data.data);
            } catch (error) {
                console.error("Token verification failed:", error);
                logout();
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token, activeShopId]);

    const login = (userData, jwtToken) => {
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('token', jwtToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;

        if (userData.ShopId) {
            setShopContext(userData.ShopId);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setActiveShopId(null);
        setShop(null);
        localStorage.removeItem('token');
        localStorage.removeItem('activeShopId');
        localStorage.removeItem('activeShopData');
        delete api.defaults.headers.common['Authorization'];
        delete api.defaults.headers.common['X-Shop-Id'];
    };

    const setShopContext = (shopId) => {
        setActiveShopId(shopId);
        localStorage.setItem('activeShopId', shopId);
        api.defaults.headers.common['X-Shop-Id'] = shopId;
        fetchShopDetails(shopId);
    };

    const value = {
        user,
        token,
        activeShopId,
        shop,
        loading,
        login,
        logout,
        setShopContext,
        isAuthenticated: !!token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
