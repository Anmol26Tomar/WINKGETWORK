import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getProfile, loginUser as apiLogin, registerUser as apiRegister, logoutUser as apiLogout } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const me = await getProfile();
				setUser(me);
			} catch {}
			setLoading(false);
		})();
	}, []);

	const value = useMemo(() => ({
		user,
		loading,
		login: async (email, password) => {
			const u = await apiLogin(email, password);
			setUser(u);
			return u;
		},
		register: async (name, email, password) => {
			await apiRegister(name, email, password);
			const u = await apiLogin(email, password);
			setUser(u);
			return u;
		},
		logout: async () => {
			await apiLogout();
			setUser(null);
		},
	}), [user, loading]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	return useContext(AuthContext);
}


