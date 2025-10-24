import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Authentication Service
 * Handles user authentication and token management
 */

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

class AuthService {
  /**
   * Get stored authentication token
   */
  async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('[AuthService] Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Store authentication token
   * @param {string} token - JWT token
   */
  async setAuthToken(token) {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      return true;
    } catch (error) {
      console.error('[AuthService] Error setting auth token:', error);
      return false;
    }
  }

  /**
   * Get stored user data
   */
  async getUserData() {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('[AuthService] Error getting user data:', error);
      return null;
    }
  }

  /**
   * Store user data
   * @param {Object} userData - User information
   */
  async setUserData(userData) {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('[AuthService] Error setting user data:', error);
      return false;
    }
  }

  /**
   * Clear all authentication data
   */
  async clearAuth() {
    try {
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
      return true;
    } catch (error) {
      console.error('[AuthService] Error clearing auth:', error);
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      const token = await this.getAuthToken();
      return !!token;
    } catch (error) {
      console.error('[AuthService] Error checking authentication:', error);
      return false;
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export const getAuthToken = () => authService.getAuthToken();
export const setAuthToken = (token) => authService.setAuthToken(token);
export const getUserData = () => authService.getUserData();
export const setUserData = (userData) => authService.setUserData(userData);
export const clearAuth = () => authService.clearAuth();
export const isAuthenticated = () => authService.isAuthenticated();

export default authService;