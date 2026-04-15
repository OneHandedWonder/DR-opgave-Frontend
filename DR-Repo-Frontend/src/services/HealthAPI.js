import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5249/api/v2';
const inferredBackendBase = apiBaseUrl.replace(/\/api\/v\d+\/?$/i, '');
const healthUrl = import.meta.env.VITE_API_HEALTH_URL || `${inferredBackendBase}/health`;

export const getApiHealth = async () => {
  try {
    const response = await axios.get(healthUrl, {
      timeout: 7000,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching API health:', error);
    throw error;
  }
};

export default {
  getApiHealth,
};
