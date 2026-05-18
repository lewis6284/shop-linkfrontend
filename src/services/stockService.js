import api from './api';

export const stockService = {
    getAll: async (params) => {
        const response = await api.get('/stock', { params });
        return response.data;
    },
    addStock: async (data) => {
        const response = await api.post('/stock/add', data);
        return response.data;
    },
    adjustStock: async (data) => {
        const response = await api.patch('/stock/adjust', data);
        return response.data;
    },
    getTransfers: async (params) => {
        const response = await api.get('/stock/transfers', { params });
        return response.data;
    },
    createTransfer: async (data) => {
        const response = await api.post('/stock/transfers', data);
        return response.data;
    },
    approveTransfer: async (id) => {
        const response = await api.patch(`/stock/transfers/${id}/approve`);
        return response.data;
    }
};
