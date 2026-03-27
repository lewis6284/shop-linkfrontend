import api from './api';

export const getCandidates = async () => {
    const response = await api.get('/candidates');
    return response.data;
};

export const createCandidate = async (data) => {
    const response = await api.post('/candidates', data);
    return response.data;
};

export const updateCandidate = async (id, data) => {
    const response = await api.put(`/candidates/${id}`, data);
    return response.data;
};

export const deleteCandidate = async (id) => {
    const response = await api.delete(`/candidates/${id}`);
    return response.data;
};

export const createCandidatePayment = async (data) => {
    const response = await api.post('/payments/candidate', data);
    return response.data;
};

export const updateCandidatePayment = async (id, data) => {
    const response = await api.put(`/payments/candidate/${id}`, data);
    return response.data;
};

export const cancelCandidatePayment = async (id) => {
    const response = await api.patch(`/payments/candidate/${id}/cancel`);
    return response.data;
};

export const getCandidateById = async (id) => {
    const response = await api.get(`/candidates/${id}`);
    return response.data;
};

export const getPaymentSummary = async (id) => {
    const response = await api.get(`/candidates/${id}/payment-summary`);
    return response.data;
};
