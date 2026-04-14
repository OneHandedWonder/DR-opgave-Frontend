import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_AUTH_URL || 'http://localhost:5249/api/auth',
});

export const login = async (username, password) => {
  try {
    const response = await api.post('/signin', { username, password });
    return response.data;
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
}

export const logout = async (token) => {
  try {
    await api.post('/signout', {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
}

export default api;