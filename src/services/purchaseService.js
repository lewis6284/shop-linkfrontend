import api from './api';

export const purchaseService = {
    getAll: async (params) => {
        const response = await api.get('/purchases', { params });
        return response.data.data || response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/purchases/${id}`);
        return response.data.data || response.data;
    },
    create: async (data) => {
        const response = await api.post('/purchases', data);
        return response.data.data || response.data;
    }
};
