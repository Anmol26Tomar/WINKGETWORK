import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api, { API_ENDPOINTS } from '../config/api';

const BusinessContext = createContext();

const initialState = {
  currentBusiness: null,
  vendors: [],
  products: [],
  categories: [],
  isLoading: false,
  error: null,
};

const businessReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_CURRENT_BUSINESS':
      return { ...state, currentBusiness: action.payload };
    case 'SET_VENDORS':
      return { ...state, vendors: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'CLEAR_BUSINESS_DATA':
      return {
        ...state,
        currentBusiness: null,
        vendors: [],
        products: [],
        categories: [],
        error: null,
      };
    default:
      return state;
  }
};

export const BusinessProvider = ({ children }) => {
  const [state, dispatch] = useReducer(businessReducer, initialState);

  const getBusinessBySlug = async (slug) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await api.get(API_ENDPOINTS.BUSINESS.DETAIL(slug));
      const { business, vendors, products } = response.data;

      dispatch({ type: 'SET_CURRENT_BUSINESS', payload: business });
      dispatch({ type: 'SET_VENDORS', payload: vendors });
      dispatch({ type: 'SET_PRODUCTS', payload: products });
      dispatch({ type: 'SET_LOADING', payload: false });

      return { success: true, business, vendors, products };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to fetch business' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch business',
      };
    }
  };

  const getBusinessVendors = async (slug, filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await api.get(API_ENDPOINTS.BUSINESS.VENDORS(slug), {
        params: filters,
      });

      const { vendors } = response.data;
      dispatch({ type: 'SET_VENDORS', payload: vendors });
      dispatch({ type: 'SET_LOADING', payload: false });

      return { success: true, vendors };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to fetch vendors' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch vendors',
      };
    }
  };

  const getBusinessProducts = async (slug, filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await api.get(API_ENDPOINTS.BUSINESS.PRODUCTS(slug), {
        params: filters,
      });

      const { products } = response.data;
      dispatch({ type: 'SET_PRODUCTS', payload: products });
      dispatch({ type: 'SET_LOADING', payload: false });

      return { success: true, products };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to fetch products' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch products',
      };
    }
  };

  const getBusinessCategories = async (slug) => {
    try {
      const response = await api.get(API_ENDPOINTS.BUSINESS.CATEGORIES(slug));
      const { categories } = response.data;
      
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
      return { success: true, categories };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch categories',
      };
    }
  };

  const getBusinessStats = async (slug) => {
    try {
      const response = await api.get(API_ENDPOINTS.BUSINESS.STATS(slug));
      const { stats } = response.data;
      return { success: true, stats };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch stats',
      };
    }
  };

  const clearBusinessData = () => {
    dispatch({ type: 'CLEAR_BUSINESS_DATA' });
  };

  const value = {
    ...state,
    getBusinessBySlug,
    getBusinessVendors,
    getBusinessProducts,
    getBusinessCategories,
    getBusinessStats,
    clearBusinessData,
  };

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
