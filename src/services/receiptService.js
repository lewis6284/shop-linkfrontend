import api from './api';

export const getReceipts = async () => {
    const response = await api.get('/receipts');
    return response.data;
};
