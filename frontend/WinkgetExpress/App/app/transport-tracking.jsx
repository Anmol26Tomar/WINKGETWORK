import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/colors';
import BackButton from '../components/BackButton';
import TransportTracking from '../components/TransportTracking';

export default function TransportTrackingScreen() {
	const { id } = useLocalSearchParams();
    return (
        <View style={styles.container}>
			<BackButton />
			<TransportTracking transportId={id} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background }
});


