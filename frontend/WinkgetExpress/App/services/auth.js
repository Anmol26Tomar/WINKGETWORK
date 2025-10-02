// Mock Auth Service with basic in-memory session and AsyncStorage fallback
import AsyncStorage from '@react-native-async-storage/async-storage';

let inMemorySession = null; // { role, email, name, ... }

const delay = (ms = 900) => new Promise((r) => setTimeout(r, ms));

export async function loginUser(role, email, password) {
	if (!role || !email || !password) {
		throw new Error('All fields are required');
	}
	await delay();
	const mockUser = { id: 'u_' + Date.now(), role, email, name: role === 'Captain' ? 'Captain' : 'User' };
	inMemorySession = mockUser;
	try { await AsyncStorage.setItem('session', JSON.stringify(mockUser)); } catch (e) {}
	return mockUser;
}

export async function signupUser(role, formData) {
	const required = role === 'Captain'
		? ['name', 'email', 'phone', 'password', 'confirmPassword', 'vehicleType', 'vehicleNumber', 'licenseNumber']
		: ['name', 'email', 'phone', 'password', 'confirmPassword'];
	for (const k of required) {
		if (!formData[k]) throw new Error('Missing field: ' + k);
	}
	if (formData.password !== formData.confirmPassword) throw new Error('Passwords do not match');
	await delay();
	const mockUser = { id: 'u_' + Date.now(), role, email: formData.email, name: formData.name };
	inMemorySession = mockUser;
	try { await AsyncStorage.setItem('session', JSON.stringify(mockUser)); } catch (e) {}
	return mockUser;
}

export async function getSession() {
	if (inMemorySession) return inMemorySession;
	try {
		const raw = await AsyncStorage.getItem('session');
		if (raw) {
			inMemorySession = JSON.parse(raw);
			return inMemorySession;
		}
	} catch (e) {}
	return null;
}

export async function clearSession() {
	inMemorySession = null;
	try { await AsyncStorage.removeItem('session'); } catch (e) {}
}


