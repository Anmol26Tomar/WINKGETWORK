import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParcelHistory from '../components/ParcelHistory';
import PackersHistory from '../components/PackersHistory';
import { Colors, Spacing, Radius } from '../constants/colors';
import { useRouter } from 'expo-router';

export default function HistoryScreen() {
    const [tab, setTab] = useState('parcel'); // 'parcel' | 'transport' | 'packers'
    const router = useRouter();
    
    const renderContent = () => {
        switch(tab) {
            case 'parcel':
                return <ParcelHistory serviceType="parcel" />;
            case 'transport':
                return <ParcelHistory serviceType="transport" />;
            case 'packers':
                return <PackersHistory />;
            default:
                return <ParcelHistory serviceType="parcel" />;
        }
    };
    
    const handlePackersPress = () => {
        router.push('/packers-history');
    };
    
    return (
        <View style={styles.container}>
            <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tabBtn, tab === 'parcel' && styles.tabActive]} onPress={() => setTab('parcel')}>
                    <Ionicons name={tab === 'parcel' ? 'cube' : 'cube-outline'} size={16} color={tab === 'parcel' ? '#fff' : Colors.text} />
                    <Text style={[styles.tabTxt, tab === 'parcel' && styles.tabTxtActive]}>Parcels</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, tab === 'transport' && styles.tabActive]} onPress={() => setTab('transport')}>
                    <Ionicons name={tab === 'transport' ? 'car' : 'car-outline'} size={16} color={tab === 'transport' ? '#fff' : Colors.text} />
                    <Text style={[styles.tabTxt, tab === 'transport' && styles.tabTxtActive]}>Trips</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, tab === 'packers' && styles.tabActive]} onPress={handlePackersPress}>
                    <Ionicons name={tab === 'packers' ? 'home' : 'home-outline'} size={16} color={tab === 'packers' ? '#fff' : Colors.text} />
                    <Text style={[styles.tabTxt, tab === 'packers' && styles.tabTxtActive]}>Move</Text>
                </TouchableOpacity>
            </View>
            {renderContent()}
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
        overflow: 'hidden',
        shadowColor: Colors.shadow, 
        shadowOffset: { width: 0, height: 6 }, 
        shadowOpacity: 0.08, 
        shadowRadius: 12, 
        elevation: 2 
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        gap: 4,
        minWidth: 0,
        maxWidth: '33.33%',
    },
    tabActive: { backgroundColor: Colors.primary },
    tabTxt: { color: Colors.text, fontWeight: '700', fontSize: 11 },
    tabTxtActive: { color: '#fff' },
});


