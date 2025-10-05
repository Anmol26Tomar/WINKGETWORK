import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParcelHistory from '../components/ParcelHistory';
import { Colors, Spacing, Radius } from '../constants/colors';

export default function HistoryScreen() {
    const [tab, setTab] = useState('parcel'); // 'parcel' | 'transport'
    return (
        <View style={styles.container}>
            <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tabBtn, tab === 'parcel' && styles.tabActive]} onPress={() => setTab('parcel')}>
                    <Ionicons name={tab === 'parcel' ? 'cube' : 'cube-outline'} size={18} color={tab === 'parcel' ? '#fff' : Colors.text} />
                    <Text style={[styles.tabTxt, tab === 'parcel' && styles.tabTxtActive]}>Parcels</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, tab === 'transport' && styles.tabActive]} onPress={() => setTab('transport')}>
                    <Ionicons name={tab === 'transport' ? 'car' : 'car-outline'} size={18} color={tab === 'transport' ? '#fff' : Colors.text} />
                    <Text style={[styles.tabTxt, tab === 'transport' && styles.tabTxtActive]}>Trips</Text>
                </TouchableOpacity>
            </View>

            {tab === 'parcel' ? (
                <ParcelHistory serviceType="parcel" />
            ) : (
                <ParcelHistory serviceType="transport" />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: Spacing.lg,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden'
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    tabActive: {
        backgroundColor: Colors.primary,
    },
    tabTxt: { color: Colors.text, fontWeight: '700' },
    tabTxtActive: { color: '#fff' },
});


