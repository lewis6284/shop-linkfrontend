import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // Adjust base URL as needed
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token and active shop id
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        const activeShopId = localStorage.getItem('activeShopId');

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        if (activeShopId) {
            config.headers['X-Shop-Id'] = activeShopId;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('activeShopId');
            localStorage.removeItem('activeShopData');
            
            // Redirect to login only if we are not already on it
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
