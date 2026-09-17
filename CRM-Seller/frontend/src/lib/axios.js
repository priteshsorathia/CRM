import axios from 'axios';

// Create a unified axios instance for the entire dashboard
const api = axios.create({
    baseURL:
        process.env.NEXT_PUBLIC_API_BASE,
    timeout: 15000,
});

// REQUEST INTERCEPTOR: Automatically inject the Bearer token if it exists
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Handle global errors like 401 Unauthorized
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only trigger logout on real 401s from the protected API
        if (typeof window !== 'undefined' && error.response && error.response.status === 401) {
            // Check if we're not already on the login page to avoid infinite loops
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login?session=expired';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
