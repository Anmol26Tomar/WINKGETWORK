import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Easing, ScrollView, TextInput, Alert } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/colors';
import LoadingOverlay from './LoadingOverlay';
import { estimateFare as estimateParcelFare, createParcel } from '../services/parcelService';
import { estimateFareKm, haversineKm } from '../utils/fareCalculator';
import { estimateTransport, createTransport } from '../services/transportService';
import { requestPackersMovers } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const SERVICES = [
    { key: 'local_parcel', label: 'Local Parcel', icon: 'cube-outline' },
    { key: 'all_india_parcel', label: 'All India Parcel', icon: 'earth-outline' },
    { key: 'bike', label: 'Bike Ride', icon: 'bicycle-outline' },
    { key: 'cab', label: 'Cab Booking', icon: 'car-outline' },
    { key: 'truck', label: 'Truck Booking', icon: 'bus-outline' },
    { key: 'packers', label: 'Packers & Movers', icon: 'home-outline' },
];

const VEHICLE_SUBTYPES = [
    { key: 'mini_truck', label: 'Mini Truck', icon: 'cube' },
    { key: 'auto', label: 'Auto', icon: 'train-outline' },
    { key: 'pickup_van', label: 'Pickup Van', icon: 'bus-outline' },
];

const ServiceFlowDrawer = forwardRef(({ onClose, onSuccess }, ref) => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const translateY = useRef(new Animated.Value(360)).current;
    const contextRef = useRef({ pickup: null, delivery: null });

    const [step, setStep] = useState(0); // 0: select, 1: details
    const [service, setService] = useState(null);

    const [parcelForm, setParcelForm] = useState({
        name: '',
        size: '',
        weight: '',
        description: '',
        value: '',
        receiverName: '',
        receiverContact: '',
    });

    const [allIndiaForm, setAllIndiaForm] = useState({
        pkgType: 'Documents',
        weight: '1',
        dimensions: '',
        receiverName: '',
        receiverPhone: '',
        description: '',
    });

    const [transportForm, setTransportForm] = useState({ vehicleSubType: 'mini_truck' });
    const [packersForm, setPackersForm] = useState({ house: '1BHK', extras: '' });
    const [truckForm, setTruckForm] = useState({
        senderName: '',
        senderPhone: '',
        receiverName: '',
        receiverPhone: '',
        pkgType: 'Household',
        weight: '10',
        dimensions: '',
        description: '',
    });

    const open = (ctx) => {
        contextRef.current = ctx || {};
        setStep(0);
        setService(null);
        setVisible(true);
        requestAnimationFrame(() => {
            Animated.timing(translateY, { toValue: 0, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
        });
    };

    const close = () => {
        Animated.timing(translateY, { toValue: 360, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true }).start(() => {
            setVisible(false);
            onClose && onClose();
        });
    };

    useImperativeHandle(ref, () => ({ open, close }));

    const renderTimeline = () => {
        const steps = ['Select Service', 'Enter Details'];
        return (
            <View style={styles.timeline}>
                {steps.map((label, idx) => (
                    <View key={label} style={styles.timelineItem}>
                        <View style={[styles.bullet, idx <= step ? styles.bulletActive : null]} />
                        <Text style={[styles.bulletLabel, idx === step ? styles.bulletLabelActive : null]}>{label}</Text>
                        {idx < steps.length - 1 ? <View style={styles.connector} /> : null}
                    </View>
                ))}
            </View>
        );
    };

    const submit = async () => {
        try {
            const { pickup, delivery } = contextRef.current;
            if (!pickup || !delivery) { Alert.alert('Missing', 'Select pickup and delivery first'); return; }
            setLoading(true);
            if (service === 'local_parcel') {
                const weightNum = parseFloat(parcelForm.weight);
                if (!parcelForm.name || !parcelForm.size || !weightNum || !parcelForm.receiverName || !parcelForm.receiverContact) {
                    Alert.alert('Missing fields', 'Fill all required fields'); setLoading(false); return;
                }
                if (isNaN(weightNum) || weightNum <= 0 || weightNum > 20) {
                    Alert.alert('Invalid weight', 'Weight must be between 0 and 20 kg.'); setLoading(false); return;
                }
                let fare = 0;
                try {
                    const res = await estimateParcelFare({ pickup, delivery, vehicleType: 'bike' });
                    fare = res.fare;
                } catch {
                    const km = haversineKm(pickup, delivery);
                    fare = estimateFareKm(km, 'bike');
                }
                const payload = {
                    pickup,
                    delivery,
                    package: {
                        name: parcelForm.name,
                        size: parcelForm.size,
                        weight: weightNum,
                        description: parcelForm.description,
                        value: parseFloat(parcelForm.value || '0'),
                    },
                    receiverName: parcelForm.receiverName,
                    receiverContact: parcelForm.receiverContact,
                    vehicleType: 'bike',
                    fareEstimate: fare || 0,
                };
                const created = await createParcel(payload);
                onSuccess && onSuccess({ type: 'parcel', id: created?._id });
                Alert.alert('Parcel created', 'Your parcel has been created successfully.');
                close();
            } else if (service === 'all_india_parcel') {
                const weightNum = Number(allIndiaForm.weight) || 0;
                if (!allIndiaForm.pkgType || !weightNum || !allIndiaForm.receiverName || !allIndiaForm.receiverPhone) {
                    Alert.alert('Missing fields', 'Fill all required fields'); setLoading(false); return;
                }
                const km = haversineKm(pickup, delivery);
                const kmFare = estimateFareKm(km, 'truck');
                const payload = {
                    pickup: { lat: pickup.lat, lng: pickup.lng, address: pickup.address },
                    delivery: { lat: delivery.lat, lng: delivery.lng, address: delivery.address },
                    package: { name: allIndiaForm.pkgType, size: allIndiaForm.dimensions || 'standard', weight: weightNum, description: allIndiaForm.description || '' },
                    receiverName: allIndiaForm.receiverName,
                    receiverContact: allIndiaForm.receiverPhone,
                    vehicleType: 'admin',
                    fareEstimate: kmFare || 0,
                };
                const created = await createParcel(payload);
                onSuccess && onSuccess({ type: 'parcel', id: created?._id });
                Alert.alert('Success', 'Your All India Parcel has been created.');
                close();
            } else if (service === 'bike' || service === 'cab') {
                const vehicleType = service;
                let fare = 0, distanceKm = 0;
                try {
                    const res = await estimateTransport({ pickup, destination: delivery, vehicleType });
                    fare = res.fare; distanceKm = res.distanceKm;
                } catch {
                    const km = haversineKm(pickup, delivery);
                    distanceKm = km;
                    fare = estimateFareKm(km, vehicleType);
                }
                const created = await createTransport({
                    pickup,
                    destination: delivery,
                    vehicleType,
                    fareEstimate: fare || 0,
                    distanceKm: distanceKm || 0,
                });
                onSuccess && onSuccess({ type: 'transport', id: created?._id });
                Alert.alert('Request created', 'Your request has been placed.');
                close();
            } else if (service === 'truck') {
                // Match truck-booking-form: require sender & receiver UI fields, send package + receiver to createParcel
                const { senderName, senderPhone, receiverName, receiverPhone, pkgType, weight, dimensions } = truckForm;
                if (!senderName || !senderPhone || !receiverName || !receiverPhone) {
                    Alert.alert('Missing fields', 'Please enter sender and receiver details'); setLoading(false); return;
                }
                const km = haversineKm(pickup, delivery);
                const fare = estimateFareKm(km, 'truck');
                const payload = {
                    pickup: { lat: pickup.lat, lng: pickup.lng, address: pickup.address },
                    delivery: { lat: delivery.lat, lng: delivery.lng, address: delivery.address },
                    package: { name: pkgType || 'Household', size: dimensions || 'standard', weight: Number(weight || '0'), description: truckForm.description || '' },
                    receiverName,
                    receiverContact: receiverPhone,
                    vehicleType: 'truck',
                    fareEstimate: fare,
                };
                const created = await createParcel(payload);
                onSuccess && onSuccess({ type: 'parcel', id: created?._id });
                Alert.alert('Success', 'Your Truck booking parcel has been created.');
                close();
            } else if (service === 'packers') {
                // Use requestPackersMovers with centralized addresses
                const { house, extras } = packersForm;
                if (!house) { Alert.alert('Missing', 'Select house size'); setLoading(false); return; }
                const base = house === '1BHK' ? 3000 : house === '2BHK' ? 5000 : 7500;
                const extraCost = Math.min(2000, (extras || '').length * 10);
                const price = base + extraCost;
                await requestPackersMovers({ fromAddr: pickup.address, toAddr: delivery.address, house, extras, price });
                Alert.alert('Request sent', `Packers & Movers request submitted. Est. price ₹${price}`);
                onSuccess && onSuccess({ type: 'packers' });
                close();
            }
        } catch (e) {
            Alert.alert('Failed', e.message || 'Please try again');
        } finally {
            setLoading(false);
        }
    };

    const renderDetails = () => {
        if (service === 'local_parcel') {
            return (
                <View>
                    <TextInput style={styles.input} placeholder="Package Name" value={parcelForm.name} onChangeText={(t) => setParcelForm((s) => ({ ...s, name: t }))} />
                    <TextInput style={styles.input} placeholder="Size (e.g., small/medium)" value={parcelForm.size} onChangeText={(t) => setParcelForm((s) => ({ ...s, size: t }))} />
                    <TextInput style={styles.input} placeholder="Weight (kg)" keyboardType="numeric" value={parcelForm.weight} onChangeText={(t) => setParcelForm((s) => ({ ...s, weight: t }))} />
                    <TextInput style={[styles.input, styles.multiline]} placeholder="Description" multiline value={parcelForm.description} onChangeText={(t) => setParcelForm((s) => ({ ...s, description: t }))} />
                    <TextInput style={styles.input} placeholder="Declared Value (₹)" keyboardType="numeric" value={parcelForm.value} onChangeText={(t) => setParcelForm((s) => ({ ...s, value: t }))} />
                    <TextInput style={styles.input} placeholder="Receiver Name" value={parcelForm.receiverName} onChangeText={(t) => setParcelForm((s) => ({ ...s, receiverName: t }))} />
                    <TextInput style={styles.input} placeholder="Receiver Contact" value={parcelForm.receiverContact} onChangeText={(t) => setParcelForm((s) => ({ ...s, receiverContact: t }))} />
                </View>
            );
        }
        if (service === 'all_india_parcel') {
            return (
                <View>
                    <TextInput style={styles.input} placeholder="Type (e.g., Documents)" value={allIndiaForm.pkgType} onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, pkgType: t }))} />
                    <TextInput style={styles.input} placeholder="Weight (kg)" keyboardType="numeric" value={allIndiaForm.weight} onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, weight: t }))} />
                    <TextInput style={styles.input} placeholder="Dimensions (optional)" value={allIndiaForm.dimensions} onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, dimensions: t }))} />
                    <TextInput style={[styles.input, styles.multiline]} placeholder="Description (optional)" multiline value={allIndiaForm.description} onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, description: t }))} />
                    <TextInput style={styles.input} placeholder="Receiver Name" value={allIndiaForm.receiverName} onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, receiverName: t }))} />
                    <TextInput style={styles.input} placeholder="Receiver Phone" keyboardType="phone-pad" value={allIndiaForm.receiverPhone} onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, receiverPhone: t }))} />
                </View>
            );
        }
        if (service === 'truck') {
            return (
                <View>
                    <View style={styles.segmentRow}>
                        {VEHICLE_SUBTYPES.map((opt) => (
                            <TouchableOpacity key={opt.key} style={[styles.tag, transportForm.vehicleSubType === opt.key ? styles.tagActive : null]} onPress={() => setTransportForm((s) => ({ ...s, vehicleSubType: opt.key }))}>
                                <Ionicons name={opt.icon} size={16} color={transportForm.vehicleSubType === opt.key ? '#fff' : Colors.text} />
                                <Text style={[styles.tagTxt, transportForm.vehicleSubType === opt.key ? styles.tagTxtActive : null]}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {/* Sender details */}
                    <Text style={styles.sectionTitle}>Sender</Text>
                    <TextInput style={styles.input} placeholder="Name" value={truckForm.senderName} onChangeText={(t) => setTruckForm((s) => ({ ...s, senderName: t }))} />
                    <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={truckForm.senderPhone} onChangeText={(t) => setTruckForm((s) => ({ ...s, senderPhone: t }))} />
                    {/* Receiver details */}
                    <Text style={styles.sectionTitle}>Receiver</Text>
                    <TextInput style={styles.input} placeholder="Name" value={truckForm.receiverName} onChangeText={(t) => setTruckForm((s) => ({ ...s, receiverName: t }))} />
                    <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={truckForm.receiverPhone} onChangeText={(t) => setTruckForm((s) => ({ ...s, receiverPhone: t }))} />
                    {/* Package details */}
                    <Text style={styles.sectionTitle}>Package</Text>
                    <TextInput style={styles.input} placeholder="Type (e.g., Household)" value={truckForm.pkgType} onChangeText={(t) => setTruckForm((s) => ({ ...s, pkgType: t }))} />
                    <TextInput style={styles.input} placeholder="Weight (kg)" keyboardType="numeric" value={truckForm.weight} onChangeText={(t) => setTruckForm((s) => ({ ...s, weight: t }))} />
                    <TextInput style={styles.input} placeholder="Dimensions (optional)" value={truckForm.dimensions} onChangeText={(t) => setTruckForm((s) => ({ ...s, dimensions: t }))} />
                    <TextInput style={[styles.input, styles.multiline]} placeholder="Description (optional)" multiline value={truckForm.description} onChangeText={(t) => setTruckForm((s) => ({ ...s, description: t }))} />
                </View>
            );
        }
        if (service === 'bike' || service === 'cab') {
            return (
                <View>
                    <Text style={styles.meta}>No extra details required.</Text>
                </View>
            );
        }
        if (service === 'packers') {
            return (
                <View>
                    <View style={styles.segmentRow}>
                        {['1BHK', '2BHK', '3BHK'].map((h) => (
                            <TouchableOpacity key={h} style={[styles.tag, packersForm.house === h ? styles.tagActive : null]} onPress={() => setPackersForm((s) => ({ ...s, house: h }))}>
                                <Text style={[styles.tagTxt, packersForm.house === h ? styles.tagTxtActive : null]}>{h}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TextInput style={[styles.input, styles.multiline]} placeholder="Extra Items (optional)" value={packersForm.extras} onChangeText={(t) => setPackersForm((s) => ({ ...s, extras: t }))} multiline />
                </View>
            );
        }
        return null;
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
            <LoadingOverlay visible={loading} />
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close} />
            <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}> 
                <View style={styles.handle} />
                <ScrollView contentContainerStyle={styles.content}>
                    {renderTimeline()}
                    {step === 0 ? (
                        <View>
                            <Text style={styles.title}>Select a Service</Text>
                            <View style={styles.grid}>
                                {SERVICES.map((s) => (
                                    <TouchableOpacity key={s.key} style={[styles.serviceBtn, service === s.key ? styles.serviceBtnActive : null]} onPress={() => setService(s.key)}>
                                        <View style={styles.serviceIconWrap}>
                                            <Ionicons name={s.icon} size={18} color={service === s.key ? '#fff' : Colors.primary} />
                                        </View>
                                        <Text style={[styles.serviceTxt, service === s.key ? styles.serviceTxtActive : null]}>{s.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity style={[styles.primaryBtn, !service ? styles.primaryBtnDisabled : null]} disabled={!service} onPress={() => setStep(1)}>
                                <Text style={styles.primaryBtnTxt}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            <Text style={styles.title}>Enter Details</Text>
                            {renderDetails()}
                            <View style={styles.rowBetween}>
                                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(0)}>
                                    <Text style={styles.secondaryBtnTxt}>Back</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.primaryBtn} onPress={submit}>
                                    <Text style={styles.primaryBtnTxt}>Submit</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </Animated.View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
    sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.94)', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingBottom: Spacing.lg, maxHeight: '85%',
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: -12 }, shadowOpacity: 0.2, shadowRadius: 24 },
    handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: Colors.border, marginTop: Spacing.md },
    content: { padding: Spacing.xl, gap: Spacing.md },
    title: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    serviceBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 8,
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
    serviceBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    serviceTxt: { color: Colors.text },
    serviceIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(42,94,228,0.08)' },
    serviceTxtActive: { color: '#fff', fontWeight: '700' },
    primaryBtn: { backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 18, borderRadius: Radius.lg, alignItems: 'center', marginTop: Spacing.md },
    primaryBtnDisabled: { opacity: 0.5 },
    primaryBtnTxt: { color: '#fff', fontWeight: '700' },
    secondaryBtn: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, paddingVertical: 12, paddingHorizontal: 18, borderRadius: Radius.lg },
    secondaryBtnTxt: { color: Colors.text, fontWeight: '700' },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md,
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
    multiline: { height: 80, textAlignVertical: 'top' },
    meta: { color: Colors.mutedText },
    segmentRow: { flexDirection: 'row', gap: 8 },
    tag: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, marginRight: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
    tagActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    tagTxt: { color: Colors.text },
    tagTxtActive: { color: '#fff' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
    timeline: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
    timelineItem: { flexDirection: 'row', alignItems: 'center' },
    bullet: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.border },
    bulletActive: { backgroundColor: Colors.primary },
    connector: { width: 24, height: 2, backgroundColor: Colors.border, marginHorizontal: 8 },
    bulletLabel: { color: Colors.mutedText, marginRight: Spacing.md },
    bulletLabelActive: { color: Colors.text, fontWeight: '700' },
});

export default ServiceFlowDrawer;


