import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../constants/colors';
import { AuthProvider } from '../context/AuthContext';
import HeaderTitle from '../components/HeaderTitle';

export default function RootLayout() {
	return (
		<AuthProvider>
			<Stack screenOptions={{
				headerStyle: { backgroundColor: Colors.background },
				headerTintColor: Colors.text,
				headerShadowVisible: false,
				headerTitle: ({ children }) => <HeaderTitle>{children}</HeaderTitle>,
			}}>
				<Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
				<Stack.Screen name="signup" options={{ title: 'Sign up', headerShown: false }} />
				<Stack.Screen name="index" options={{ title: 'Winkget Services' }} />
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
				<Stack.Screen name="parcel-details" options={{ title: 'Parcel Details' }} />
				<Stack.Screen name="captain/index" options={{ title: 'Captain Dashboard' }} />
				<Stack.Screen name="history" options={{ title: 'Order History' }} />
			</Stack>
		</AuthProvider>
	);
}


