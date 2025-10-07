export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:5000';

export const endpoints = {
  business: {
    auth: {
      login: '/api/business/auth/login',
      signup: '/api/business/auth/signup',
    },
    vendors: '/api/business/vendors',
    products: '/api/business/products',
    contact: '/api/business/contact',
  },
};


