import api from './api';

export const customerService = {
    getAll: async (params) => {
        const response = await api.get('/customers', { params });
        return response.data.data || response.data;
    },
    create: async (data) => {
        const response = await api.post('/customers', data);
        return response.data.data || response.data;
    },
    update: async (id, data) => {
        const response = await api.patch(`/customers/${id}`, data);
        return response.data.data || response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/customers/${id}`);
        return response.data.data || response.data;
    }
};
