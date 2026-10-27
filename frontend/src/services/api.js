import axios from 'axios';

export const DIRECT_BACKEND_URL = 'https://share-it-wmi3.onrender.com/api';

const getBaseUrl = () => {
  // When deployed on Vercel, relative '/api' uses Vercel's server-to-server reverse proxy
  // to connect directly with Render, completely eliminating cross-origin CORS limitations.
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return '/api';
  }
  return import.meta.env.VITE_API_URL || DIRECT_BACKEND_URL;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  // Generous timeout to allow Render free-tier cold-start when waking from hibernation
  timeout: 60000,
});

// Automatically attach Bearer token to outgoing requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency mutex and queue for token refreshing to prevent race conditions
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle unauthorized status with seamless queued token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Vercel Edge Proxy Cold-Start Fallback:
    // When the backend is sleeping on Render free tier, Vercel's edge proxy times out after 10s (504/502).
    // Automatically failover directly to Render's backend so the browser can wait for the cold-start to finish.
    const isVercelProxyError =
      originalRequest &&
      !originalRequest._retriedDirect &&
      typeof window !== 'undefined' &&
      window.location.hostname.includes('vercel.app') &&
      (!error.response || [502, 503, 504].includes(error.response?.status) || error.code === 'ECONNABORTED');

    if (isVercelProxyError) {
      originalRequest._retriedDirect = true;
      delete originalRequest.baseURL;
      const cleanPath = originalRequest.url
        ? (originalRequest.url.startsWith('/') ? originalRequest.url : `/${originalRequest.url}`)
        : '';
      originalRequest.url = `${DIRECT_BACKEND_URL}${cleanPath}`;
      return api(originalRequest);
    }

    // 2. Only intercept 401 Unauthorized for protected endpoints
    if (
      error.response &&
      error.response.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      const fallbackRefreshToken = localStorage.getItem('refreshToken');
      if (!fallbackRefreshToken) {
        // Genuine unauthenticated state: clear credentials and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // If another request is currently refreshing the token, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshEndpoint = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
          ? `${DIRECT_BACKEND_URL}/auth/refresh`
          : `${api.defaults.baseURL}/auth/refresh`;

        const refreshResponse = await axios.post(
          refreshEndpoint,
          { refreshToken: fallbackRefreshToken },
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.token;
        if (newAccessToken) {
          localStorage.setItem('token', newAccessToken);
          if (refreshResponse.data.refreshToken) {
            localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
          }

          processQueue(null, newAccessToken);

          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          throw new Error('No new access token provided in refresh response');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);

        // CRITICAL DEPLOYMENT GUARD:
        // Only log out if the backend explicitly rejected the refresh token as invalid/expired (HTTP 401/403).
        // If the backend is restarting/deploying (HTTP 502/503/504) or temporarily unreachable (network error),
        // DO NOT log the user out! Keep credentials safe in localStorage so they remain logged in once the server completes deployment.
        const isDefinitiveAuthRejection =
          refreshError.response &&
          (refreshError.response.status === 401 || refreshError.response.status === 403);

        if (isDefinitiveAuthRejection) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
            window.location.href = '/login';
          }
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
