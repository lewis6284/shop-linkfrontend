import api from './api';

export const saleService = {
    getAll: async (params) => {
        const response = await api.get('/sales', { params });
        return response.data.data || response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/sales/${id}`);
        return response.data.data || response.data;
    },
    create: async (data) => {
        const response = await api.post('/sales', data);
        return response.data.data || response.data;
    },
    cancel: async (id, reason = 'Cashier Cancelled') => {
        const response = await api.post(`/sales/${id}/cancel`, { reason });
        return response.data.data || response.data;
    },
    getPendingApproval: async () => {
        const response = await api.get('/sales/pending-approval');
        return response.data.data || response.data;
    },
    approve: async (id) => {
        const response = await api.post(`/sales/${id}/approve`);
        return response.data.data || response.data;
    },
    reject: async (id, reason = 'Rejected by Owner') => {
        const response = await api.post(`/sales/${id}/reject`, { reason });
        return response.data.data || response.data;
    },
    getInvoices: async (params) => {
        const response = await api.get('/sales/invoices', { params });
        return response.data.data || response.data;
    }
};
