import api from './api';

export const createManualRevenue = async (data) => {
    const response = await api.post('/revenues/manual', data);
    return response.data;
};

export const getManualRevenues = async () => {
    const response = await api.get('/revenues/manual');
    return response.data;
};

export const getAutomaticRevenues = async () => {
    const response = await api.get('/revenues/automatic');
    return response.data;
};

export const deleteManualRevenue = async (id) => {
    const response = await api.delete(`/revenues/manual/${id}`);
    return response.data;
};
