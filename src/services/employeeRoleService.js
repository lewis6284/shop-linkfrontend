import api from './api';

export const getEmployeeRoles = async () => {
    const response = await api.get('/employee-roles');
    return response.data;
};

export const createEmployeeRole = async (roleData) => {
    const response = await api.post('/employee-roles', roleData);
    return response.data;
};

export const updateEmployeeRole = async (id, roleData) => {
    const response = await api.put(`/employee-roles/${id}`, roleData);
    return response.data;
};

export const deleteEmployeeRole = async (id) => {
    const response = await api.delete(`/employee-roles/${id}`);
    return response.data;
};
