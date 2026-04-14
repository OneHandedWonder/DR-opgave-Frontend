import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5249/api/v2',
});

export const getRecords = async (filters = {}) => {
  try {
    void filters;

    const response = await api.get("/records");
    return response.data;
  } catch (error) {
    console.error("Error fetching records:", error);
    throw error;
  }
};

export const getRecordById = async (id) => {
  try {
    const response = await api.get(`/records/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching record with id ${id}:`, error);
    throw error;
  }
};
export const createRecord = async (recordData) => {
  try {
    const response = await api.post("/records", recordData);
    return response.data;
  }
    catch (error) {
    console.error("Error creating record:", error);
    throw error;
  }
};

export const updateRecord = async (id, recordData) => {
  try {
    const response = await api.put(`/records/${id}`, recordData);
    return response.data;
  } catch (error) {
    console.error(`Error updating record with id ${id}:`, error);
    throw error;
  }
};
export const deleteRecord = async (id) => {
  try {
    const response = await api.delete(`/records/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting record with id ${id}:`, error);
    throw error;
  }
};

export default api;