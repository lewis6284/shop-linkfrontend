import api from './api';

export const creditService = {
    getAll: async (params) => {
        const response = await api.get('/credits', { params });
        return response.data.data || response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/credits/${id}`);
        return response.data.data || response.data;
    },
    create: async (data) => {
        const response = await api.post('/credits', data);
        return response.data.data || response.data;
    },
    pay: async (id, amount, method) => {
        const response = await api.post(`/credits/${id}/pay`, { amount, method });
        return response.data.data || response.data;
    }
};
