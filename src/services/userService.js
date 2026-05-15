import api from './api';

const userService = {
    getUsers: async (params) => {
        const response = await api.get('/users', { params });
        return response.data;
    },
    
    createUser: async (userData) => {
        const response = await api.post('/users', userData);
        return response.data;
    },
    
    updateUser: async (id, userData) => {
        const response = await api.put(`/users/${id}`, userData);
        return response.data;
    },
    
    disableUser: async (id) => {
        const response = await api.put(`/users/${id}`, { is_active: false });
        return response.data;
    },
    
    getShops: async () => {
        const response = await api.get('/shops');
        return response.data;
    }
};

export default userService;
