import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../constants/colors';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
	return (
		<AuthProvider>
			<Stack screenOptions={{
				headerStyle: { backgroundColor: Colors.background },
				headerTintColor: Colors.text,
				headerShadowVisible: false,
			}}>
				<Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
				<Stack.Screen name="signup" options={{ title: 'Sign up', headerShown: false }} />
				<Stack.Screen name="index" options={{ title: 'Winkget Services' }} />
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
				<Stack.Screen name="success" options={{ title: 'Success' }} />
				<Stack.Screen name="local-parcel" options={{ title: 'Local Parcel' }} />
				<Stack.Screen name="truck-booking" options={{ title: 'Truck Booking' }} />
				<Stack.Screen name="all-india-parcel" options={{ title: 'All India Parcel' }} />
				<Stack.Screen name="cab-booking" options={{ title: 'Cab Booking' }} />
				<Stack.Screen name="bike-ride" options={{ title: 'Bike Ride' }} />
				<Stack.Screen name="packers-movers" options={{ title: 'Packers & Movers' }} />
				<Stack.Screen name="captain/index" options={{ title: 'Captain Dashboard' }} />
			</Stack>
		</AuthProvider>
	);
}


