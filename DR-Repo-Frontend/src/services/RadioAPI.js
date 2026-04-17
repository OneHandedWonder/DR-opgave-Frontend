import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5249/api/radio',
});

export const getCurrentTrack = async (channelSlug) => {
  try {
    const response = await api.get(`/now-playing/${channelSlug}/track`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching current track for ${channelSlug}:`, error);
    throw error;
  }
};

export const getNowPlayingOverview = async () => {
  try {
    const response = await api.get('/now-playing');
    return response.data;
  } catch (error) {
    console.error('Error fetching now playing overview:', error);
    throw error;
  }
};
