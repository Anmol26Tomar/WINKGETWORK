import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export default function LoadingOverlay({ visible }) {
	if (!visible) return null;
	return (
        <View style={styles.overlay}>
            <View style={styles.card}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        </View>
	);
}

const styles = StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.12)', alignItems: 'center', justifyContent: 'center' },
    card: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 18, borderRadius: 16, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 5 }
});


