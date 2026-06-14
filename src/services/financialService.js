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
    },
    getMonthlyReport: async (year, month) => {
        const response = await api.get('/reports/monthly', { params: { year, month } });
        return response.data.data || response.data;
    },
    getTopProductsReport: async (limit = 10, startDate, endDate) => {
        const response = await api.get('/reports/top-products', { params: { limit, start_date: startDate, end_date: endDate } });
        return response.data.data || response.data;
    },
    getProfitReport: async (startDate, endDate) => {
        const response = await api.get('/reports/profit', { params: { start_date: startDate, end_date: endDate } });
        return response.data.data || response.data;
    },
    getEmployeeSalesReport: async (startDate, endDate) => {
        const response = await api.get('/reports/employee-sales', { params: { start_date: startDate, end_date: endDate } });
        return response.data.data || response.data;
    },
    getAuditLogsReport: async (shopId = null, startDate = null, endDate = null) => {
        const response = await api.get('/reports/audit-logs', { params: { shop_id: shopId, start_date: startDate, end_date: endDate } });
        return response.data.data || response.data;
    },
    getInventoryReport: async (startDate, endDate) => {
        const response = await api.get('/reports/inventory', { params: { start_date: startDate, end_date: endDate } });
        return response.data.data || response.data;
    }
};
