const axios = require('axios');

const getExternalBaseUrl = () =>
  process.env.EXTERNAL_BASE_URL || 'http://localhost:8001';

const externalApi = axios.create({
  baseURL: getExternalBaseUrl(),
  timeout: Number(process.env.EXTERNAL_API_TIMEOUT_MS || 15000),
});

// Ensure the latest EXTERNAL_BASE_URL is always used (useful in dev / tests)
externalApi.interceptors.request.use((config) => {
  config.baseURL = getExternalBaseUrl();
  return config;
});

module.exports = { externalApi, getExternalBaseUrl };

