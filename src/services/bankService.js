import api from './api';

export const getBanks = async () => {
    const response = await api.get('/banks');
    return response.data;
};

export const createBank = async (data) => {
    const response = await api.post('/banks', data);
    return response.data;
};

export const updateBank = async (id, data) => {
    const response = await api.put(`/banks/${id}`, data);
    return response.data;
};

export const deleteBank = async (id) => {
    const response = await api.delete(`/banks/${id}`);
    return response.data;
};
