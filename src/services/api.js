import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Adjust if backend port changes
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the token and log data
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Debugging: Log all outgoing requests
        console.log(`🚀 [API Request] ${config.method.toUpperCase()} ${config.url}`, config.data || 'No data');

        return config;
    },
    (error) => {
        console.error('❌ [API Request Error]', error);
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('❌ [API Response] 401 Unauthorized - Clearing session and redirecting...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Force redirect to login page if we're not already there
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
