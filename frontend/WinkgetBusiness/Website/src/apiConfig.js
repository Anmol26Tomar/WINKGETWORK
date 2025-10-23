export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:5000';

export const endpoints = {
  business: {
    auth: {
      login: "/api/business/auth/login",
      logout: "/api/business/auth/logout",
      me: "/api/business/auth/me",
      signup: "/api/business/auth/signup",
    },
    vendors: "/api/business/vendors",
    products: "/api/business/products",
    categories: "/api/business/categories",
    contact: "/api/business/contact",
    bills: "/api/business/bills",
  },
};
