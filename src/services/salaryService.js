import api from './api';

export const getSalarySummary = async (employeeId, month) => {
    const response = await api.get(`/salary/summary/${employeeId}/${month}`);
    return response.data;
};

export const createAdvance = async (data) => {
    const response = await api.post('/salary/advance', data);
    return response.data;
};

export const recordLoanRepayment = async (data) => {
    const response = await api.post('/salary/repayment', data);
    return response.data;
};
