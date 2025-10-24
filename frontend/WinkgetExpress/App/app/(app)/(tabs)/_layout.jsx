import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import HeaderTitle from '../../../components/HeaderTitle';

export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				headerStyle: { backgroundColor: Colors.background },
				headerTintColor: Colors.text,
				headerTitle: ({ children }) => <HeaderTitle>{children}</HeaderTitle>,
				tabBarActiveTintColor: Colors.primary,
				tabBarInactiveTintColor: Colors.mutedText,
				tabBarStyle: { backgroundColor: Colors.background, borderTopColor: Colors.border, height: 60, paddingBottom: 8 },
				tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Home',
					tabBarIcon: ({ color, size, focused }) => (
						<Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="explore"
				options={{
					title: 'Explore',
					tabBarIcon: ({ color, size, focused }) => (
						<Ionicons name={focused ? 'compass' : 'compass-outline'} color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: 'Profile',
					tabBarIcon: ({ color, size, focused }) => (
						<Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} color={color} size={size} />
					),
				}}
			/>
		</Tabs>
	);
}


