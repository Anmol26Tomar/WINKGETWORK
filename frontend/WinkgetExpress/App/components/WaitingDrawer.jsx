import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Animated, Easing, Pressable } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/colors';

const WaitingDrawer = forwardRef(({ onCancel }, ref) => {
	const [visible, setVisible] = useState(false);
	const translateY = useRef(new Animated.Value(300)).current;

	const open = () => {
		setVisible(true);
		requestAnimationFrame(() => {
			Animated.timing(translateY, { toValue: 0, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
		});
	};

	const close = () => {
		Animated.timing(translateY, { toValue: 300, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true }).start(() => setVisible(false));
	};

	useImperativeHandle(ref, () => ({ open, close }));

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
			<Pressable style={styles.backdrop} onPress={close} />
			<Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}> 
				<View style={styles.handle} />
				<View style={styles.content}>
					<View style={styles.loaderCard}>
						<ActivityIndicator size="large" color={Colors.primary} />
					</View>
					<Text style={styles.title}>Searching for nearby captains…</Text>
					<Text style={styles.subtitle}>We’ll notify you as soon as someone accepts.</Text>
					{onCancel ? (
						<TouchableOpacity style={styles.cancelBtn} onPress={() => { onCancel(); close(); }}>
							<Text style={styles.cancelText}>Cancel Ride</Text>
						</TouchableOpacity>
					) : null}
				</View>
			</Animated.View>
		</Modal>
	);
});

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.35)' },
    sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.92)', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingBottom: Spacing.lg,
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.15, shadowRadius: 20 },
    handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: Colors.border, marginTop: Spacing.md },
    content: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
    loaderCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 3 },
    title: { fontSize: 16, fontWeight: '800', color: Colors.text, marginTop: Spacing.sm },
    subtitle: { color: Colors.mutedText },
    cancelBtn: { marginTop: Spacing.md, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: Radius.lg },
    cancelText: { color: Colors.text, fontWeight: '700' },
});

export default WaitingDrawer;


