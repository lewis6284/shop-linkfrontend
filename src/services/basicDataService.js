import api from './api';

export const getExpenseCategories = async () => {
    const response = await api.get('/data/expense-categories');
    return response.data;
};

export const getCandidatePaymentTypes = async () => {
    const response = await api.get('/data/candidate-payment-types');
    return response.data;
};

export const getRevenueTypes = async () => {
    const response = await api.get('/data/revenue-types');
    return response.data;
};

export const getSuppliers = async () => {
    const response = await api.get('/suppliers');
    return response.data;
};

// Create Methods
export const createExpenseCategory = async (data) => {
    const response = await api.post('/data/expense-categories', data);
    return response.data;
};

export const createCandidatePaymentType = async (data) => {
    const response = await api.post('/data/candidate-payment-types', data);
    return response.data;
};

export const createRevenueType = async (data) => {
    const response = await api.post('/data/revenue-types', data);
    return response.data;
};

// Delete Methods
export const deleteExpenseCategory = async (id) => {
    const response = await api.delete(`/data/expense-categories/${id}`);
    return response.data;
};

export const deleteCandidatePaymentType = async (id) => {
    const response = await api.delete(`/data/candidate-payment-types/${id}`);
    return response.data;
};

export const deleteRevenueType = async (id) => {
    const response = await api.delete(`/data/revenue-types/${id}`);
    return response.data;
};

export const createSupplier = async (data) => {
    const response = await api.post('/suppliers', data);
    return response.data;
};

export const updateSupplier = async (id, data) => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
};

export const deleteSupplier = async (id) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
};
