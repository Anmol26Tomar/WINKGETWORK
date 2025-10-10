import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  businesses: [],
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        businesses: action.payload.businesses || [],
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        businesses: [],
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'SET_BUSINESSES':
      return {
        ...state,
        businesses: action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token, businesses: [] },
        });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
        email: (email || '').trim().toLowerCase(),
        password,
      });

      const { token, user, businesses } = response.data;

      // Store token and user data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token, businesses },
      });

      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || 'Login failed';
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const payload = {
        name: (userData?.name || '').trim(),
        email: (userData?.email || '').trim().toLowerCase(),
        password: userData?.password,
        phone: userData?.phone || undefined,
      };
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, payload);

      const { token, user, businesses } = response.data;

      // Store token and user data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token, businesses },
      });

      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || 'Registration failed';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put(API_ENDPOINTS.AUTH.UPDATE_PROFILE, profileData);
      
      const updatedUser = response.data.user;
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      
      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Profile update failed',
      };
    }
  };

  const getBusinesses = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.BUSINESS.LIST);
      const businesses = response.data.businesses;
      
      dispatch({
        type: 'SET_BUSINESSES',
        payload: businesses,
      });

      return { success: true, businesses };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch businesses',
      };
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    getBusinesses,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
