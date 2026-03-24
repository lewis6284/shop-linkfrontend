import api from './api';

export const getSalarySummary = async (employee_id, month) => {
    const response = await api.get(`/salary/summary/${employee_id}/${month}`);
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
