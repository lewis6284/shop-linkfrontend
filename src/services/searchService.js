import api from './api';

export const globalSearch = async (query) => {
    const response = await api.get(`/search?q=${query}`);
    return response.data;
};
