import api from './api';

export const getJournals = async () => {
    const response = await api.get('/journals');
    return response.data;
};
