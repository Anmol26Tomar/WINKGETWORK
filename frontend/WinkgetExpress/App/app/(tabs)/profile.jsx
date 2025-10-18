import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, Radius } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import ParcelHistory from '../../components/ParcelHistory';

export default function ProfileScreen() {
	const { user, logout } = useAuth();
	const router = useRouter();
	const [activeTab, setActiveTab] = useState('profile');
	const [historySubTab, setHistorySubTab] = useState('parcel');

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


const renderHistoryTab = () => {
		return (
			<View style={styles.historyContainer}>
				<Text style={styles.heading}>Order History</Text>
				<View style={styles.subTabs}>
					<TouchableOpacity style={[styles.subTabBtn, historySubTab === 'parcel' && styles.subTabActive]} onPress={() => setHistorySubTab('parcel')}>
						<Ionicons name={historySubTab === 'parcel' ? 'cube' : 'cube-outline'} size={16} color={historySubTab === 'parcel' ? '#fff' : Colors.text} />
						<Text style={[styles.subTabTxt, historySubTab === 'parcel' && styles.subTabTxtActive]}>Parcels</Text>
					</TouchableOpacity>
					<TouchableOpacity style={[styles.subTabBtn, historySubTab === 'transport' && styles.subTabActive]} onPress={() => setHistorySubTab('transport')}>
						<Ionicons name={historySubTab === 'transport' ? 'car' : 'car-outline'} size={16} color={historySubTab === 'transport' ? '#fff' : Colors.text} />
						<Text style={[styles.subTabTxt, historySubTab === 'transport' && styles.subTabTxtActive]}>Trips</Text>
					</TouchableOpacity>
				</View>
				{historySubTab === 'parcel' ? (
					<ParcelHistory serviceType="parcel" />
				) : (
					<ParcelHistory serviceType="transport" />
				)}
			</View>
		);
	};

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
    tabContainer: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: Spacing.lg, marginTop: Spacing.lg, borderRadius: Radius.lg, padding: 4, borderWidth: 1, borderColor: Colors.border,
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
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
    card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg,
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
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
	},
	subTabs: {
		flexDirection: 'row',
		backgroundColor: '#fff',
		marginBottom: Spacing.md,
		borderRadius: Radius.lg,
		borderWidth: 1,
		borderColor: Colors.border,
		overflow: 'hidden'
	},
	subTabBtn: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 10,
		gap: 6,
	},
	subTabActive: { backgroundColor: Colors.primary },
	subTabTxt: { color: Colors.text, fontWeight: '700' },
    subTabTxtActive: { color: '#fff' },
});



