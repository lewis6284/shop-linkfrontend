import api from './api';

export const getCandidatePayments = async () => {
    const response = await api.get('/payments/candidate');
    return response.data;
};

export const getSalaryPayments = async () => {
    const response = await api.get('/payments/salary');
    return response.data;
};

export const createSalaryPayment = async (data) => {
    const response = await api.post('/payments/salary', data);
    return response.data;
};
