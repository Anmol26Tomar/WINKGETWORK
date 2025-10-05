import { getToken } from '../utils/secureStore';
import { Platform } from 'react-native';

const DEFAULT_BASE = 'http://10.170.131.51:5000';
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || DEFAULT_BASE;

async function request(path, { method = 'GET', body } = {}) {
	const headers = { 'Content-Type': 'application/json' };
	const token = await getToken();
	if (token) headers['Authorization'] = `Bearer ${token}`;
	const res = await fetch(`${API_BASE}${path}`, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(data.message || 'Request failed');
	return data;
}

export async function estimateFare(payload) {
	return request('/api/parcels/estimate', { method: 'POST', body: payload });
}

export async function createParcel(payload) {
	return request('/api/parcels', { method: 'POST', body: payload });
}

export async function getParcel(id) {
	return request(`/api/parcels/${id}`, { method: 'GET' });
}

export async function verifyOtp(id, code) {
	return request(`/api/parcels/${id}/verify-otp`, { method: 'POST', body: { code } });
}

export async function confirmPayment(id) {
    return request(`/api/parcels/${id}/confirm-payment`, { method: 'POST' });
}

export async function testConnection() {
    console.log('Testing API connection...');
    const result = await request('/api/parcels/test', { method: 'GET' });
    console.log('Test result:', result);
    return result;
}

export async function getParcelHistory(serviceType = 'parcel') {
    console.log('Making API request to:', `/api/parcels/history?serviceType=${serviceType}`);
    const result = await request(`/api/parcels/history?serviceType=${serviceType}`, { method: 'GET' });
    console.log('API response:', result);
    return result;
}

export async function updateParcelStatus(id, status) {
    return request(`/api/parcels/${id}/status`, { method: 'PUT', body: { status } });
}

export async function getParcelTracking(id) {
    return request(`/api/parcels/${id}/tracking`, { method: 'GET' });
}

