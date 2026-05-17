import api from './api';

export const supplierService = {
    getAll: async () => {
        const response = await api.get('/suppliers');
        return response.data.data || response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/suppliers/${id}`);
        return response.data.data || response.data;
    },
    create: async (data) => {
        const response = await api.post('/suppliers', data);
        return response.data.data || response.data;
    },
    update: async (id, data) => {
        const response = await api.patch(`/suppliers/${id}`, data);
        return response.data.data || response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/suppliers/${id}`);
        return response.data.data || response.data;
    }
};
