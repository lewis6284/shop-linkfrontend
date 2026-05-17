import api from './api';

export const stockService = {
    getShopStock: async (shopId, params) => {
        const response = await api.get(`/stock/shop/${shopId}`, { params });
        return response.data;
    },
    getGlobalStock: async (params) => {
        const response = await api.get('/stock/global', { params });
        return response.data;
    },
    updateStock: async (data) => {
        const response = await api.post('/stock/update', data);
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
