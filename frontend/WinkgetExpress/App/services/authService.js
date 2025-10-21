import { saveToken, getToken, deleteToken } from '../utils/secureStore';
import { Platform } from 'react-native';

const DEFAULT_BASE = 'http://192.168.1.15:3001';
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || DEFAULT_BASE;

async function request(path, { method = 'GET', body, auth = false } = {}) {
	console.log("API_BASE",API_BASE);
	const headers = { 'Content-Type': 'application/json' };
	if (auth) {
		const token = await getToken();
		if (token) headers['Authorization'] = `Bearer ${token}`;
	}
	const res = await fetch(`${API_BASE}${path}`, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
	});
	console.log("request to",`${API_BASE}${path}`,{ method, headers, body });
	const data = await res.json().catch(() => ({}));
	console.log("data from auth service",data);
	if (!res.ok) {
		throw new Error(data.message || 'Request failed');
	}
	return data;
	
}

export async function registerUser(name, email, password) {
	return await request('/api/auth/register', { method: 'POST', body: { name, email, password } });
}

export async function loginUser(email, password) {
	const res = await request('/api/auth/login', { method: 'POST', body: { email, password } });
	console.log("real res",res);
	if (res?.token) await saveToken(res.token);
	return res.user;
}

export async function getProfile() {
	return await request('/api/auth/profile', { method: 'GET', auth: true });
}

export async function logoutUser() {
	await deleteToken();
}


