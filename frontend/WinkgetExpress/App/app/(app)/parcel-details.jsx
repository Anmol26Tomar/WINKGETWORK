import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import ParcelTracking from '@/components/ParcelTracking';
import BackButton from '@/components/BackButton';

export default function ParcelDetailsScreen() {
    const { id } = useLocalSearchParams();

    return (
        <View style={styles.container}>
            <BackButton />
            <ParcelTracking parcelId={id} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background }
});
