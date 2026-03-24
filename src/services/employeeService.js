import api from './api';

export const getEmployees = async () => {
    const response = await api.get('/employees');
    return response.data;
};

export const createEmployee = async (data) => {
    const response = await api.post('/employees', data);
    return response.data;
};



export const getEmployeeById = async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
};

export const updateEmployee = async (id, data) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
};

export const deleteEmployee = async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
};

export const softDeleteEmployee = async (id) => {
    const response = await api.put(`/employees/${id}`, { status: 'INACTIVE' });
    return response.data;
};

// Salary Management
export const getSalarySummary = async (employee_id, month) => {
    const response = await api.get(`/salary/summary/${employee_id}/${encodeURIComponent(month)}`);
    return response.data;
};

export const createSalaryAdvance = async (data) => {
    const response = await api.post('/salary/advance', data);
    return response.data;
};
