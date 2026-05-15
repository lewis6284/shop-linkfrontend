import api from './api';

export const financialService = {
    getGlobalStats: async () => {
        const response = await api.get('/financials/global');
        return response.data.data || response.data;
    },
    getShopStats: async (shopId) => {
        const response = await api.get(`/financials/shop/${shopId}`);
        return response.data.data || response.data;
    },
    getDailyStats: async () => {
        const response = await api.get('/financials/daily');
        return response.data.data || response.data;
    }
};
