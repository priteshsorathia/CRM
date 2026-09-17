import axios from 'axios';
import { getApiBase } from '@/utils/apiBase';

export const getVersionCheck = async () => {
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const API_URL = getApiBase();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(`${API_URL}/api/version/check`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching version info:', error.response?.data || error.message);
    throw error;
  }
};
