import api from '../config/api';

export const testAPIConnection = async () => {
  try {
    console.log('🧪 Testing API connection...');
    console.log('📡 Base URL:', api.defaults.baseURL);
    
    const response = await api.get('/health');
    console.log('✅ API Health Check Success:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ API Health Check Failed:', error.message);
    console.error('🔍 Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config?.url,
      baseURL: api.defaults.baseURL
    });
    return { success: false, error: error.message };
  }
};

export const testVendorAPI = async (category = 'Electronics') => {
  try {
    console.log(`🧪 Testing vendor API for category: ${category}`);
    const endpoint = `/business/vendors/category/${encodeURIComponent(category)}`;
    console.log('🔍 Full endpoint:', `${api.defaults.baseURL}${endpoint}`);
    
    const response = await api.get(endpoint);
    console.log('✅ Vendor API Success:', {
      success: response.data.success,
      vendorCount: response.data.vendors?.length || 0,
      totalFound: response.data.totalFound
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Vendor API Failed:', error.message);
    console.error('🔍 Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config?.url
    });
    return { success: false, error: error.message };
  }
};
