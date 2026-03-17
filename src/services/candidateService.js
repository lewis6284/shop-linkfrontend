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

export const getCandidateById = async (id) => {
    const response = await api.get(`/candidates/${id}`);
    return response.data;
};
