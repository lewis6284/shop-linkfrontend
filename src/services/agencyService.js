import api from './api';

export const getAgencies = async () => {
    const { data } = await api.get('/agencies');
    return data;
};

export const createAgency = async (agencyData) => {
    const { data } = await api.post('/agencies', agencyData);
    return data;
};

export const updateAgency = async (id, agencyData) => {
    const { data } = await api.put(`/agencies/${id}`, agencyData);
    return data;
};

export const deleteAgency = async (id) => {
    const { data } = await api.delete(`/agencies/${id}`);
    return data;
};
