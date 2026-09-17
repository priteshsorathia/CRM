// // utils/apiClient.js
// import axios from 'axios';

// const apiClient = axios.create({
//   baseURL: '/api', // Points to Next.js API routes
//   timeout: 10000, // 10 second timeout
// });

// // Add request interceptor for auth tokens
// apiClient.interceptors.request.use(config => {
//   const token = localStorage.getItem('authToken');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // Simplify response handling
// apiClient.interceptors.response.use(
//   response => response.data,
//   error => {
//     const errorMessage = error.response?.data?.message || 
//                         error.message || 
//                         'Request failed';
//     return Promise.reject(errorMessage);
//   }
// );

// export default apiClient;

import axios from 'axios';
import { getToken, forceLogout } from './auth';
import { getApiBase } from './apiBase';

const apiClient = axios.create({
  baseURL: getApiBase(),
  timeout: 10000, // 10 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // No token - force logout
      if (typeof window !== 'undefined') {
        forceLogout('No authentication token found');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token expiration
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized - Token expired or invalid');
      forceLogout('Your session has expired. Please login again.');
    }

    // Handle 403 Forbidden - access denied but session still valid
    if (error.response?.status === 403) {
      console.error('❌ 403 Forbidden - Access denied');
      // DO NOT force logout on 403. Just log the error.
      // The application should handle the rejection and show a message to the user.
    }

    return Promise.reject(error);
  }
);

export default apiClient;
