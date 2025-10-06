import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Animated, Easing, Pressable } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/colors';

const WaitingDrawer = forwardRef(({ onCancel }, ref) => {
	const [visible, setVisible] = useState(false);
	const translateY = useRef(new Animated.Value(300)).current;

	const open = () => {
		setVisible(true);
		requestAnimationFrame(() => {
			Animated.timing(translateY, { toValue: 0, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
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
					<ActivityIndicator size="large" color={Colors.primary} />
					<Text style={styles.title}>Searching for nearby captains...</Text>
					<Text style={styles.subtitle}>Waiting for captain to accept your ride</Text>
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
	backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
	sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingBottom: Spacing.lg },
	handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: Colors.border, marginTop: Spacing.md },
	content: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
	title: { fontSize: 16, fontWeight: '700', color: Colors.text },
	subtitle: { color: Colors.mutedText },
	cancelBtn: { marginTop: Spacing.md, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: Radius.lg },
	cancelText: { color: Colors.text, fontWeight: '700' },
});

export default WaitingDrawer;


