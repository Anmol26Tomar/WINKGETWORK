import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, Radius } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import ParcelHistory from '../../components/ParcelHistory';

export default function ProfileScreen() {
	const { user, logout } = useAuth();
	const router = useRouter();
	const [activeTab, setActiveTab] = useState('profile');

	const onLogout = async () => {
		await logout();
		router.replace('/login');
	};

	const renderProfileTab = () => (
		<View>
			<Text style={styles.heading}>Profile</Text>
			<View style={styles.card}>
				<Text style={styles.label}>Name</Text>
				<Text style={styles.value}>{user?.name || '-'}</Text>
				<Text style={styles.label}>Email</Text>
				<Text style={styles.value}>{user?.email || '-'}</Text>
			</View>
			<TouchableOpacity style={styles.btn} onPress={onLogout}>
				<Text style={styles.btnTxt}>Logout</Text>
			</TouchableOpacity>
		</View>
	);

	const renderHistoryTab = () => (
		<View style={styles.historyContainer}>
			<Text style={styles.heading}>Order History</Text>
			<ParcelHistory serviceType="parcel" />
		</View>
	);

	return (
		<View style={styles.container}>
			{/* Tab Navigation */}
			<View style={styles.tabContainer}>
				<TouchableOpacity 
					style={[styles.tab, activeTab === 'profile' && styles.activeTab]} 
					onPress={() => setActiveTab('profile')}
				>
					<Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
						Profile
					</Text>
				</TouchableOpacity>
				<TouchableOpacity 
					style={[styles.tab, activeTab === 'history' && styles.activeTab]} 
					onPress={() => setActiveTab('history')}
				>
					<Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
						History
					</Text>
				</TouchableOpacity>
			</View>

			{/* Tab Content */}
			<View style={styles.tabContent}>
				{activeTab === 'profile' ? renderProfileTab() : renderHistoryTab()}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
	tabContainer: { 
		flexDirection: 'row', 
		backgroundColor: '#fff', 
		marginHorizontal: Spacing.lg, 
		marginTop: Spacing.lg, 
		borderRadius: Radius.lg,
		padding: 4,
		borderWidth: 1,
		borderColor: Colors.border
	},
	tab: { 
		flex: 1, 
		paddingVertical: Spacing.md, 
		alignItems: 'center', 
		borderRadius: Radius.md 
	},
	activeTab: { 
		backgroundColor: Colors.primary 
	},
	tabText: { 
		fontSize: 16, 
		fontWeight: '600', 
		color: Colors.mutedText 
	},
	activeTabText: { 
		color: '#fff' 
	},
	tabContent: { 
		flex: 1, 
		padding: Spacing.lg 
	},
	heading: { 
		fontSize: 22, 
		fontWeight: '800', 
		color: Colors.text, 
		marginBottom: Spacing.lg 
	},
	card: { 
		backgroundColor: '#fff', 
		borderWidth: 1, 
		borderColor: Colors.border, 
		borderRadius: Radius.lg, 
		padding: Spacing.lg, 
		marginBottom: Spacing.lg 
	},
	label: { 
		color: Colors.mutedText, 
		marginTop: 8 
	},
	value: { 
		color: Colors.text, 
		fontWeight: '700' 
	},
	btn: { 
		backgroundColor: Colors.primary, 
		padding: Spacing.lg, 
		borderRadius: Radius.lg, 
		alignItems: 'center', 
		marginTop: Spacing.md 
	},
	btnTxt: { 
		color: '#fff', 
		fontWeight: '700' 
	},
	historyContainer: { 
		flex: 1 
	}
});


