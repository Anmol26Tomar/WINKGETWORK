import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Easing, ScrollView, TextInput, Alert } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/colors';
import LoadingOverlay from './LoadingOverlay';
import { estimateFare as estimateParcelFare, createParcel } from '../services/parcelService';
import { estimatePackers, createPackersBooking } from '../services/packersService';
import { estimateFareKm, haversineKm } from '../utils/fareCalculator';
import { estimateTransport, createTransport } from '../services/transportService';
import { requestPackersMovers } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const SERVICES = [
    { key: 'local_parcel', label: 'Local Parcel', icon: 'cube-outline' },
    { key: 'truck', label: 'Truck Booking', icon: 'bus-outline' },
    { key: 'bike', label: 'Bike Ride', icon: 'bicycle-outline' },
    { key: 'cab', label: 'Cab Booking', icon: 'car-outline' },
    { key: 'all_india_parcel', label: 'All India Parcel', icon: 'earth-outline' },
    { key: 'packers', label: 'Packers & Movers', icon: 'home-outline' },
];

// Package size options
const PACKAGE_SIZES = [
    { key: 'XS', label: 'XS', description: 'Extra Small', icon: 'ellipse-outline' },
    { key: 'S', label: 'S', description: 'Small', icon: 'ellipse-outline' },
    { key: 'M', label: 'M', description: 'Medium', icon: 'ellipse-outline' },
    { key: 'L', label: 'L', description: 'Large', icon: 'ellipse-outline' },
    { key: 'XL', label: 'XL', description: 'Extra Large', icon: 'ellipse-outline' },
    { key: 'XXL', label: 'XXL', description: 'Extra Extra Large', icon: 'ellipse-outline' },
];

// Package category options
const PACKAGE_CATEGORIES = [
    { key: 'Electronics', label: 'Electronics', icon: 'phone-portrait-outline' },
    { key: 'Clothing', label: 'Clothing', icon: 'shirt-outline' },
    { key: 'Furniture', label: 'Furniture', icon: 'bed-outline' },
    { key: 'Documents', label: 'Documents', icon: 'document-outline' },
    { key: 'Groceries', label: 'Groceries', icon: 'basket-outline' },
    { key: 'Fragile Items', label: 'Fragile Items', icon: 'warning-outline' },
    { key: 'Other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

// Package content options
const PACKAGE_CONTENTS = [
    { key: 'Home Items', label: 'Home Items', icon: 'home-outline' },
    { key: 'Office Items', label: 'Office Items', icon: 'business-outline' },
    { key: 'Appliances', label: 'Appliances', icon: 'tv-outline' },
    { key: 'Decor', label: 'Decor', icon: 'flower-outline' },
    { key: 'Books', label: 'Books', icon: 'book-outline' },
    { key: 'Personal Belongings', label: 'Personal Belongings', icon: 'person-outline' },
    { key: 'Other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

// Container type options
const CONTAINER_TYPES = [
    { key: 'Pouch', label: 'Pouch', icon: 'bag-outline' },
    { key: 'Box', label: 'Box', icon: 'cube-outline' },
    { key: 'Carton', label: 'Carton', icon: 'archive-outline' },
    { key: 'Wooden Crate', label: 'Wooden Crate', icon: 'construct-outline' },
    { key: 'Bag', label: 'Bag', icon: 'bag-handle-outline' },
    { key: 'Custom', label: 'Custom', icon: 'settings-outline' },
];

const HOUSEHOLD_ITEMS = [
    { id: 'bed', name: 'Bed', icon: 'bed-outline', category: 'furniture' },
    { id: 'sofa', name: 'Sofa', icon: 'couch-outline', category: 'furniture' },
    { id: 'chair', name: 'Chair', icon: 'chair-outline', category: 'furniture' },
    { id: 'table', name: 'Table', icon: 'table-outline', category: 'furniture' },
    { id: 'dining_set', name: 'Dining Set', icon: 'restaurant-outline', category: 'furniture' },
    { id: 'wardrobe', name: 'Wardrobe', icon: 'shirt-outline', category: 'furniture' },
    { id: 'fridge', name: 'Refrigerator', icon: 'snow-outline', category: 'appliances' },
    { id: 'tv', name: 'TV', icon: 'tv-outline', category: 'appliances' },
    { id: 'washing_machine', name: 'Washing Machine', icon: 'water-outline', category: 'appliances' },
    { id: 'ac', name: 'Air Conditioner', icon: 'thermometer-outline', category: 'appliances' },
    { id: 'microwave', name: 'Microwave', icon: 'radio-outline', category: 'appliances' },
    { id: 'cartons', name: 'Cartons', icon: 'cube-outline', category: 'packaging' },
    { id: 'packets', name: 'Packets', icon: 'bag-outline', category: 'packaging' },
    { id: 'pouches', name: 'Pouches', icon: 'wallet-outline', category: 'packaging' },
    { id: 'bags', name: 'Bags', icon: 'bag-handle-outline', category: 'packaging' },
    { id: 'boxes', name: 'Boxes', icon: 'archive-outline', category: 'packaging' },
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
        useCases: ["Small parcel delivery", "Retail supply", "Local vendors"],
        color: "#0D9488", // Teal
        gradient: ["#0D9488", "#14B8A6"]
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
        useCases: ["Furniture shifting", "Small warehouse logistics", "Business deliveries"],
        color: "#1E3A8A", // Royal Blue
        gradient: ["#1E3A8A", "#3B82F6"]
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
        useCases: ["Construction material", "Industrial supply", "Bulk retail movement"],
        color: "#FBBF24", // Amber
        gradient: ["#FBBF24", "#F59E0B"]
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
        useCases: ["Warehouse distribution", "Bulk delivery", "Intercity logistics"],
        color: "#7C3AED", // Purple
        gradient: ["#7C3AED", "#A855F7"]
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
        useCases: ["Interstate logistics", "Bulk cargo", "Manufacturing supply chain"],
        color: "#DC2626", // Red
        gradient: ["#DC2626", "#EF4444"]
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
    
    // Packers & Movers specific state
    const [packersStep, setPackersStep] = useState(0); // 0: receiver info, 1: item selection, 2: review
    const [selectedItems, setSelectedItems] = useState({});
    const [itemSearchQuery, setItemSearchQuery] = useState('');

    const [parcelForm, setParcelForm] = useState({
        name: '',
        size: '',
        weight: '1',
        description: '',
        value: '',
        receiverName: '',
        receiverContact: '',
        containerType: '',
        contentTypes: [], // Array to store multiple content selections
    });

    // Drawer states for dropdown selectors
    const [drawerStates, setDrawerStates] = useState({
        categoryOpen: false,
        sizeOpen: false,
        containerOpen: false,
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
        contentTypes: [], // Array for multiple content selections
        containerType: '',
        size: '',
    });

    const [transportForm, setTransportForm] = useState({ vehicleSubType: 'mini_truck' });
    const [packersForm, setPackersForm] = useState({ 
        receiverName: '',
        receiverPhone: '',
        receiverAddress: '',
        additionalNotes: ''
    });
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
        contentTypes: [], // Array for multiple content selections
        containerType: '',
        size: '',
    });

    // Drawer states for truck booking
    const [truckDrawerStates, setTruckDrawerStates] = useState({
        categoryOpen: false,
        sizeOpen: false,
        containerOpen: false,
        contentOpen: false,
    });

    // Drawer states for All India Parcel
    const [allIndiaDrawerStates, setAllIndiaDrawerStates] = useState({
        categoryOpen: false,
        sizeOpen: false,
        containerOpen: false,
        contentOpen: false,
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
        setPackersStep(0);
        setSelectedItems({});
        setItemSearchQuery('');
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

    // Packers & Movers helper functions
    const updateItemQuantity = (itemId, change) => {
        setSelectedItems(prev => {
            const currentQty = prev[itemId] || 0;
            const newQty = Math.max(0, currentQty + change);
            if (newQty === 0) {
                const { [itemId]: removed, ...rest } = prev;
                return rest;
            }
            return { ...prev, [itemId]: newQty };
        });
    };

    const getFilteredItems = () => {
        if (!itemSearchQuery) return HOUSEHOLD_ITEMS;
        return HOUSEHOLD_ITEMS.filter(item => 
            item.name.toLowerCase().includes(itemSearchQuery.toLowerCase())
        );
    };

    const getTotalSelectedItems = () => {
        return Object.values(selectedItems).reduce((sum, qty) => sum + qty, 0);
    };

    // Helper function to handle content type selection
    const toggleContentType = (contentKey) => {
        setParcelForm((prev) => {
            const currentTypes = prev.contentTypes || [];
            const isSelected = currentTypes.includes(contentKey);
            
            if (isSelected) {
                // Remove from selection
                return {
                    ...prev,
                    contentTypes: currentTypes.filter(type => type !== contentKey)
                };
            } else {
                // Add to selection
                return {
                    ...prev,
                    contentTypes: [...currentTypes, contentKey]
                };
            }
        });
    };

    // Helper functions for drawer management
    const toggleDrawer = (drawerType) => {
        setDrawerStates(prev => ({
            ...prev,
            [drawerType]: !prev[drawerType]
        }));
    };

    const closeAllDrawers = () => {
        setDrawerStates({
            categoryOpen: false,
            sizeOpen: false,
            containerOpen: false,
        });
    };

    const selectCategory = (categoryKey) => {
        setParcelForm(prev => ({ ...prev, name: categoryKey }));
        toggleDrawer('categoryOpen');
    };

    const selectSize = (sizeKey) => {
        setParcelForm(prev => ({ ...prev, size: sizeKey }));
        toggleDrawer('sizeOpen');
    };

    const selectContainer = (containerKey) => {
        setParcelForm(prev => ({ ...prev, containerType: containerKey }));
        toggleDrawer('containerOpen');
    };

    // Truck drawer management functions
    const toggleTruckDrawer = (drawerType) => {
        setTruckDrawerStates(prev => ({
            ...prev,
            [drawerType]: !prev[drawerType]
        }));
    };

    const closeAllTruckDrawers = () => {
        setTruckDrawerStates({
            categoryOpen: false,
            sizeOpen: false,
            containerOpen: false,
            contentOpen: false,
        });
    };

    const selectTruckCategory = (categoryKey) => {
        setTruckForm(prev => ({ ...prev, pkgType: categoryKey }));
        toggleTruckDrawer('categoryOpen');
    };

    const selectTruckSize = (sizeKey) => {
        setTruckForm(prev => ({ ...prev, size: sizeKey }));
        toggleTruckDrawer('sizeOpen');
    };

    const selectTruckContainer = (containerKey) => {
        setTruckForm(prev => ({ ...prev, containerType: containerKey }));
        toggleTruckDrawer('containerOpen');
    };

    const toggleTruckContentType = (contentKey) => {
        setTruckForm((prev) => {
            const currentTypes = prev.contentTypes || [];
            const isSelected = currentTypes.includes(contentKey);
            
            if (isSelected) {
                return {
                    ...prev,
                    contentTypes: currentTypes.filter(type => type !== contentKey)
                };
            } else {
                return {
                    ...prev,
                    contentTypes: [...currentTypes, contentKey]
                };
            }
        });
    };

    // All India Parcel drawer management functions
    const toggleAllIndiaDrawer = (drawerType) => {
        setAllIndiaDrawerStates(prev => ({
            ...prev,
            [drawerType]: !prev[drawerType]
        }));
    };

    const closeAllAllIndiaDrawers = () => {
        setAllIndiaDrawerStates({
            categoryOpen: false,
            sizeOpen: false,
            containerOpen: false,
            contentOpen: false,
        });
    };

    const selectAllIndiaCategory = (categoryKey) => {
        setAllIndiaForm(prev => ({ ...prev, pkgType: categoryKey }));
        toggleAllIndiaDrawer('categoryOpen');
    };

    const selectAllIndiaSize = (sizeKey) => {
        setAllIndiaForm(prev => ({ ...prev, size: sizeKey }));
        toggleAllIndiaDrawer('sizeOpen');
    };

    const selectAllIndiaContainer = (containerKey) => {
        setAllIndiaForm(prev => ({ ...prev, containerType: containerKey }));
        toggleAllIndiaDrawer('containerOpen');
    };

    const toggleAllIndiaContentType = (contentKey) => {
        setAllIndiaForm((prev) => {
            const currentTypes = prev.contentTypes || [];
            const isSelected = currentTypes.includes(contentKey);
            
            if (isSelected) {
                return {
                    ...prev,
                    contentTypes: currentTypes.filter(type => type !== contentKey)
                };
            } else {
                return {
                    ...prev,
                    contentTypes: [...currentTypes, contentKey]
                };
            }
        });
    };

    // Reusable drawer component
    const renderDrawerSelector = (title, isOpen, onToggle, options, selectedValue, onSelect, iconName) => {
        const selectedOption = options.find(opt => opt.key === selectedValue);
        
        return (
            <View>
                <Text style={styles.fieldLabel}>{title}</Text>
                <TouchableOpacity 
                    style={styles.drawerSelector}
                    onPress={onToggle}
                >
                    <View style={styles.drawerSelectorContent}>
                        <View style={styles.drawerSelectorLeft}>
                            <Ionicons 
                                name={iconName} 
                                size={20} 
                                color={selectedValue ? Colors.primary : Colors.mutedText} 
                            />
                            <Text style={[
                                styles.drawerSelectorText,
                                selectedValue ? styles.drawerSelectorTextSelected : styles.drawerSelectorTextPlaceholder
                            ]}>
                                {selectedOption ? selectedOption.label : `Select ${title.toLowerCase()}`}
                            </Text>
                        </View>
                        <Ionicons 
                            name={isOpen ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color={Colors.mutedText} 
                        />
                    </View>
                </TouchableOpacity>

                {isOpen && (
                    <View style={styles.drawerDropdown}>
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.key}
                                style={[
                                    styles.drawerOption,
                                    selectedValue === option.key ? styles.drawerOptionSelected : null
                                ]}
                                onPress={() => onSelect(option.key)}
                            >
                                <View style={styles.drawerOptionContent}>
                                    <Ionicons 
                                        name={option.icon} 
                                        size={20} 
                                        color={selectedValue === option.key ? '#fff' : Colors.primary} 
                                    />
                                    <Text style={[
                                        styles.drawerOptionText,
                                        selectedValue === option.key ? styles.drawerOptionTextSelected : null
                                    ]}>
                                        {option.label}
                                    </Text>
                                </View>
                                {selectedValue === option.key && (
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        );
    };

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
                // Use dedicated Packers estimate API
                const res = await estimatePackers({ pickup, delivery, selectedItems });
                fare = res.fare;
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
                <View style={styles.enhancedHeader}>
                    <Text style={styles.enhancedTitle}>Choose Your Truck</Text>
                    <Text style={styles.enhancedSubtitle}>Select the perfect vehicle for your cargo needs</Text>
                </View>
                
                <View style={styles.enhancedVehicleGrid}>
                    {TRUCK_VEHICLES.map((vehicle) => (
                        <TouchableOpacity 
                            key={vehicle.id}
                            style={[
                                styles.enhancedVehicleCard, 
                                selectedTruckVehicle?.id === vehicle.id ? styles.enhancedVehicleCardActive : null
                            ]}
                            onPress={() => setSelectedTruckVehicle(vehicle)}
                        >
                            <View style={[
                                styles.enhancedVehicleIconContainer,
                                { backgroundColor: selectedTruckVehicle?.id === vehicle.id ? vehicle.color : '#f8f9fa' }
                            ]}>
                                <Text style={styles.enhancedVehicleIcon}>{vehicle.icon}</Text>
                            </View>
                            
                            <View style={styles.enhancedVehicleContent}>
                                <Text style={[
                                    styles.enhancedVehicleName,
                                    selectedTruckVehicle?.id === vehicle.id ? styles.enhancedVehicleNameActive : null
                                ]}>
                                    {vehicle.name}
                                </Text>
                                
                                <Text style={styles.enhancedVehicleDescription}>{vehicle.description}</Text>
                                
                                <View style={styles.enhancedVehicleSpecs}>
                                    <View style={styles.enhancedSpecItem}>
                                        <Ionicons name="scale-outline" size={16} color={Colors.mutedText} />
                                        <Text style={styles.enhancedSpecText}>{vehicle.capacityPayloadKg}kg</Text>
                                    </View>
                                    <View style={styles.enhancedSpecItem}>
                                        <Ionicons name="resize-outline" size={16} color={Colors.mutedText} />
                                        <Text style={styles.enhancedSpecText}>{vehicle.vehicleLengthFt}' × {vehicle.vehicleWidthFt}'</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.enhancedVehiclePricing}>
                                    <View style={styles.enhancedPriceItem}>
                                        <Text style={styles.enhancedPriceLabel}>Base</Text>
                                        <Text style={styles.enhancedPriceValue}>₹{vehicle.baseFare}</Text>
                                    </View>
                                    <View style={styles.enhancedPriceItem}>
                                        <Text style={styles.enhancedPriceLabel}>Per Km</Text>
                                        <Text style={styles.enhancedPriceValue}>₹{vehicle.perKmRate}</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.enhancedUseCases}>
                                    {vehicle.useCases.slice(0, 2).map((useCase, index) => (
                                        <View key={index} style={[
                                            styles.enhancedUseCaseTag,
                                            { backgroundColor: selectedTruckVehicle?.id === vehicle.id ? 'rgba(255,255,255,0.2)' : '#f0f0f0' }
                                        ]}>
                                            <Text style={[
                                                styles.enhancedUseCaseText,
                                                { color: selectedTruckVehicle?.id === vehicle.id ? '#fff' : Colors.mutedText }
                                            ]}>
                                                {useCase}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                            
                            {selectedTruckVehicle?.id === vehicle.id && (
                                <View style={styles.enhancedSelectedIndicator}>
                                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
                
                <TouchableOpacity 
                    style={[
                        styles.enhancedPrimaryBtn, 
                        !selectedTruckVehicle ? styles.enhancedPrimaryBtnDisabled : null
                    ]} 
                    disabled={!selectedTruckVehicle} 
                    onPress={() => setStep(1)}
                >
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                    <Text style={styles.enhancedPrimaryBtnText}>Continue with {selectedTruckVehicle?.name}</Text>
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
                    Alert.alert('Missing fields', 'Please fill all required fields'); setLoading(false); return;
                }
                if (isNaN(weightNum) || weightNum <= 0 || weightNum > 50) {
                    Alert.alert('Invalid weight', 'Weight must be between 0 and 50 kg.'); setLoading(false); return;
                }
                if (!parcelForm.contentTypes || parcelForm.contentTypes.length === 0) {
                    Alert.alert('Missing content', 'Please select at least one content type'); setLoading(false); return;
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
                        description: parcelForm.contentTypes?.join(', ') || '', // Convert array to comma-separated string
                        contentTypes: parcelForm.contentTypes || [], // Keep as array for backend
                        value: parseFloat(parcelForm.value || '0'),
                        containerType: parcelForm.containerType,
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
                
                if (!allIndiaForm.contentTypes || allIndiaForm.contentTypes.length === 0) {
                    Alert.alert('Missing content', 'Please select at least one content type'); setLoading(false); return;
                }
                const km = haversineKm(pickup, delivery);
                const kmFare = estimateFareKm(km, 'truck', allIndiaForm.typeOfDelivery);
                const payload = {
                    pickup: { lat: pickup.lat, lng: pickup.lng, address: pickup.address },
                    delivery: { lat: delivery.lat, lng: delivery.lng, address: delivery.address },
                    package: { 
                        name: allIndiaForm.pkgType, 
                        size: allIndiaForm.size || allIndiaForm.dimensions || 'standard', 
                        weight: weightNum, 
                        description: allIndiaForm.contentTypes?.join(', ') || '',
                        contentTypes: allIndiaForm.contentTypes || [],
                        containerType: allIndiaForm.containerType || '',
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
                
                if (!truckForm.contentTypes || truckForm.contentTypes.length === 0) {
                    Alert.alert('Missing content', 'Please select at least one content type'); setLoading(false); return;
                }
                
                const km = haversineKm(pickup, delivery);
                const fare = selectedTruckVehicle.baseFare + (km * selectedTruckVehicle.perKmRate);
                const payload = {
                    pickup: { lat: pickup.lat, lng: pickup.lng, address: pickup.address },
                    delivery: { lat: delivery.lat, lng: delivery.lng, address: delivery.address },
                    package: { 
                        name: pkgType || 'Household', 
                        size: truckForm.size || dimensions || 'standard', 
                        weight: weightNum, 
                        description: truckForm.contentTypes?.join(', ') || '',
                        contentTypes: truckForm.contentTypes || [],
                        containerType: truckForm.containerType || '',
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
                const { receiverName, receiverPhone, receiverAddress, additionalNotes } = packersForm;
                if (!receiverName || !receiverPhone) {
                    Alert.alert('Missing fields', 'Please enter receiver name and phone number'); 
                    setLoading(false); 
                    return;
                }
                
                const totalItems = getTotalSelectedItems();
                if (totalItems === 0) {
                    Alert.alert('No items selected', 'Please select at least one item to move'); 
                    setLoading(false); 
                    return;
                }
                
                // Get server-side estimate to keep parity with backend
                let fare = 0;
                try {
                    const res = await estimatePackers({ pickup, delivery, selectedItems });
                    fare = res.fare;
                } catch (e) {
                    const km = haversineKm(pickup, delivery);
                    const baseFare = 2000;
                    const itemFare = totalItems * 150;
                    const distanceFare = km * 25;
                    fare = baseFare + itemFare + distanceFare;
                }
                
                // Create items description
                const itemsDescription = Object.entries(selectedItems)
                    .map(([itemId, qty]) => {
                        const item = HOUSEHOLD_ITEMS.find(i => i.id === itemId);
                        return `${qty} ${item?.name}`;
                    })
                    .join(', ');
                
                const payload = {
                    pickup: { lat: pickup.lat, lng: pickup.lng, address: pickup.address },
                    delivery: { lat: delivery.lat, lng: delivery.lng, address: delivery.address },
                    receiverName,
                    receiverContact: receiverPhone,
                    receiverAddress: receiverAddress || delivery.address,
                    additionalNotes,
                    selectedItems,
                    fareEstimate: fare,
                };

                const created = await createPackersBooking(payload);
                onSuccess && onSuccess({ type: 'packers', id: created?._id });
                Alert.alert('Success', 'Your Packers & Movers booking has been created successfully.');
                try {
                    const { router } = require('expo-router');
                    // navigate to packers tracking
                    router.push({ pathname: '/packers-tracking', params: { id: created?._id } });
                } catch (e) {
                    // fallback to closing drawer if router not available
                close();
                }
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
                <TouchableOpacity 
                    style={styles.formContainer} 
                    activeOpacity={1} 
                    onPress={closeAllDrawers}
                >
                    <View>
                    {/* Package Size Drawer Selector */}
                    {renderDrawerSelector(
                        'Package Size',
                        drawerStates.sizeOpen,
                        () => toggleDrawer('sizeOpen'),
                        PACKAGE_SIZES,
                        parcelForm.size,
                        selectSize,
                        'resize-outline'
                    )}

                    {/* Weight Selection */}
                    <Text style={styles.fieldLabel}>Weight: {parcelForm.weight} kg</Text>
                    <View style={styles.sliderContainer}>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={50}
                            value={parseFloat(parcelForm.weight) || 1}
                            onValueChange={(value) => setParcelForm((s) => ({ ...s, weight: value.toString() }))}
                            minimumTrackTintColor={Colors.primary}
                            maximumTrackTintColor={Colors.border}
                            thumbStyle={styles.sliderThumb}
                            trackStyle={styles.sliderTrack}
                        />
                        <View style={styles.sliderLabels}>
                            <Text style={styles.sliderLabel}>0 kg</Text>
                            <Text style={styles.sliderLabel}>50 kg</Text>
                        </View>
                    </View>

                    {/* Package Category Drawer Selector */}
                    {renderDrawerSelector(
                        'Package Category',
                        drawerStates.categoryOpen,
                        () => toggleDrawer('categoryOpen'),
                        PACKAGE_CATEGORIES,
                        parcelForm.name,
                        selectCategory,
                        'cube-outline'
                    )}

                    {/* Package Content Multi-Selector */}
                    <Text style={styles.fieldLabel}>Package Content (Select Multiple)</Text>
                    <View style={styles.multiSelectContainer}>
                        {PACKAGE_CONTENTS.map((content) => {
                            const isSelected = parcelForm.contentTypes?.includes(content.key) || false;
                            return (
                                <TouchableOpacity
                                    key={content.key}
                                    style={[
                                        styles.multiSelectItem,
                                        isSelected ? styles.multiSelectItemActive : null
                                    ]}
                                    onPress={() => toggleContentType(content.key)}
                                >
                                    <View style={styles.multiSelectItemContent}>
                                        <View style={[
                                            styles.multiSelectCheckbox,
                                            isSelected ? styles.multiSelectCheckboxActive : null
                                        ]}>
                                            {isSelected && (
                                                <Ionicons name="checkmark" size={16} color="#fff" />
                                            )}
                                        </View>
                                        <Ionicons 
                                            name={content.icon} 
                                            size={20} 
                                            color={isSelected ? '#fff' : Colors.primary} 
                                        />
                                        <Text style={[
                                            styles.multiSelectItemText,
                                            isSelected ? styles.multiSelectItemTextActive : null
                                        ]}>
                                            {content.label}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    
                    {/* Selected Content Summary */}
                    {parcelForm.contentTypes && parcelForm.contentTypes.length > 0 && (
                        <View style={styles.selectedContentSummary}>
                            <Text style={styles.selectedContentTitle}>
                                Selected: {parcelForm.contentTypes.length} content type{parcelForm.contentTypes.length > 1 ? 's' : ''}
                            </Text>
                            <View style={styles.selectedContentTags}>
                                {parcelForm.contentTypes.map((contentKey) => {
                                    const content = PACKAGE_CONTENTS.find(c => c.key === contentKey);
                                    return (
                                        <View key={contentKey} style={styles.selectedContentTag}>
                                            <Ionicons name={content?.icon} size={14} color={Colors.primary} />
                                            <Text style={styles.selectedContentTagText}>{content?.label}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Container Type Drawer Selector */}
                    {renderDrawerSelector(
                        'Container Type',
                        drawerStates.containerOpen,
                        () => toggleDrawer('containerOpen'),
                        CONTAINER_TYPES,
                        parcelForm.containerType,
                        selectContainer,
                        'archive-outline'
                    )}

                    {/* Declared Value */}
                    <Text style={styles.fieldLabel}>Declared Value (₹)</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Declared Value (₹)" 
                        keyboardType="numeric" 
                        value={parcelForm.value} 
                        onChangeText={(t) => setParcelForm((s) => ({ ...s, value: t }))} 
                    />

                    {/* Receiver Details */}
                    <Text style={styles.sectionTitle}>Receiver Details</Text>
                    <Text style={styles.fieldLabel}>Receiver Name</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Receiver Name" 
                        value={parcelForm.receiverName} 
                        onChangeText={(t) => setParcelForm((s) => ({ ...s, receiverName: t }))} 
                    />

                    <Text style={styles.fieldLabel}>Receiver Contact</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Receiver Contact" 
                        value={parcelForm.receiverContact} 
                        onChangeText={(t) => setParcelForm((s) => ({ ...s, receiverContact: t }))} 
                    />
                    
                    {renderEstimateFare()}
                    </View>
                </TouchableOpacity>
            );
        }
        if (service === 'all_india_parcel') {
            return (
                <TouchableOpacity 
                    style={styles.formContainer} 
                    activeOpacity={1} 
                    onPress={closeAllAllIndiaDrawers}
                >
                    <View>
                        {/* Enhanced Package Details */}
                        <View style={styles.enhancedSection}>
                            <Text style={styles.enhancedSectionTitle}>Package Details</Text>
                            
                            {/* Package Category */}
                            {renderDrawerSelector(
                                'Package Category',
                                allIndiaDrawerStates.categoryOpen,
                                () => toggleAllIndiaDrawer('categoryOpen'),
                                PACKAGE_CATEGORIES,
                                allIndiaForm.pkgType,
                                selectAllIndiaCategory,
                                'cube-outline'
                            )}
                            
                            {/* Package Size */}
                            {renderDrawerSelector(
                                'Package Size',
                                allIndiaDrawerStates.sizeOpen,
                                () => toggleAllIndiaDrawer('sizeOpen'),
                                PACKAGE_SIZES,
                                allIndiaForm.size,
                                selectAllIndiaSize,
                                'resize-outline'
                            )}
                            
                            {/* Weight Slider */}
                            <Text style={styles.fieldLabel}>Weight: {allIndiaForm.weight} kg</Text>
                            <View style={styles.enhancedSliderContainer}>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={50}
                                    value={parseFloat(allIndiaForm.weight) || 1}
                                    onValueChange={(value) => setAllIndiaForm((s) => ({ ...s, weight: value.toString() }))}
                                    minimumTrackTintColor={Colors.primary}
                                    maximumTrackTintColor={Colors.border}
                                    thumbStyle={styles.sliderThumb}
                                    trackStyle={styles.sliderTrack}
                                />
                                <View style={styles.sliderLabels}>
                                    <Text style={styles.sliderLabel}>0 kg</Text>
                                    <Text style={styles.sliderLabel}>50 kg</Text>
                                </View>
                            </View>
                            
                            {/* Container Type */}
                            {renderDrawerSelector(
                                'Container Type',
                                allIndiaDrawerStates.containerOpen,
                                () => toggleAllIndiaDrawer('containerOpen'),
                                CONTAINER_TYPES,
                                allIndiaForm.containerType,
                                selectAllIndiaContainer,
                                'archive-outline'
                            )}
                            
                            {/* Content Types Multi-Selector */}
                            <Text style={styles.fieldLabel}>Content Types (Select Multiple)</Text>
                            <View style={styles.multiSelectContainer}>
                                {PACKAGE_CONTENTS.map((content) => {
                                    const isSelected = allIndiaForm.contentTypes?.includes(content.key) || false;
                                    return (
                                        <TouchableOpacity
                                            key={content.key}
                                            style={[
                                                styles.multiSelectItem,
                                                isSelected ? styles.multiSelectItemActive : null
                                            ]}
                                            onPress={() => toggleAllIndiaContentType(content.key)}
                                        >
                                            <View style={styles.multiSelectItemContent}>
                                                <View style={[
                                                    styles.multiSelectCheckbox,
                                                    isSelected ? styles.multiSelectCheckboxActive : null
                                                ]}>
                                                    {isSelected && (
                                                        <Ionicons name="checkmark" size={16} color="#fff" />
                                                    )}
                                                </View>
                                                <Ionicons 
                                                    name={content.icon} 
                                                    size={20} 
                                                    color={isSelected ? '#fff' : Colors.primary} 
                                                />
                                                <Text style={[
                                                    styles.multiSelectItemText,
                                                    isSelected ? styles.multiSelectItemTextActive : null
                                                ]}>
                                                    {content.label}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            
                            {/* Selected Content Summary */}
                            {allIndiaForm.contentTypes && allIndiaForm.contentTypes.length > 0 && (
                                <View style={styles.selectedContentSummary}>
                                    <Text style={styles.selectedContentTitle}>
                                        Selected: {allIndiaForm.contentTypes.length} content type{allIndiaForm.contentTypes.length > 1 ? 's' : ''}
                                    </Text>
                                    <View style={styles.selectedContentTags}>
                                        {allIndiaForm.contentTypes.map((contentKey) => {
                                            const content = PACKAGE_CONTENTS.find(c => c.key === contentKey);
                                            return (
                                                <View key={contentKey} style={styles.selectedContentTag}>
                                                    <Ionicons name={content?.icon} size={14} color={Colors.primary} />
                                                    <Text style={styles.selectedContentTagText}>{content?.label}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}
                            
                            {/* Dimensions */}
                            <Text style={styles.fieldLabel}>Dimensions (Optional)</Text>
                            <View style={styles.enhancedInputContainer}>
                                <Ionicons name="resize-outline" size={20} color={Colors.mutedText} />
                                <TextInput 
                                    style={styles.enhancedInput} 
                                    placeholder="e.g., 10ft × 6ft × 4ft" 
                                    value={allIndiaForm.dimensions} 
                                    onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, dimensions: t }))} 
                                />
                            </View>
                            
                            {/* Individual Dimensions */}
                            <View style={styles.dimensionsRow}>
                                <View style={styles.dimensionInput}>
                                    <Text style={styles.fieldLabel}>Length (cm)</Text>
                                    <View style={styles.enhancedInputContainer}>
                                        <Ionicons name="resize-outline" size={16} color={Colors.mutedText} />
                                        <TextInput 
                                            style={styles.enhancedInput} 
                                            placeholder="Length" 
                                            keyboardType="numeric" 
                                            value={allIndiaForm.length} 
                                            onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, length: t }))} 
                                        />
                                    </View>
                                </View>
                                <View style={styles.dimensionInput}>
                                    <Text style={styles.fieldLabel}>Width (cm)</Text>
                                    <View style={styles.enhancedInputContainer}>
                                        <Ionicons name="resize-outline" size={16} color={Colors.mutedText} />
                                        <TextInput 
                                            style={styles.enhancedInput} 
                                            placeholder="Width" 
                                            keyboardType="numeric" 
                                            value={allIndiaForm.width} 
                                            onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, width: t }))} 
                                        />
                                    </View>
                                </View>
                                <View style={styles.dimensionInput}>
                                    <Text style={styles.fieldLabel}>Height (cm)</Text>
                                    <View style={styles.enhancedInputContainer}>
                                        <Ionicons name="resize-outline" size={16} color={Colors.mutedText} />
                                        <TextInput 
                                            style={styles.enhancedInput} 
                                            placeholder="Height" 
                                            keyboardType="numeric" 
                                            value={allIndiaForm.height} 
                                            onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, height: t }))} 
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>
                        
                        {/* Enhanced Receiver Details */}
                        <View style={styles.enhancedSection}>
                            <Text style={styles.enhancedSectionTitle}>Receiver Details</Text>
                            
                            <View style={styles.enhancedInputContainer}>
                                <Ionicons name="person-outline" size={20} color={Colors.mutedText} />
                                <TextInput 
                                    style={styles.enhancedInput} 
                                    placeholder="Receiver Name" 
                                    value={allIndiaForm.receiverName} 
                                    onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, receiverName: t }))} 
                                />
                            </View>
                            
                            <View style={styles.enhancedInputContainer}>
                                <Ionicons name="call-outline" size={20} color={Colors.mutedText} />
                                <TextInput 
                                    style={styles.enhancedInput} 
                                    placeholder="Receiver Phone" 
                                    keyboardType="phone-pad" 
                                    value={allIndiaForm.receiverPhone} 
                                    onChangeText={(t) => setAllIndiaForm((s) => ({ ...s, receiverPhone: t }))} 
                                />
                            </View>
                        </View>
                        
                        {/* Enhanced Delivery Type Selection */}
                        <View style={styles.enhancedSection}>
                            <Text style={styles.enhancedSectionTitle}>Delivery Options</Text>
                            <View style={styles.enhancedDeliveryTypeContainer}>
                                {[
                                    { 
                                        key: 'standard', 
                                        label: 'Standard Delivery', 
                                        description: '3-5 days', 
                                        icon: 'time-outline',
                                        color: '#10B981'
                                    },
                                    { 
                                        key: 'express', 
                                        label: 'Express Delivery', 
                                        description: '1-2 days (+50%)', 
                                        icon: 'flash-outline',
                                        color: '#F59E0B'
                                    }
                                ].map((option) => (
                                    <TouchableOpacity 
                                        key={option.key} 
                                        style={[
                                            styles.enhancedDeliveryTypeCard, 
                                            allIndiaForm.typeOfDelivery === option.key ? styles.enhancedDeliveryTypeCardActive : null
                                        ]} 
                                        onPress={() => setAllIndiaForm((s) => ({ ...s, typeOfDelivery: option.key }))}
                                    >
                                        <View style={[
                                            styles.enhancedDeliveryTypeIconContainer,
                                            { backgroundColor: allIndiaForm.typeOfDelivery === option.key ? option.color : '#F3F4F6' }
                                        ]}>
                                            <Ionicons 
                                                name={option.icon} 
                                                size={24} 
                                                color={allIndiaForm.typeOfDelivery === option.key ? '#fff' : option.color} 
                                            />
                                        </View>
                                        <View style={styles.enhancedDeliveryTypeContent}>
                                            <Text style={[
                                                styles.enhancedDeliveryTypeLabel,
                                                allIndiaForm.typeOfDelivery === option.key ? styles.enhancedDeliveryTypeLabelActive : null
                                            ]}>
                                                {option.label}
                                            </Text>
                                            <Text style={styles.enhancedDeliveryTypeDescription}>{option.description}</Text>
                                        </View>
                                        {allIndiaForm.typeOfDelivery === option.key && (
                                            <Ionicons name="checkmark-circle" size={24} color={option.color} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        
                        {renderEstimateFare()}
                    </View>
                </TouchableOpacity>
            );
        }
        if (service === 'truck') {
            if (!selectedTruckVehicle) {
                return renderTruckVehicleSelection();
            }
            
            return (
                <TouchableOpacity 
                    style={styles.formContainer} 
                    activeOpacity={1} 
                    onPress={closeAllTruckDrawers}
                >
                    <View>
                        {/* Enhanced Selected Vehicle Info */}
                        <View style={styles.enhancedSelectedVehicleCard}>
                            <View style={styles.enhancedSelectedVehicleHeader}>
                                <View style={[
                                    styles.enhancedSelectedVehicleIconContainer,
                                    { backgroundColor: selectedTruckVehicle.color }
                                ]}>
                                    <Text style={styles.enhancedSelectedVehicleIcon}>{selectedTruckVehicle.icon}</Text>
                                </View>
                                <View style={styles.enhancedSelectedVehicleInfo}>
                                    <Text style={styles.enhancedSelectedVehicleName}>{selectedTruckVehicle.name}</Text>
                                    <Text style={styles.enhancedSelectedVehicleCapacity}>
                                        {selectedTruckVehicle.capacityPayloadKg}kg • {selectedTruckVehicle.vehicleLengthFt}' × {selectedTruckVehicle.vehicleWidthFt}'
                                    </Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.enhancedChangeVehicleBtn}
                                    onPress={() => setSelectedTruckVehicle(null)}
                                >
                                    <Ionicons name="refresh-outline" size={16} color="#fff" />
                                    <Text style={styles.enhancedChangeVehicleBtnText}>Change</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        {/* Enhanced Package Details */}
                        <View style={styles.enhancedSection}>
                            <Text style={styles.enhancedSectionTitle}>Package Details</Text>
                            
                            {/* Package Category */}
                            {renderDrawerSelector(
                                'Package Category',
                                truckDrawerStates.categoryOpen,
                                () => toggleTruckDrawer('categoryOpen'),
                                PACKAGE_CATEGORIES,
                                truckForm.pkgType,
                                selectTruckCategory,
                                'cube-outline'
                            )}
                            
                            {/* Package Size */}
                            {renderDrawerSelector(
                                'Package Size',
                                truckDrawerStates.sizeOpen,
                                () => toggleTruckDrawer('sizeOpen'),
                                PACKAGE_SIZES,
                                truckForm.size,
                                selectTruckSize,
                                'resize-outline'
                            )}
                            
                            {/* Weight Slider for Trucks */}
                            <Text style={styles.fieldLabel}>Weight: {truckForm.weight} kg</Text>
                            <View style={styles.enhancedSliderContainer}>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={selectedTruckVehicle.capacityPayloadKg}
                                    value={parseFloat(truckForm.weight) || 10}
                                    onValueChange={(value) => setTruckForm((s) => ({ ...s, weight: value.toString() }))}
                                    minimumTrackTintColor={selectedTruckVehicle.color}
                                    maximumTrackTintColor={Colors.border}
                                    thumbStyle={styles.sliderThumb}
                                    trackStyle={styles.sliderTrack}
                                />
                                <View style={styles.sliderLabels}>
                                    <Text style={styles.sliderLabel}>0 kg</Text>
                                    <Text style={styles.sliderLabel}>{selectedTruckVehicle.capacityPayloadKg} kg</Text>
                                </View>
                            </View>
                            
                            {/* Container Type */}
                            {renderDrawerSelector(
                                'Container Type',
                                truckDrawerStates.containerOpen,
                                () => toggleTruckDrawer('containerOpen'),
                                CONTAINER_TYPES,
                                truckForm.containerType,
                                selectTruckContainer,
                                'archive-outline'
                            )}
                            
                            {/* Content Types Multi-Selector */}
                            <Text style={styles.fieldLabel}>Content Types (Select Multiple)</Text>
                            <View style={styles.multiSelectContainer}>
                                {PACKAGE_CONTENTS.map((content) => {
                                    const isSelected = truckForm.contentTypes?.includes(content.key) || false;
                                    return (
                                        <TouchableOpacity
                                            key={content.key}
                                            style={[
                                                styles.multiSelectItem,
                                                isSelected ? styles.multiSelectItemActive : null
                                            ]}
                                            onPress={() => toggleTruckContentType(content.key)}
                                        >
                                            <View style={styles.multiSelectItemContent}>
                                                <View style={[
                                                    styles.multiSelectCheckbox,
                                                    isSelected ? styles.multiSelectCheckboxActive : null
                                                ]}>
                                                    {isSelected && (
                                                        <Ionicons name="checkmark" size={16} color="#fff" />
                                                    )}
                                                </View>
                                                <Ionicons 
                                                    name={content.icon} 
                                                    size={20} 
                                                    color={isSelected ? '#fff' : Colors.primary} 
                                                />
                                                <Text style={[
                                                    styles.multiSelectItemText,
                                                    isSelected ? styles.multiSelectItemTextActive : null
                                                ]}>
                                                    {content.label}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            
                            {/* Selected Content Summary */}
                            {truckForm.contentTypes && truckForm.contentTypes.length > 0 && (
                                <View style={styles.selectedContentSummary}>
                                    <Text style={styles.selectedContentTitle}>
                                        Selected: {truckForm.contentTypes.length} content type{truckForm.contentTypes.length > 1 ? 's' : ''}
                                    </Text>
                                    <View style={styles.selectedContentTags}>
                                        {truckForm.contentTypes.map((contentKey) => {
                                            const content = PACKAGE_CONTENTS.find(c => c.key === contentKey);
                                            return (
                                                <View key={contentKey} style={styles.selectedContentTag}>
                                                    <Ionicons name={content?.icon} size={14} color={Colors.primary} />
                                                    <Text style={styles.selectedContentTagText}>{content?.label}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}
                            
                            {/* Dimensions */}
                            <Text style={styles.fieldLabel}>Dimensions (Optional)</Text>
                            <View style={styles.enhancedInputContainer}>
                                <Ionicons name="resize-outline" size={20} color={Colors.mutedText} />
                                <TextInput 
                                    style={styles.enhancedInput} 
                                    placeholder="e.g., 10ft × 6ft × 4ft" 
                                    value={truckForm.dimensions} 
                                    onChangeText={(t) => setTruckForm((s) => ({ ...s, dimensions: t }))} 
                                />
                            </View>
                        </View>
                        
                        {/* Enhanced Sender Details */}
                        <View style={styles.enhancedSection}>
                            <Text style={styles.enhancedSectionTitle}>Sender Details</Text>
                            
                            <View style={styles.enhancedInputContainer}>
                                <Ionicons name="person-outline" size={20} color={Colors.mutedText} />
                                <TextInput 
                                    style={styles.enhancedInput} 
                                    placeholder="Sender Name" 
                                    value={truckForm.senderName} 
                                    onChangeText={(t) => setTruckForm((s) => ({ ...s, senderName: t }))} 
                                />
                            </View>
                            
                            <View style={styles.enhancedInputContainer}>
                                <Ionicons name="call-outline" size={20} color={Colors.mutedText} />
                                <TextInput 
                                    style={styles.enhancedInput} 
                                    placeholder="Sender Phone" 
                                    keyboardType="phone-pad" 
                                    value={truckForm.senderPhone} 
                                    onChangeText={(t) => setTruckForm((s) => ({ ...s, senderPhone: t }))} 
                                />
                            </View>
                        </View>
                        
                        {/* Enhanced Receiver Details */}
                        <View style={styles.enhancedSection}>
                            <Text style={styles.enhancedSectionTitle}>Receiver Details</Text>
                            
                            <View style={styles.enhancedInputContainer}>
                                <Ionicons name="person-outline" size={20} color={Colors.mutedText} />
                                <TextInput 
                                    style={styles.enhancedInput} 
                                    placeholder="Receiver Name" 
                                    value={truckForm.receiverName} 
                                    onChangeText={(t) => setTruckForm((s) => ({ ...s, receiverName: t }))} 
                                />
                            </View>
                            
                            <View style={styles.enhancedInputContainer}>
                                <Ionicons name="call-outline" size={20} color={Colors.mutedText} />
                                <TextInput 
                                    style={styles.enhancedInput} 
                                    placeholder="Receiver Phone" 
                                    keyboardType="phone-pad" 
                                    value={truckForm.receiverPhone} 
                                    onChangeText={(t) => setTruckForm((s) => ({ ...s, receiverPhone: t }))} 
                                />
                            </View>
                        </View>
                        
                        {renderEstimateFare()}
                    </View>
                </TouchableOpacity>
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
            if (packersStep === 0) {
            return (
                <View>
                        <Text style={styles.sectionTitle}>Receiver Information</Text>
                        <Text style={styles.fieldLabel}>Receiver Name *</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Enter receiver name" 
                            value={packersForm.receiverName} 
                            onChangeText={(t) => setPackersForm((s) => ({ ...s, receiverName: t }))} 
                        />

                        <Text style={styles.fieldLabel}>Receiver Phone *</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Enter phone number" 
                            keyboardType="phone-pad"
                            value={packersForm.receiverPhone} 
                            onChangeText={(t) => setPackersForm((s) => ({ ...s, receiverPhone: t }))} 
                        />

                        <Text style={styles.fieldLabel}>Receiver Address</Text>
                        <TextInput 
                            style={[styles.input, styles.multiline]} 
                            placeholder="Enter receiver address (optional)" 
                            multiline
                            value={packersForm.receiverAddress} 
                            onChangeText={(t) => setPackersForm((s) => ({ ...s, receiverAddress: t }))} 
                        />

                        <Text style={styles.fieldLabel}>Additional Notes</Text>
                        <TextInput 
                            style={[styles.input, styles.multiline]} 
                            placeholder="Any special instructions (optional)" 
                            multiline
                            value={packersForm.additionalNotes} 
                            onChangeText={(t) => setPackersForm((s) => ({ ...s, additionalNotes: t }))} 
                        />
                        
                        
                    </View>
                );
            } else if (packersStep === 1) {
                return (
                    <View>
                        <Text style={styles.sectionTitle}>Select Items to Move</Text>
                        
                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <Ionicons name="search-outline" size={20} color={Colors.mutedText} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search items..."
                                value={itemSearchQuery}
                                onChangeText={setItemSearchQuery}
                            />
                        </View>

                        {/* Items Grid */}
                        <View style={styles.itemsGrid}>
                            {getFilteredItems().map((item) => (
                                <View key={item.id} style={styles.itemCard}>
                                    <View style={styles.itemCardContent}>
                                        <View style={styles.itemIconContainer}>
                                            <Ionicons name={item.icon} size={24} color={Colors.primary} />
                                        </View>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemCategory}>{item.category}</Text>
                                    </View>
                                    
                                    <View style={styles.quantitySelector}>
                                        <TouchableOpacity 
                                            style={styles.quantityBtn}
                                            onPress={() => updateItemQuantity(item.id, -1)}
                                            disabled={!selectedItems[item.id]}
                                        >
                                            <Ionicons name="remove" size={16} color={selectedItems[item.id] ? Colors.primary : Colors.mutedText} />
                            </TouchableOpacity>
                                        
                                        <Text style={styles.quantityText}>
                                            {selectedItems[item.id] || 0}
                                        </Text>
                                        
                                        <TouchableOpacity 
                                            style={styles.quantityBtn}
                                            onPress={() => updateItemQuantity(item.id, 1)}
                                        >
                                            <Ionicons name="add" size={16} color={Colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                        ))}
                    </View>

                        {/* Selected Items Summary */}
                        {getTotalSelectedItems() > 0 && (
                            <View style={styles.selectedItemsSummary}>
                                <Text style={styles.summaryTitle}>Selected Items: {getTotalSelectedItems()}</Text>
                            </View>
                        )}
                        
                        {renderEstimateFare()}
                </View>
            );
            }
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
                        {renderRow('Category', parcelForm.name)}
                        <View style={styles.divider} />
                        {renderRow('Size', parcelForm.size)}
                        <View style={styles.divider} />
                        {renderRow('Weight (kg)', parcelForm.weight)}
                        <View style={styles.divider} />
                        {renderRow('Content Types', parcelForm.contentTypes?.join(', ') || 'None selected')}
                        <View style={styles.divider} />
                        {renderRow('Container Type', parcelForm.containerType)}
                        <View style={styles.divider} />
                        {renderRow('Declared Value (₹)', parcelForm.value)}
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
                        {renderRow('Category', allIndiaForm.pkgType)}
                        <View style={styles.divider} />
                        {renderRow('Size', allIndiaForm.size)}
                        <View style={styles.divider} />
                        {renderRow('Weight (kg)', allIndiaForm.weight)}
                        <View style={styles.divider} />
                        {renderRow('Content Types', allIndiaForm.contentTypes?.join(', ') || 'None selected')}
                        <View style={styles.divider} />
                        {renderRow('Container Type', allIndiaForm.containerType)}
                        <View style={styles.divider} />
                        {renderRow('Dimensions', allIndiaForm.dimensions)}
                        <View style={styles.divider} />
                        {renderRow('Length (cm)', allIndiaForm.length)}
                        <View style={styles.divider} />
                        {renderRow('Width (cm)', allIndiaForm.width)}
                        <View style={styles.divider} />
                        {renderRow('Height (cm)', allIndiaForm.height)}
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
                        <Text style={styles.sectionTitle}>Receiver Information</Text>
                        {renderRow('Name', packersForm.receiverName)}
                        <View style={styles.divider} />
                        {renderRow('Phone', packersForm.receiverPhone)}
                        {packersForm.receiverAddress && (
                            <>
                                <View style={styles.divider} />
                                {renderRow('Address', packersForm.receiverAddress)}
                            </>
                        )}
                        {packersForm.additionalNotes && (
                            <>
                                <View style={styles.divider} />
                                {renderRow('Notes', packersForm.additionalNotes)}
                            </>
                        )}
                    </View>
                )}

                {service === 'packers' && (
                    <View style={styles.reviewBox}>
                        <Text style={styles.sectionTitle}>Items to Move</Text>
                        {Object.entries(selectedItems).map(([itemId, qty]) => {
                            const item = HOUSEHOLD_ITEMS.find(i => i.id === itemId);
                            return (
                                <View key={itemId}>
                                    {renderRow(item?.name || itemId, `*${qty}`)}
                                    {Object.keys(selectedItems).indexOf(itemId) < Object.keys(selectedItems).length - 1 && (
                                        <View style={styles.divider} />
                                    )}
                                </View>
                            );
                        })}
                        <View style={styles.divider} />
                        {renderRow('Total Items', getTotalSelectedItems().toString())}
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
                            <View style={styles.serviceGrid}>
                                {SERVICES.map((s) => (
                                    <TouchableOpacity 
                                        key={s.key} 
                                        style={[
                                            styles.serviceCard, 
                                            service === s.key ? styles.serviceCardActive : null
                                        ]} 
                                        onPress={() => setService(s.key)}
                                    >
                                        <View style={[
                                            styles.serviceCardIconContainer,
                                            service === s.key ? styles.serviceCardIconContainerActive : null
                                        ]}>
                                            <Ionicons 
                                                name={s.icon} 
                                                size={24} 
                                                color={service === s.key ? '#fff' : Colors.primary} 
                                            />
                                        </View>
                                        <Text style={[
                                            styles.serviceCardText, 
                                            service === s.key ? styles.serviceCardTextActive : null
                                        ]}>
                                            {s.label}
                                        </Text>
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
                                {service === 'packers' ? (
                                    <TouchableOpacity 
                                        style={[
                                            styles.primaryBtn, 
                                            packersStep === 0 && (!packersForm.receiverName || !packersForm.receiverPhone) ? styles.primaryBtnDisabled : null,
                                            packersStep === 1 && getTotalSelectedItems() === 0 ? styles.primaryBtnDisabled : null
                                        ]} 
                                        disabled={
                                            (packersStep === 0 && (!packersForm.receiverName || !packersForm.receiverPhone)) ||
                                            (packersStep === 1 && getTotalSelectedItems() === 0)
                                        }
                                        onPress={() => {
                                            if (packersStep === 0) {
                                                setPackersStep(1);
                                            } else if (packersStep === 1) {
                                                setStep(2);
                                            }
                                        }}
                                    >
                                        <Text style={styles.primaryBtnTxt}>
                                            {packersStep === 0 ? 'Select Items' : 'Review'}
                                        </Text>
                                    </TouchableOpacity>

                                ) : (
                                <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(2)}>
                                    <Text style={styles.primaryBtnTxt}>Review</Text>
                                </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ) : (
                        <View>
                            <Text style={styles.title}>Review</Text>
                            {renderReview()}
                            <View style={styles.rowBetween}>
                                <TouchableOpacity 
                                    style={styles.secondaryBtn} 
                                    onPress={() => {
                                        if (service === 'packers' && packersStep === 1) {
                                            setPackersStep(0);
                                        } else {
                                            setStep(1);
                                        }
                                    }}
                                >
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
    // Packers & Movers Styles
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.lg,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2
    },
    searchIcon: {
        marginRight: Spacing.sm
    },
    searchInput: {
        flex: 1,
        paddingVertical: Spacing.md,
        fontSize: 16,
        color: Colors.text
    },
    itemsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.lg
    },
    itemCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: Spacing.sm
    },
    itemCardContent: {
        alignItems: 'center',
        marginBottom: Spacing.sm
    },
    itemIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f8f9ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm
    },
    itemName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 2
    },
    itemCategory: {
        fontSize: 11,
        color: Colors.mutedText,
        textAlign: 'center',
        textTransform: 'capitalize'
    },
    quantitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: Radius.md,
        paddingVertical: Spacing.sm
    },
    quantityBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginHorizontal: Spacing.md,
        minWidth: 24,
        textAlign: 'center'
    },
    selectedItemsSummary: {
        backgroundColor: '#f8f9ff',
        borderRadius: Radius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.primary,
        alignItems: 'center'
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary
    },
    // New Package UI Styles
    badgeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md
    },
    sizeBadge: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: Colors.border,
        borderRadius: Radius.xl,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        minWidth: 50,
        alignItems: 'center'
    },
    sizeBadgeActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        shadowOpacity: 0.15,
        elevation: 6
    },
    sizeBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text
    },
    sizeBadgeTextActive: {
        color: '#fff'
    },
    containerBadge: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: Colors.border,
        borderRadius: Radius.xl,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs
    },
    containerBadgeActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        shadowOpacity: 0.15,
        elevation: 6
    },
    containerBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.text
    },
    containerBadgeTextActive: {
        color: '#fff'
    },
    sliderContainer: {
        backgroundColor: '#fff',
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3
    },
    slider: {
        width: '100%',
        height: 40,
        marginBottom: Spacing.sm
    },
    sliderThumb: {
        backgroundColor: Colors.primary,
        width: 24,
        height: 24,
        borderRadius: 12,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
    },
    sliderTrack: {
        height: 6,
        borderRadius: 3
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    sliderLabel: {
        fontSize: 12,
        color: Colors.mutedText,
        fontWeight: '600'
    },
    dropdownContainer: {
        backgroundColor: '#fff',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.md,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden'
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border
    },
    dropdownItemActive: {
        backgroundColor: Colors.primary
    },
    dropdownItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        flex: 1
    },
    dropdownItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text
    },
    dropdownItemTextActive: {
        color: '#fff',
        fontWeight: '700'
    },
    // Multi-Selector Styles
    multiSelectContainer: {
        backgroundColor: '#fff',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.md,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden'
    },
    multiSelectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border
    },
    multiSelectItemActive: {
        backgroundColor: Colors.primary
    },
    multiSelectItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        flex: 1
    },
    multiSelectCheckbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff'
    },
    multiSelectCheckboxActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary
    },
    multiSelectItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text
    },
    multiSelectItemTextActive: {
        color: '#fff',
        fontWeight: '700'
    },
    selectedContentSummary: {
        backgroundColor: '#f8f9ff',
        borderRadius: Radius.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.primary
    },
    selectedContentTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
        marginBottom: Spacing.sm
    },
    selectedContentTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs
    },
    selectedContentTag: {
        backgroundColor: '#fff',
        borderRadius: Radius.md,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        borderWidth: 1,
        borderColor: Colors.primary
    },
    selectedContentTagText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary
    },
    // Drawer Selector Styles
    drawerSelector: {
        backgroundColor: '#fff',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.md,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3
    },
    drawerSelectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg
    },
    drawerSelectorLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        flex: 1
    },
    drawerSelectorText: {
        fontSize: 16,
        fontWeight: '600'
    },
    drawerSelectorTextSelected: {
        color: Colors.text
    },
    drawerSelectorTextPlaceholder: {
        color: Colors.mutedText
    },
    drawerDropdown: {
        backgroundColor: '#fff',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        marginTop: -Radius.lg,
        marginBottom: Spacing.md,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
        overflow: 'hidden'
    },
    drawerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border
    },
    drawerOptionSelected: {
        backgroundColor: Colors.primary
    },
    drawerOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        flex: 1
    },
    drawerOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text
    },
    drawerOptionTextSelected: {
        color: '#fff',
        fontWeight: '700'
    },
    formContainer: {
        flex: 1
    },
    // Enhanced Truck Booking Styles
    enhancedHeader: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.lg
    },
    enhancedTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E3A8A',
        marginBottom: Spacing.sm,
        textAlign: 'center'
    },
    enhancedSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22
    },
    enhancedVehicleGrid: {
        gap: Spacing.lg,
        marginBottom: Spacing.xl
    },
    enhancedVehicleCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: Spacing.xl,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        position: 'relative'
    },
    enhancedVehicleCardActive: {
        borderColor: '#1E3A8A',
        backgroundColor: '#F8FAFC',
        shadowOpacity: 0.2,
        elevation: 12
    },
    enhancedVehicleIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
    },
    enhancedVehicleIcon: {
        fontSize: 32
    },
    enhancedVehicleContent: {
        flex: 1
    },
    enhancedVehicleName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: Spacing.sm
    },
    enhancedVehicleNameActive: {
        color: '#1E3A8A'
    },
    enhancedVehicleDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: Spacing.lg
    },
    enhancedVehicleSpecs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: Spacing.md
    },
    enhancedSpecItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs
    },
    enhancedSpecText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151'
    },
    enhancedVehiclePricing: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        padding: Spacing.md
    },
    enhancedPriceItem: {
        alignItems: 'center'
    },
    enhancedPriceLabel: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 2
    },
    enhancedPriceValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E3A8A'
    },
    enhancedUseCases: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs
    },
    enhancedUseCaseTag: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 16,
        marginRight: Spacing.xs
    },
    enhancedUseCaseText: {
        fontSize: 11,
        fontWeight: '600'
    },
    enhancedSelectedIndicator: {
        position: 'absolute',
        top: Spacing.lg,
        right: Spacing.lg,
        backgroundColor: '#10B981',
        borderRadius: 12,
        padding: Spacing.xs
    },
    enhancedPrimaryBtn: {
        backgroundColor: '#1E3A8A',
        borderRadius: 16,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        shadowColor: '#1E3A8A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8
    },
    enhancedPrimaryBtnDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0.1
    },
    enhancedPrimaryBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16
    },
    enhancedSelectedVehicleCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
    },
    enhancedSelectedVehicleHeader: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    enhancedSelectedVehicleIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md
    },
    enhancedSelectedVehicleIcon: {
        fontSize: 24
    },
    enhancedSelectedVehicleInfo: {
        flex: 1
    },
    enhancedSelectedVehicleName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2
    },
    enhancedSelectedVehicleCapacity: {
        fontSize: 12,
        color: '#6B7280'
    },
    enhancedChangeVehicleBtn: {
        backgroundColor: '#1E3A8A',
        borderRadius: 8,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs
    },
    enhancedChangeVehicleBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600'
    },
    enhancedSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
    },
    enhancedSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: Spacing.lg
    },
    enhancedSliderContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    enhancedInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    enhancedInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        marginLeft: Spacing.md
    },
    // All India Parcel specific styles
    dimensionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.sm,
        marginBottom: Spacing.md
    },
    dimensionInput: {
        flex: 1
    },
    enhancedDeliveryTypeContainer: {
        gap: Spacing.md
    },
    enhancedDeliveryTypeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: Spacing.lg,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3
    },
    enhancedDeliveryTypeCardActive: {
        borderColor: '#10B981',
        backgroundColor: '#F0FDF4',
        shadowOpacity: 0.15,
        elevation: 6
    },
    enhancedDeliveryTypeIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md
    },
    enhancedDeliveryTypeContent: {
        flex: 1
    },
    enhancedDeliveryTypeLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2
    },
    enhancedDeliveryTypeLabelActive: {
        color: '#10B981',
        fontWeight: '700'
    },
    enhancedDeliveryTypeDescription: {
        fontSize: 14,
        color: '#6B7280'
    },
    // Service Grid Styles
    serviceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.sm
    },
    serviceCard: {
        width: '48%',
        height: 120,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: Spacing.md
    },
    serviceCardActive: {
        borderColor: Colors.primary,
        backgroundColor: '#F8FAFF',
        shadowOpacity: 0.15,
        elevation: 6
    },
    serviceCardIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    serviceCardIconContainerActive: {
        backgroundColor: Colors.primary,
        shadowOpacity: 0.2,
        elevation: 4
    },
    serviceCardText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        textAlign: 'center',
        lineHeight: 18
    },
    serviceCardTextActive: {
        color: Colors.primary,
        fontWeight: '700'
    },
});

export default ServiceFlowDrawer;



