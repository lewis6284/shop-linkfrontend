import api from './api';

export const productService = {
    getAll: async (params) => {
        const response = await api.get('/products', { params });
        return response.data.data || response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/products/${id}`);
        return response.data.data || response.data;
    },
    create: async (data) => {
        const response = await api.post('/products', data);
        return response.data.data || response.data;
    },
    update: async (id, data) => {
        const response = await api.patch(`/products/${id}`, data);
        return response.data.data || response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/products/${id}`);
        return response.data.data || response.data;
    }
};

export const categoryService = {
    getAll: async () => {
        const response = await api.get('/categories');
        return response.data.data || response.data;
    },
    create: async (data) => {
        const response = await api.post('/categories', data);
        return response.data.data || response.data;
    },
    update: async (id, data) => {
        const response = await api.patch(`/categories/${id}`, data);
        return response.data.data || response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/categories/${id}`);
        return response.data.data || response.data;
    }
};

export const brandService = {
    getAll: async () => {
        const response = await api.get('/brands');
        return response.data.data || response.data;
    },
    create: async (data) => {
        const response = await api.post('/brands', data);
        return response.data.data || response.data;
    },
    update: async (id, data) => {
        const response = await api.patch(`/brands/${id}`, data);
        return response.data.data || response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/brands/${id}`);
        return response.data.data || response.data;
    }
};

export const unitService = {
    getAll: async () => {
        const response = await api.get('/units');
        return response.data.data || response.data;
    },
    create: async (data) => {
        const response = await api.post('/units', data);
        return response.data.data || response.data;
    },
    update: async (id, data) => {
        const response = await api.patch(`/units/${id}`, data);
        return response.data.data || response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/units/${id}`);
        return response.data.data || response.data;
    }
};
