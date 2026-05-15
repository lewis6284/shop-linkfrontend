import api from './api';

export const expenseService = {
    getAll: async (params) => {
        const response = await api.get('/expenses', { params });
        return response.data;
    },
    getTypes: async () => {
        const response = await api.get('/expenses/types');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/expenses', data);
        return response.data;
    },
    createType: async (data) => {
        const response = await api.post('/expenses/types', data);
        return response.data;
    }
};
