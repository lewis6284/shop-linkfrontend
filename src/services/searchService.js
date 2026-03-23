import api from './api';

export const globalSearch = async (query) => {
    if (!query) return [];
    try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
        return data;
    } catch (error) {
        console.error("Global search failed:", error);
        throw error;
    }
};
