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

const TRUCK_VEHICLES = [
    {
        id: "three_wheeler",
        name: "Three-Wheeler / Tempo",
        description: "Ideal for small parcel deliveries or light goods movement within the city.",
        capacityPayloadKg: 500,
        vehicleLengthFt: 5,
        vehicleWidthFt: 3,
        baseFare: 120,
        perKmRate: 10,
        icon: "🛺",
        examples: ["Piaggio Ape", "Mahindra Alfa", "Bajaj Maxima"],
        useCases: ["Small parcel delivery", "Retail supply", "Local vendors"]
    },
    {
        id: "mini_truck",
        name: "Mini Truck / Tata Ace",
        description: "Perfect for small house shifting or business deliveries.",
        capacityPayloadKg: 1200,
        vehicleLengthFt: 8,
        vehicleWidthFt: 4.5,
        baseFare: 250,
        perKmRate: 14,
        icon: "🚚",
        examples: ["Tata Ace", "Ashok Leyland Dost", "Mahindra Jeeto"],
        useCases: ["Furniture shifting", "Small warehouse logistics", "Business deliveries"]
    },
    {
        id: "pickup_truck",
        name: "Pickup Truck / Tata 407",
        description: "Great for transporting heavier goods across cities.",
        capacityPayloadKg: 3000,
        vehicleLengthFt: 14,
        vehicleWidthFt: 6,
        baseFare: 500,
        perKmRate: 18,
        icon: "🚛",
        examples: ["Tata 407", "Eicher Pro 1049", "Mahindra Bolero Pickup"],
        useCases: ["Construction material", "Industrial supply", "Bulk retail movement"]
    },
    {
        id: "medium_truck",
        name: "Medium Truck (14-17 ft)",
        description: "Best for large quantity goods and logistics distribution.",
        capacityPayloadKg: 6000,
        vehicleLengthFt: 17,
        vehicleWidthFt: 7,
        baseFare: 800,
        perKmRate: 25,
        icon: "🚛",
        examples: ["Eicher 14ft", "Eicher 17ft", "Tata LPT 709"],
        useCases: ["Warehouse distribution", "Bulk delivery", "Intercity logistics"]
    },
    {
        id: "large_truck",
        name: "Large Truck (22-32 ft)",
        description: "For heavy load logistics, interstate transportation and large consignments.",
        capacityPayloadKg: 15000,
        vehicleLengthFt: 32,
        vehicleWidthFt: 8,
        baseFare: 1500,
        perKmRate: 40,
        icon: "🚚",
        examples: ["Tata LPT 1613", "Ashok Leyland 2214", "Eicher Pro 6025"],
        useCases: ["Interstate logistics", "Bulk cargo", "Manufacturing supply chain"]
    }
];

const ServiceFlowDrawer = forwardRef(({ onClose, onSuccess }, ref) => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const translateY = useRef(new Animated.Value(360)).current;
    const contextRef = useRef({ pickup: null, delivery: null });

    const [step, setStep] = useState(0); // 0: select, 1: details, 2: review
    const [service, setService] = useState(null);
    const [estimatedFare, setEstimatedFare] = useState(null);
    const [fareLoading, setFareLoading] = useState(false);

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
        length: '',
        width: '',
        height: '',
        receiverName: '',
        receiverPhone: '',
        description: '',
        typeOfDelivery: 'standard',
    });

    const [transportForm, setTransportForm] = useState({ vehicleSubType: 'mini_truck' });
    const [packersForm, setPackersForm] = useState({ house: '1BHK', extras: '' });
    const [selectedTruckVehicle, setSelectedTruckVehicle] = useState(null);
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
        const context = ctx || {};
        
        // Check if both pickup and delivery addresses are filled
        if (!context.pickup || !context.delivery) {
            Alert.alert('Missing Addresses', 'Please select both pickup and delivery addresses before opening the service drawer.');
            return;
        }
        
        contextRef.current = context;
        setStep(0);
        setService(null);
        setSelectedTruckVehicle(null);
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

    const estimateFare = async () => {
        try {
            const { pickup, delivery } = contextRef.current;
            if (!pickup || !delivery) {
                Alert.alert('Missing Addresses', 'Please select both pickup and delivery addresses first.');
                return;
            }

            setFareLoading(true);
            setEstimatedFare(null);

            let fare = 0;
            let vehicleType = 'bike';

            if (service === 'local_parcel') {
                vehicleType = 'bike';
                // Call existing parcel estimate API
                const res = await estimateParcelFare({ pickup, delivery, vehicleType });
                fare = res.fare;
            } else if (service === 'all_india_parcel' || service === 'truck') {
                vehicleType = 'truck';
                // Call existing parcel estimate API for truck
                const res = await estimateParcelFare({ pickup, delivery, vehicleType, typeOfDelivery: allIndiaForm.typeOfDelivery });
                fare = res.fare;
            } else if (service === 'bike') {
                vehicleType = 'bike';
                // Call existing transport estimate API
                const res = await estimateTransport({ pickup, destination: delivery, vehicleType });
                fare = res.fare;
            } else if (service === 'cab') {
                vehicleType = 'cab';
                // Call existing transport estimate API
                const res = await estimateTransport({ pickup, destination: delivery, vehicleType });
                fare = res.fare;
            } else if (service === 'packers') {
                const { house, extras } = packersForm;
                const base = house === '1BHK' ? 3000 : house === '2BHK' ? 5000 : 7500;
                const extraCost = Math.min(2000, (extras || '').length * 10);
                fare = base + extraCost;
            }

            setEstimatedFare({
                amount: fare,
                vehicleType: vehicleType,
                service: service
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to estimate fare. Please try again.');
        } finally {
            setFareLoading(false);
        }
    };

    const renderTruckVehicleSelection = () => {
        return (
            <View>
                <Text style={styles.title}>Choose Your Truck</Text>
                <Text style={styles.subtitle}>Select the perfect vehicle for your cargo needs</Text>
                
                <View style={styles.vehicleGrid}>
                    {TRUCK_VEHICLES.map((vehicle) => (
                        <TouchableOpacity 
                            key={vehicle.id}
                            style={[
                                styles.vehicleCard, 
                                selectedTruckVehicle?.id === vehicle.id ? styles.vehicleCardActive : null
                            ]}
                            onPress={() => setSelectedTruckVehicle(vehicle)}
                        >
                            <View style={styles.vehicleCardHeader}>
                                <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                                <View style={styles.vehicleInfo}>
                                    <Text style={[
                                        styles.vehicleName,
                                        selectedTruckVehicle?.id === vehicle.id ? styles.vehicleNameActive : null
                                    ]}>
                                        {vehicle.name}
                                    </Text>
                                    <Text style={styles.vehicleCapacity}>
                                        Capacity: {vehicle.capacityPayloadKg}kg
                                    </Text>
                                </View>
                            </View>
                            
                            <Text style={styles.vehicleDescription}>{vehicle.description}</Text>
                            
                            <View style={styles.vehicleSpecs}>
                                <View style={styles.specItem}>
                                    <Text style={styles.specLabel}>Size</Text>
                                    <Text style={styles.specValue}>{vehicle.vehicleLengthFt}' × {vehicle.vehicleWidthFt}'</Text>
                                </View>
                                <View style={styles.specItem}>
                                    <Text style={styles.specLabel}>Base Fare</Text>
                                    <Text style={styles.specValue}>₹{vehicle.baseFare}</Text>
                                </View>
                                <View style={styles.specItem}>
                                    <Text style={styles.specLabel}>Per Km</Text>
                                    <Text style={styles.specValue}>₹{vehicle.perKmRate}</Text>
                                </View>
                            </View>
                            
                            <View style={styles.vehicleUseCases}>
                                <Text style={styles.useCaseLabel}>Best for:</Text>
                                <View style={styles.useCaseTags}>
                                    {vehicle.useCases.slice(0, 2).map((useCase, index) => (
                                        <View key={index} style={styles.useCaseTag}>
                                            <Text style={styles.useCaseTagText}>{useCase}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
                
                <TouchableOpacity 
                    style={[
                        styles.primaryBtn, 
                        !selectedTruckVehicle ? styles.primaryBtnDisabled : null
                    ]} 
                    disabled={!selectedTruckVehicle} 
                    onPress={() => setStep(1)}
                >
                    <Text style={styles.primaryBtnTxt}>Continue</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderEstimateFare = () => {
        return (
            <View style={styles.estimateFareContainer}>
                <TouchableOpacity 
                    style={[styles.estimateFareBtn, fareLoading ? styles.estimateFareBtnDisabled : null]} 
                    onPress={estimateFare}
                    disabled={fareLoading}
                >
                    <View style={styles.estimateFareBtnContent}>
                        <Ionicons 
                            name={fareLoading ? "hourglass-outline" : "calculator-outline"} 
                            size={20} 
                            color={fareLoading ? Colors.mutedText : '#fff'} 
                        />
                        <Text style={styles.estimateFareBtnText}>
                            {fareLoading ? 'Calculating...' : 'Estimate Fare'}
                        </Text>
                    </View>
                </TouchableOpacity>
                
                {estimatedFare && (
                    <View style={styles.fareDisplay}>
                        <View style={styles.fareDisplayHeader}>
                            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                            <Text style={styles.fareLabel}>Estimated Fare</Text>
                        </View>
                        <Text style={styles.fareAmount}>₹{estimatedFare.amount.toFixed(2)}</Text>
                        <Text style={styles.fareNote}>*Final fare may vary based on actual distance</Text>
                    </View>
                )}
            </View>
        );
    };

    const renderTimeline = () => {
        const steps = ['Select Service', 'Enter Details', 'Review'];
        return (
            <View>
                {/* Bullets row with left/right half connectors to keep bullet centered over label */}
                <View style={styles.timelineRow}>
                    {steps.map((label, idx) => (
                        <View key={`bullet-${label}`} style={styles.timelineStep}>
                            {/* left connector */}
                            {idx > 0 ? (
                                <View style={[styles.connectorHalf, idx - 1 < step ? styles.connectorActive : null]} />
                            ) : <View style={styles.connectorHalfEmpty} />}
                            {/* bullet */}
                            <View style={[styles.bullet, idx <= step ? styles.bulletActive : null]} />
                            {/* right connector */}
                            {idx < steps.length - 1 ? (
                                <View style={[styles.connectorHalf, idx < step ? styles.connectorActive : null]} />
                            ) : <View style={styles.connectorHalfEmpty} />}
                        </View>
                    ))}
                </View>
                {/* Labels row aligned under bullets */}
                <View style={styles.timelineLabels}>
                    {steps.map((label, idx) => (
                        <View key={`label-${label}`} style={styles.labelItem}>
                            <Text style={[styles.bulletLabel, idx === step ? styles.bulletLabelActive : null]}>{label}</Text>
                        </View>
                    ))}
                </View>
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
                const kmFare = estimateFareKm(km, 'truck', allIndiaForm.typeOfDelivery);
                const payload = {
                    pickup: { lat: pickup.lat, lng: pickup.lng, address: pickup.address },
                    delivery: { lat: delivery.lat, lng: delivery.lng, address: delivery.address },
                    package: { 
                        name: allIndiaForm.pkgType, 
                        size: allIndiaForm.dimensions || 'standard', 
                        weight: weightNum, 
                        description: allIndiaForm.description || '',
                        length: parseFloat(allIndiaForm.length || '0'),
                        width: parseFloat(allIndiaForm.width || '0'),
                        height: parseFloat(allIndiaForm.height || '0')
                    },
                    receiverName: allIndiaForm.receiverName,
                    receiverContact: allIndiaForm.receiverPhone,
                    vehicleType: 'admin',
                    typeOfDelivery: allIndiaForm.typeOfDelivery,
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
                if (!selectedTruckVehicle) {
                    Alert.alert('Missing Vehicle', 'Please select a truck vehicle'); setLoading(false); return;
                }
                const { senderName, senderPhone, receiverName, receiverPhone, pkgType, weight, dimensions } = truckForm;
                if (!senderName || !senderPhone || !receiverName || !receiverPhone) {
                    Alert.alert('Missing fields', 'Please enter sender and receiver details'); setLoading(false); return;
                }
                
                const weightNum = Number(weight || '0');
                if (weightNum > selectedTruckVehicle.capacityPayloadKg) {
                    Alert.alert('Weight Exceeded', `Weight cannot exceed ${selectedTruckVehicle.capacityPayloadKg}kg for selected vehicle`); setLoading(false); return;
                }
                
                const km = haversineKm(pickup, delivery);
                const fare = selectedTruckVehicle.baseFare + (km * selectedTruckVehicle.perKmRate);
                const payload = {
                    pickup: { lat: pickup.lat, lng: pickup.lng, address: pickup.address },
                    delivery: { lat: delivery.lat, lng: delivery.lng, address: delivery.address },
                    package: { 
                        name: pkgType || 'Household', 
                        size: dimensions || 'standard', 
                        weight: weightNum, 
                        description: truckForm.description || '',
                        vehicleType: selectedTruckVehicle.id,
                        vehicleName: selectedTruckVehicle.name,
                        vehicleCapacity: selectedTruckVehicle.capacityPayloadKg
                    },
                    receiverName,
                    receiverContact: receiverPhone,
                    vehicleType: 'truck',
                    vehicleSubType: selectedTruckVehicle.name,
                    fareEstimate: fare,
                };
                const created = await createParcel(payload);
                onSuccess && onSuccess({ type: 'parcel', id: created?._id });
                Alert.alert('Success', `Your ${selectedTruckVehicle.name} booking has been created.`);
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
                    <Text style={styles.fieldLabel}>Package Name</Text>
                    <TextInput style={styles.input} placeholder="Package Name" value={parcelForm.name} onChangeText={(t) => setParcelForm((s) => ({ ...s, name: t }))} />

                    <Text style={styles.fieldLabel}>Size</Text>
                    <TextInput style={styles.input} placeholder="Size (e.g., small/medium)" value={parcelForm.size} onChangeText={(t) => setParcelForm((s) => ({ ...s, size: t }))} />

                    <Text style={styles.fieldLabel}>Weight (kg)</Text>
                    <TextInput style={styles.input} placeholder="Weight (kg)" keyboardType="numeric" value={parcelForm.weight} onChangeText={(t) => setParcelForm((s) => ({ ...s, weight: t }))} />

                    <Text style={styles.fieldLabel}>Description</Text>
                    <TextInput style={[styles.input, styles.multiline]} placeholder="Description" multiline value={parcelForm.description} onChangeText={(t) => setParcelForm((s) => ({ ...s, description: t }))} />

                    <Text style={styles.fieldLabel}>Declared Value (₹)</Text>
                    <TextInput style={styles.input} placeholder="Declared Value (₹)" keyboardType="numeric" value={parcelForm.value} onChangeText={(t) => setParcelForm((s) => ({ ...s, value: t }))} />

                    <Text style={styles.fieldLabel}>Receiver Name</Text>
                    <TextInput style={styles.input} placeholder="Receiver Name" value={parcelForm.receiverName} onChangeText={(t) => setParcelForm((s) => ({ ...s, receiverName: t }))} />

                    <Text style={styles.fieldLabel}>Receiver Contact</Text>
                    <TextInput style={styles.input} placeholder="Receiver Contact" value={parcelForm.receiverContact} onChangeText={(t) => setParcelForm((s) => ({ ...s, receiverContact: t }))} />
                    
                    {renderEstimateFare()}
                </View>
            );
        }
        if (service === 'all_india_parcel') {
            return (
                <View>
                    <Text style={styles.fieldLabel}>Type</Text>
                    <TextInput style={styles.input} placeholder="Type (e.g., Documents)" value={allIndiaForm.pkgType} onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, pkgType: t }))} />

                    <Text style={styles.fieldLabel}>Weight (kg)</Text>
                    <TextInput style={styles.input} placeholder="Weight (kg)" keyboardType="numeric" value={allIndiaForm.weight} onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, weight: t }))} />

                    <Text style={styles.fieldLabel}>Dimensions</Text>
                    <TextInput style={styles.input} placeholder="Dimensions (optional)" value={allIndiaForm.dimensions} onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, dimensions: t }))} />

                    <Text style={styles.fieldLabel}>Length (cm)</Text>
                    <TextInput style={styles.input} placeholder="Length in cm" keyboardType="numeric" value={allIndiaForm.length} onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, length: t }))} />

                    <Text style={styles.fieldLabel}>Width (cm)</Text>
                    <TextInput style={styles.input} placeholder="Width in cm" keyboardType="numeric" value={allIndiaForm.width} onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, width: t }))} />

                    <Text style={styles.fieldLabel}>Height (cm)</Text>
                    <TextInput style={styles.input} placeholder="Height in cm" keyboardType="numeric" value={allIndiaForm.height} onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, height: t }))} />

                    <Text style={styles.fieldLabel}>Description</Text>
                    <TextInput style={[styles.input, styles.multiline]} placeholder="Description (optional)" multiline value={allIndiaForm.description} onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, description: t }))} />

                    <Text style={styles.fieldLabel}>Receiver Name</Text>
                    <TextInput style={styles.input} placeholder="Receiver Name" value={allIndiaForm.receiverName} onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, receiverName: t }))} />

                    <Text style={styles.fieldLabel}>Receiver Phone</Text>
                    <TextInput style={styles.input} placeholder="Receiver Phone" keyboardType="phone-pad" value={allIndiaForm.receiverPhone} onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, receiverPhone: t }))} />
                    
                    <Text style={styles.fieldLabel}>Delivery Type</Text>
                    <View style={styles.deliveryTypeContainer}>
                        {[
                            { key: 'standard', label: 'Standard', description: '3-5 days' },
                            { key: 'express', label: 'Express', description: '1-2 days (+50%)' }
                        ].map((option) => (
                            <TouchableOpacity 
                                key={option.key} 
                                style={[
                                    styles.deliveryTypeCard, 
                                    allIndiaForm.typeOfDelivery === option.key ? styles.deliveryTypeCardActive : null
                                ]} 
                                onPress={() => setAllIndiaForm((s) => ({ ...s, typeOfDelivery: option.key }))}
                            >
                                <View style={styles.deliveryTypeHeader}>
                                    <View style={[
                                        styles.deliveryTypeRadio,
                                        allIndiaForm.typeOfDelivery === option.key ? styles.deliveryTypeRadioActive : null
                                    ]}>
                                        {allIndiaForm.typeOfDelivery === option.key && (
                                            <View style={styles.deliveryTypeRadioInner} />
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.deliveryTypeLabel,
                                        allIndiaForm.typeOfDelivery === option.key ? styles.deliveryTypeLabelActive : null
                                    ]}>
                                        {option.label}
                                    </Text>
                                </View>
                                <Text style={styles.deliveryTypeDescription}>{option.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    {renderEstimateFare()}
                </View>
            );
        }
        if (service === 'truck') {
            if (!selectedTruckVehicle) {
                return renderTruckVehicleSelection();
            }
            
            return (
                <View>
                    {/* Selected Vehicle Info */}
                    <View style={styles.selectedVehicleCard}>
                        <View style={styles.selectedVehicleHeader}>
                            <Text style={styles.selectedVehicleIcon}>{selectedTruckVehicle.icon}</Text>
                            <View style={styles.selectedVehicleInfo}>
                                <Text style={styles.selectedVehicleName}>{selectedTruckVehicle.name}</Text>
                                <Text style={styles.selectedVehicleCapacity}>
                                    Capacity: {selectedTruckVehicle.capacityPayloadKg}kg | Size: {selectedTruckVehicle.vehicleLengthFt}' × {selectedTruckVehicle.vehicleWidthFt}'
                                </Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.changeVehicleBtn}
                                onPress={() => setSelectedTruckVehicle(null)}
                            >
                                <Text style={styles.changeVehicleBtnText}>Change</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    {/* Sender details */}
                    <Text style={styles.sectionTitle}>Sender Details</Text>
                    <Text style={styles.fieldLabel}>Name</Text>
                    <TextInput style={styles.input} placeholder="Sender Name" value={truckForm.senderName} onChangeText={(t) => setTruckForm((s) => ({ ...s, senderName: t }))} />
                    <Text style={styles.fieldLabel}>Phone</Text>
                    <TextInput style={styles.input} placeholder="Sender Phone" keyboardType="phone-pad" value={truckForm.senderPhone} onChangeText={(t) => setTruckForm((s) => ({ ...s, senderPhone: t }))} />
                    
                    {/* Receiver details */}
                    <Text style={styles.sectionTitle}>Receiver Details</Text>
                    <Text style={styles.fieldLabel}>Name</Text>
                    <TextInput style={styles.input} placeholder="Receiver Name" value={truckForm.receiverName} onChangeText={(t) => setTruckForm((s) => ({ ...s, receiverName: t }))} />
                    <Text style={styles.fieldLabel}>Phone</Text>
                    <TextInput style={styles.input} placeholder="Receiver Phone" keyboardType="phone-pad" value={truckForm.receiverPhone} onChangeText={(t) => setTruckForm((s) => ({ ...s, receiverPhone: t }))} />
                    
                    {/* Package details */}
                    <Text style={styles.sectionTitle}>Cargo Details</Text>
                    <Text style={styles.fieldLabel}>Type</Text>
                    <TextInput style={styles.input} placeholder="Type (e.g., Household, Furniture)" value={truckForm.pkgType} onChangeText={(t) => setTruckForm((s) => ({ ...s, pkgType: t }))} />
                    <Text style={styles.fieldLabel}>Weight (kg)</Text>
                    <TextInput style={styles.input} placeholder={`Weight (kg) - Max: ${selectedTruckVehicle.capacityPayloadKg}kg`} keyboardType="numeric" value={truckForm.weight} onChangeText={(t) => setTruckForm((s) => ({ ...s, weight: t }))} />
                    <Text style={styles.fieldLabel}>Dimensions</Text>
                    <TextInput style={styles.input} placeholder="Dimensions (optional)" value={truckForm.dimensions} onChangeText={(t) => setTruckForm((s) => ({ ...s, dimensions: t }))} />
                    <Text style={styles.fieldLabel}>Description</Text>
                    <TextInput style={[styles.input, styles.multiline]} placeholder="Description (optional)" multiline value={truckForm.description} onChangeText={(t) => setTruckForm((s) => ({ ...s, description: t }))} />
                    
                    {renderEstimateFare()}
                </View>
            );
        }
        if (service === 'bike' || service === 'cab') {
            return (
                <View>
                    <Text style={styles.meta}>No extra details required.</Text>
                    
                    {renderEstimateFare()}
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
                    <Text style={styles.fieldLabel}>Extra Items</Text>
                    <TextInput style={[styles.input, styles.multiline]} placeholder="Extra Items (optional)" value={packersForm.extras} onChangeText={(t) => setPackersForm((s) => ({ ...s, extras: t }))} multiline />
                </View>
            );
        }
        return null;
    };

    const renderReview = () => {
        const { pickup, delivery } = contextRef.current || {};
        const renderRow = (label, value) => (
            <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{label}</Text>
                <Text style={styles.reviewValue}>{value || '-'}</Text>
            </View>
        );

        return (
            <View>
                {/* Locations */}
                <View style={styles.reviewBox}>
                    <Text style={styles.sectionTitle}>Locations</Text>
                    {renderRow('Pickup', pickup?.address)}
                    <View style={styles.divider} />
                    {renderRow('Delivery', delivery?.address)}
                </View>

                {service === 'local_parcel' && (
                    <View style={styles.reviewBox}>
                        <Text style={styles.sectionTitle}>Package Details</Text>
                        {renderRow('Name', parcelForm.name)}
                        <View style={styles.divider} />
                        {renderRow('Size', parcelForm.size)}
                        <View style={styles.divider} />
                        {renderRow('Weight (kg)', parcelForm.weight)}
                        <View style={styles.divider} />
                        {renderRow('Declared Value (₹)', parcelForm.value)}
                        <View style={styles.divider} />
                        {renderRow('Description', parcelForm.description)}
                    </View>
                )}

                {service === 'local_parcel' && (
                    <View style={styles.reviewBox}>
                        <Text style={styles.sectionTitle}>Receiver Details</Text>
                        {renderRow('Name', parcelForm.receiverName)}
                        <View style={styles.divider} />
                        {renderRow('Contact', parcelForm.receiverContact)}
                    </View>
                )}

                {service === 'all_india_parcel' && (
                    <View style={styles.reviewBox}>
                        <Text style={styles.sectionTitle}>Package Details</Text>
                        {renderRow('Type', allIndiaForm.pkgType)}
                        <View style={styles.divider} />
                        {renderRow('Weight (kg)', allIndiaForm.weight)}
                        <View style={styles.divider} />
                        {renderRow('Dimensions', allIndiaForm.dimensions)}
                        <View style={styles.divider} />
                        {renderRow('Length (cm)', allIndiaForm.length)}
                        <View style={styles.divider} />
                        {renderRow('Width (cm)', allIndiaForm.width)}
                        <View style={styles.divider} />
                        {renderRow('Height (cm)', allIndiaForm.height)}
                        <View style={styles.divider} />
                        {renderRow('Description', allIndiaForm.description)}
                    </View>
                )}

                {service === 'all_india_parcel' && (
                    <View style={styles.reviewBox}>
                        <Text style={styles.sectionTitle}>Receiver Details</Text>
                        {renderRow('Name', allIndiaForm.receiverName)}
                        <View style={styles.divider} />
                        {renderRow('Phone', allIndiaForm.receiverPhone)}
                    </View>
                )}

                {service === 'all_india_parcel' && (
                    <View style={styles.reviewBox}>
                        <Text style={styles.sectionTitle}>Delivery Details</Text>
                        {renderRow('Delivery Type', allIndiaForm.typeOfDelivery === 'standard' ? 'Standard Delivery' : 'Express Delivery')}
                        <View style={styles.divider} />
                        {renderRow('Estimated Time', allIndiaForm.typeOfDelivery === 'standard' ? '3-5 days' : '1-2 days')}
                    </View>
                )}

                {(service === 'bike' || service === 'cab') && (
                    <View style={styles.reviewBox}>
                        <Text style={styles.sectionTitle}>Ride Details</Text>
                        {renderRow('Vehicle Type', service === 'bike' ? 'Bike Ride' : 'Cab Booking')}
                    </View>
                )}

                {service === 'truck' && selectedTruckVehicle && (
                    <View style={styles.reviewBox}>
                        <Text style={styles.sectionTitle}>Selected Vehicle</Text>
                        <View style={styles.selectedVehicleReview}>
                            <Text style={styles.selectedVehicleIconLarge}>{selectedTruckVehicle.icon}</Text>
                            <View style={styles.selectedVehicleDetails}>
                                <Text style={styles.selectedVehicleNameLarge}>{selectedTruckVehicle.name}</Text>
                                <Text style={styles.selectedVehicleCapacityLarge}>
                                    Capacity: {selectedTruckVehicle.capacityPayloadKg}kg | Size: {selectedTruckVehicle.vehicleLengthFt}' × {selectedTruckVehicle.vehicleWidthFt}'
                                </Text>
                                <Text style={styles.selectedVehicleFareLarge}>
                                    Base: ₹{selectedTruckVehicle.baseFare} | Per Km: ₹{selectedTruckVehicle.perKmRate}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {service === 'truck' && (
                    <View style={styles.reviewBox}>
                        <Text style={styles.sectionTitle}>Sender Details</Text>
                        {renderRow('Name', truckForm.senderName)}
                        <View style={styles.divider} />
                        {renderRow('Phone', truckForm.senderPhone)}
                    </View>
                )}

                {service === 'truck' && (
                    <View style={styles.reviewBox}>
                        <Text style={styles.sectionTitle}>Receiver Details</Text>
                        {renderRow('Name', truckForm.receiverName)}
                        <View style={styles.divider} />
                        {renderRow('Phone', truckForm.receiverPhone)}
                    </View>
                )}

                {service === 'truck' && (
                    <View style={styles.reviewBox}>
                        <Text style={styles.sectionTitle}>Cargo Details</Text>
                        {renderRow('Type', truckForm.pkgType)}
                        <View style={styles.divider} />
                        {renderRow('Weight (kg)', truckForm.weight)}
                        <View style={styles.divider} />
                        {renderRow('Dimensions', truckForm.dimensions)}
                        <View style={styles.divider} />
                        {renderRow('Description', truckForm.description)}
                    </View>
                )}

                {service === 'packers' && (
                    <View style={styles.reviewBox}>
                        <Text style={styles.sectionTitle}>Packers & Movers</Text>
                        {renderRow('House', packersForm.house)}
                        <View style={styles.divider} />
                        {renderRow('Extras', packersForm.extras)}
                    </View>
                )}

                {estimatedFare && (
                    <View style={styles.reviewBox}>
                        <Text style={styles.sectionTitle}>Fare Estimate</Text>
                        <View style={styles.fareReviewDisplay}>
                            <View style={styles.fareReviewHeader}>
                                <Ionicons name="cash-outline" size={24} color={Colors.primary} />
                                <Text style={styles.fareReviewLabel}>Estimated Fare</Text>
                            </View>
                            <Text style={styles.fareReviewAmount}>₹{estimatedFare.amount.toFixed(2)}</Text>
                            <Text style={styles.fareReviewService}>
                                Service: {service === 'local_parcel' ? 'Local Parcel' : 
                                         service === 'all_india_parcel' ? 'All India Parcel' :
                                         service === 'bike' ? 'Bike Ride' :
                                         service === 'cab' ? 'Cab Booking' :
                                         service === 'truck' ? 'Truck Booking' :
                                         service === 'packers' ? 'Packers & Movers' : service}
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        );
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
                    ) : step === 1 ? (
                        <View>
                            <Text style={styles.title}>Enter Details</Text>
                            {renderDetails()}
                            <View style={styles.rowBetween}>
                                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(0)}>
                                    <Text style={styles.secondaryBtnTxt}>Back</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(2)}>
                                    <Text style={styles.primaryBtnTxt}>Review</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View>
                            <Text style={styles.title}>Review</Text>
                            {renderReview()}
                            <View style={styles.rowBetween}>
                                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(1)}>
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
    sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 6 },
    fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.mutedText, marginBottom: 6, marginLeft: 2 },
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
    timelineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingHorizontal: Spacing.md },
    timelineStep: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 },
    timelineLabels: { flexDirection: 'row', alignItems: 'center' },
    labelItem: { flex: 1, alignItems: 'center' },
    timelineItem: { flexDirection: 'row', alignItems: 'center' },
    bullet: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.border },
    bulletActive: { backgroundColor: Colors.primary },
    connector: { width: 24, height: 2, backgroundColor: Colors.border, marginHorizontal: 8 },
    connectorFlex: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 8 },
    connectorHalf: { flex: 1, height: 2, backgroundColor: Colors.border },
    connectorHalfEmpty: { flex: 1, height: 2, backgroundColor: 'transparent' },
    connectorActive: { backgroundColor: Colors.primary },
    bulletLabel: { color: Colors.mutedText, textAlign: 'center' },
    bulletLabelActive: { color: Colors.text, fontWeight: '700' },
    reviewBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md,
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
    reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6 },
    reviewLabel: { color: Colors.mutedText },
    reviewValue: { color: Colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
    divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
    // Estimate Fare Styles
    estimateFareContainer: { marginTop: Spacing.md, marginBottom: Spacing.sm },
    estimateFareBtn: { 
        backgroundColor: Colors.primary, 
        borderRadius: Radius.lg, 
        paddingVertical: 14, 
        paddingHorizontal: 20,
        marginBottom: Spacing.md,
        shadowColor: Colors.shadow, 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.15, 
        shadowRadius: 8,
        elevation: 4
    },
    estimateFareBtnDisabled: { 
        backgroundColor: Colors.border, 
        shadowOpacity: 0.05 
    },
    estimateFareBtnContent: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 8 
    },
    estimateFareBtnText: { 
        color: '#fff', 
        fontWeight: '700', 
        fontSize: 16 
    },
    fareDisplay: { 
        backgroundColor: '#f8f9ff', 
        borderWidth: 1, 
        borderColor: Colors.primary, 
        borderRadius: Radius.md, 
        padding: Spacing.md,
        marginTop: Spacing.sm 
    },
    fareDisplayHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 8 
    },
    fareLabel: { 
        color: Colors.primary, 
        fontWeight: '700', 
        fontSize: 14 
    },
    fareAmount: { 
        color: Colors.text, 
        fontWeight: '800', 
        fontSize: 24, 
        marginBottom: 4 
    },
    fareNote: { 
        color: Colors.mutedText, 
        fontSize: 12, 
        fontStyle: 'italic' 
    },
    // Review Page Fare Styles
    fareReviewDisplay: { 
        alignItems: 'center', 
        padding: Spacing.md 
    },
    fareReviewHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 12 
    },
    fareReviewLabel: { 
        color: Colors.primary, 
        fontWeight: '700', 
        fontSize: 16 
    },
    fareReviewAmount: { 
        color: Colors.text, 
        fontWeight: '800', 
        fontSize: 32, 
        marginBottom: 8 
    },
    fareReviewService: { 
        color: Colors.mutedText, 
        fontSize: 14, 
        textAlign: 'center' 
    },
    // Truck Vehicle Selection Styles
    subtitle: { 
        color: Colors.mutedText, 
        fontSize: 14, 
        marginBottom: Spacing.lg, 
        textAlign: 'center' 
    },
    vehicleGrid: { 
        gap: Spacing.md, 
        marginBottom: Spacing.lg 
    },
    vehicleCard: { 
        backgroundColor: '#fff', 
        borderRadius: Radius.lg, 
        padding: Spacing.lg, 
        borderWidth: 2, 
        borderColor: Colors.border,
        shadowColor: Colors.shadow, 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.08, 
        shadowRadius: 8,
        elevation: 3
    },
    vehicleCardActive: { 
        borderColor: Colors.primary, 
        backgroundColor: '#f8f9ff',
        shadowOpacity: 0.15,
        elevation: 6
    },
    vehicleCardHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: Spacing.sm 
    },
    vehicleIcon: { 
        fontSize: 32, 
        marginRight: Spacing.md 
    },
    vehicleInfo: { 
        flex: 1 
    },
    vehicleName: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: Colors.text, 
        marginBottom: 2 
    },
    vehicleNameActive: { 
        color: Colors.primary 
    },
    vehicleCapacity: { 
        fontSize: 12, 
        color: Colors.mutedText, 
        fontWeight: '600' 
    },
    vehicleDescription: { 
        fontSize: 13, 
        color: Colors.text, 
        lineHeight: 18, 
        marginBottom: Spacing.md 
    },
    vehicleSpecs: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: Spacing.md,
        backgroundColor: '#f8f9fa',
        borderRadius: Radius.md,
        padding: Spacing.sm
    },
    specItem: { 
        alignItems: 'center', 
        flex: 1 
    },
    specLabel: { 
        fontSize: 11, 
        color: Colors.mutedText, 
        fontWeight: '600', 
        marginBottom: 2 
    },
    specValue: { 
        fontSize: 12, 
        color: Colors.text, 
        fontWeight: '700' 
    },
    vehicleUseCases: { 
        marginTop: Spacing.sm 
    },
    useCaseLabel: { 
        fontSize: 12, 
        color: Colors.mutedText, 
        fontWeight: '600', 
        marginBottom: 6 
    },
    useCaseTags: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: 6 
    },
    useCaseTag: { 
        backgroundColor: Colors.primary, 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 12 
    },
    useCaseTagText: { 
        color: '#fff', 
        fontSize: 11, 
        fontWeight: '600' 
    },
    // Selected Vehicle Styles
    selectedVehicleCard: { 
        backgroundColor: '#f8f9ff', 
        borderRadius: Radius.lg, 
        padding: Spacing.lg, 
        marginBottom: Spacing.lg, 
        borderWidth: 1, 
        borderColor: Colors.primary 
    },
    selectedVehicleHeader: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    selectedVehicleIcon: { 
        fontSize: 24, 
        marginRight: Spacing.md 
    },
    selectedVehicleInfo: { 
        flex: 1 
    },
    selectedVehicleName: { 
        fontSize: 14, 
        fontWeight: '700', 
        color: Colors.primary, 
        marginBottom: 2 
    },
    selectedVehicleCapacity: { 
        fontSize: 12, 
        color: Colors.mutedText 
    },
    changeVehicleBtn: { 
        backgroundColor: Colors.primary, 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: Radius.md 
    },
    changeVehicleBtnText: { 
        color: '#fff', 
        fontSize: 12, 
        fontWeight: '600' 
    },
    // Review Page Vehicle Styles
    selectedVehicleReview: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: Spacing.md 
    },
    selectedVehicleIconLarge: { 
        fontSize: 40, 
        marginRight: Spacing.lg 
    },
    selectedVehicleDetails: { 
        flex: 1 
    },
    selectedVehicleNameLarge: { 
        fontSize: 16, 
        fontWeight: '800', 
        color: Colors.text, 
        marginBottom: 4 
    },
    selectedVehicleCapacityLarge: { 
        fontSize: 13, 
        color: Colors.mutedText, 
        marginBottom: 2 
    },
    selectedVehicleFareLarge: { 
        fontSize: 13, 
        color: Colors.primary, 
        fontWeight: '600' 
    },
    // Delivery Type Selection Styles
    deliveryTypeContainer: { 
        flexDirection: 'row', 
        gap: Spacing.sm,
        marginBottom: Spacing.md 
    },
    deliveryTypeCard: { 
        flex: 1,
        backgroundColor: '#fff', 
        borderRadius: Radius.md, 
        padding: Spacing.sm, 
        borderWidth: 2, 
        borderColor: Colors.border,
        shadowColor: Colors.shadow, 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.06, 
        shadowRadius: 4,
        elevation: 2,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 60
    },
    deliveryTypeCardActive: { 
        borderColor: Colors.primary, 
        backgroundColor: '#f8f9ff',
        shadowOpacity: 0.12,
        elevation: 4
    },
    deliveryTypeHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 4,
        justifyContent: 'center'
    },
    deliveryTypeRadio: { 
        width: 16, 
        height: 16, 
        borderRadius: 8, 
        borderWidth: 2, 
        borderColor: Colors.border, 
        marginRight: 6,
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    deliveryTypeRadioActive: { 
        borderColor: Colors.primary 
    },
    deliveryTypeRadioInner: { 
        width: 8, 
        height: 8, 
        borderRadius: 4, 
        backgroundColor: Colors.primary 
    },
    deliveryTypeLabel: { 
        fontSize: 13, 
        fontWeight: '600', 
        color: Colors.text 
    },
    deliveryTypeLabelActive: { 
        color: Colors.primary, 
        fontWeight: '700' 
    },
    deliveryTypeDescription: { 
        fontSize: 11, 
        color: Colors.mutedText, 
        textAlign: 'center',
        lineHeight: 14 
    },
});

export default ServiceFlowDrawer;


