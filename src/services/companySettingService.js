import api from './api';

const unwrap = (response) => response.data.data || response.data;

const toFormData = (payload) => {
    const formData = new FormData();
    ['company_name', 'nif', 'rc', 'phone'].forEach((field) => {
        formData.append(field, payload[field] || '');
    });
    if (payload.stampFile) {
        formData.append('stamp', payload.stampFile);
    }
    return formData;
};

const requestConfig = {
    headers: { 'Content-Type': 'multipart/form-data' }
};

const companySettingService = {
    async getAll() {
        const response = await api.get('/company-settings');
        return unwrap(response);
    },

    async create(payload) {
        const response = await api.post('/company-settings', toFormData(payload), requestConfig);
        return unwrap(response);
    },

    async update(id, payload) {
        const response = await api.patch(`/company-settings/${id}`, toFormData(payload), requestConfig);
        return unwrap(response);
    },

    async delete(id) {
        const response = await api.delete(`/company-settings/${id}`);
        return unwrap(response);
    }
};

export default companySettingService;
