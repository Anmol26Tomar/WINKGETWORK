import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

export async function saveToken(token) {
	try { await SecureStore.setItemAsync(TOKEN_KEY, token, { keychainAccessible: SecureStore.WHEN_UNLOCKED }); } catch {}
}

export async function getToken() {
	try { return await SecureStore.getItemAsync(TOKEN_KEY); } catch { return null; }
}

export async function deleteToken() {
	try { await SecureStore.deleteItemAsync(TOKEN_KEY); } catch {}
}


