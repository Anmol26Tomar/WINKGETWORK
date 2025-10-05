import React from 'react';
import { View, StyleSheet } from 'react-native';
import ParcelHistory from '../components/ParcelHistory';
import { Colors } from '../constants/colors';

export default function HistoryScreen() {
    return (
        <View style={styles.container}>
            <ParcelHistory serviceType="all" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background }
});


