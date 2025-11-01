import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Linking,
  Modal,
  TouchableOpacity,
  TextInput, // <-- Added for OTP
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { Feather } from "@expo/vector-icons";

// Keep these imports pointing to your existing helpers
import { Colors } from "@/constants/colors"; // Note: Colors.primary may be overridden by hardcoded styles
import { captainTripApi, setCaptainApiToken } from "../lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  connectSocket,
  setupSocketListeners,
  emitLocationUpdate,
  getSocket,
} from "../lib/socket";

const { width, height } = Dimensions.get("window");

// --- NEW GREEN THEME ---
const newPrimaryColor = "#059669"; // Dark Emerald
const newAccentColor = "#D1FAE5"; // Light Emerald
const newGradient = ["#A7F3D0", "#6EE7B7"]; // Light to Mid Emerald
const successColor = "#16A34A"; // Kept from before

/* -------------------------
   Bulletproof coordinate validation
   ------------------------ */
const validateCoordinate = (lat: any, lng: any) => {
  const defaultCoords = { latitude: 19.0760, longitude: 72.8777 }; // Mumbai
  try {
    const latitude = parseFloat(String(lat));
    const longitude = parseFloat(String(lng));
    if (isNaN(latitude) || isNaN(longitude)) return { isValid: false, ...defaultCoords };
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return { isValid: false, ...defaultCoords };
    }
    if (latitude === 0 && longitude === 0) return { isValid: false, ...defaultCoords };
    return { isValid: true, latitude, longitude };
  } catch (error) {
    return { isValid: false, ...defaultCoords };
  }
};

/* -------------------------
   Page Component
   ------------------------ */
export default function CaptainHome() {
  const router = useRouter();
  const { captain, token } = useAuth();

  // states
  const [isOnline, setIsOnline] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [availableTrips, setAvailableTrips] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState<number>(0);
  const [todayTrips, setTodayTrips] = useState<number>(0);
  const [rating, setRating] = useState<number>(0);
  const [availableTripsCount, setAvailableTripsCount] = useState<number>(0);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [tripModalVisible, setTripModalVisible] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<any | null>(null); // This is now the "active trip"
  const [newTripToast, setNewTripToast] = useState<any | null>(null);
  const [activeTrips, setActiveTrips] = useState<number>(0);
  const [otp, setOtp] = useState<string>(""); // <-- Added for OTP logic

  
  // protect against concurrent refreshes
  const isRefreshingRef = useRef(false);

  /* -------------------------
     Fetch captain stats
     ------------------------ */
  const fetchCaptainStats = useCallback(async () => {
    try {
      console.log("[DEBUG] fetchCaptainStats: starting");
      const response = await captainTripApi.getCaptainStats();
      console.log("[DEBUG] fetchCaptainStats: response", response?.data);
      if (response?.data) {
        setEarnings(response.data.earnings || 0);
        setTodayTrips(response.data.todayTrips || 0);
        setRating(typeof response.data.rating === "number" ? response.data.rating : 0);
        if (typeof response.data.activeTrips === "number") setActiveTrips(response.data.activeTrips);
      }
      console.log("[DEBUG] fetchCaptainStats: finished");
    } catch (error) {
      console.error("[ERROR] fetchCaptainStats:", error);
    }
  }, []);

  /* -------------------------
     Request location permission & get location
     ------------------------ */
  const requestLocationPermission = useCallback(async () => {
    try {
      console.log("[DEBUG] requestLocationPermission: requesting");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("[WARN] Location permission not granted - falling back to default coords (Mumbai)");
        setCurrentLocation({ lat: 19.0760, lng: 72.8777 });
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const validation = validateCoordinate(location.coords.latitude, location.coords.longitude);
      setCurrentLocation({ lat: validation.latitude, lng: validation.longitude });
      console.log("[DEBUG] requestLocationPermission: got location", validation);
    } catch (error) {
      console.error("[ERROR] Location error:", error);
      setCurrentLocation({ lat: 19.0760, lng: 72.8777 });
    }
  }, []);

  /* -------------------------
     Fetch nearby trips
     ------------------------ */
  const fetchNearbyTrips = useCallback(async () => {
    if (!currentLocation) {
      console.log("[DEBUG] fetchNearbyTrips: skipped - no currentLocation yet");
      return;
    }
    try {
      console.log("[DEBUG] fetchNearbyTrips: requesting trips for", currentLocation);
      const response = await captainTripApi.getNearbyTrips({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        radius: 10,
      });
      console.log("[DEBUG] fetchNearbyTrips: raw response", response?.data);

      // Filter out trips that are already active, completed, etc.
      const safeTrips = (response.data?.trips || [])
        .filter((trip: any) => {
          if (!trip || !trip.id || !trip.pickup) return false;
          // Filter out trips that are NOT pending
          if (trip.status && trip.status !== "pending" && trip.status !== "pending_assignment") return false;
          // Also filter out the current active trip, if it exists
          if (currentTrip && trip.id === currentTrip.id) return false;
          const pVal = validateCoordinate(trip.pickup.lat, trip.pickup.lng);
          return pVal.isValid;
        })
        .map((trip: any) => {
          const pickupValidation = validateCoordinate(trip.pickup.lat, trip.pickup.lng);
          const deliveryValidation = validateCoordinate(trip.delivery?.lat, trip.delivery?.lng);
          return {
            ...trip,
            status: trip.status || 'pending', // <-- Ensure status is set
            pickup: { ...trip.pickup, lat: pickupValidation.latitude, lng: pickupValidation.longitude },
            delivery: { ...trip.delivery, lat: deliveryValidation.latitude, lng: deliveryValidation.longitude },
          };
        });

      const sorted = [...safeTrips].sort((a: any, b: any) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });

      console.log("[DEBUG] fetchNearbyTrips: pendingTrips count", sorted.length);
      setAvailableTrips(sorted);
      setAvailableTripsCount(sorted.length);

      if (sorted.length > 0 && !selectedTrip) {
        setSelectedTrip(sorted[0]);
      }
    } catch (error: any) {
      console.error("[ERROR] fetchNearbyTrips:", error);
      if (String(error?.message || "").includes("Network Error")) {
        Alert.alert("Connection Error", "Unable to connect to server. Please check your internet connection and try again.");
      }
      setAvailableTrips([]);
      setAvailableTripsCount(0);
    }
  }, [currentLocation, selectedTrip, currentTrip]); // <-- Added currentTrip dependency

  /* -------------------------
     Pull to refresh
     ------------------------ */
  const onRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setRefreshing(true);
    console.log("[DEBUG] onRefresh: started");
    try {
      await Promise.allSettled([fetchNearbyTrips(), fetchCaptainStats()]);
    } catch (error) {
      console.error("[ERROR] onRefresh:", error);
    } finally {
      setRefreshing(false);
      isRefreshingRef.current = false;
      console.log("[DEBUG] onRefresh: finished");
    }
  }, [fetchNearbyTrips, fetchCaptainStats]);

  /* -------------------------
     Open route in Google Maps
     ------------------------ */
  // This function is now used for both pickup and destination
  const openInGoogleMaps = useCallback((trip: any, leg: 'pickup' | 'destination' = 'pickup') => {
    if (!trip || !trip.pickup || !trip.delivery) {
      console.warn("[WARN] openInGoogleMaps: invalid trip data", trip);
      return;
    }
    
    const startLat = currentLocation?.lat || trip.pickup.lat;
    const startLng = currentLocation?.lng || trip.pickup.lng;
    
    const destLat = leg === 'pickup' ? trip.pickup.lat : trip.delivery.lat;
    const destLng = leg === 'pickup' ? trip.pickup.lng : trip.delivery.lng;
    const destAddress = leg === 'pickup' ? trip.pickup.address : trip.delivery.address;

    const googleMapsUrl = `http://googleusercontent.com/maps/google.com/0{startLat},${startLng}/${destLat},${destLng}`;
    
    Alert.alert(
      `Maps to ${leg === 'pickup' ? 'Pickup' : 'Destination'}`,
      `Maps to: ${destAddress || leg}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open in Google Maps",
          onPress: () => {
            Linking.openURL(googleMapsUrl).catch((err) => {
              console.error("Error opening Google Maps:", err);
              Alert.alert("Error", "Could not open Google Maps");
            });
          },
        },
      ]
    );
  }, [currentLocation]); // <-- Added currentLocation dependency

  /* -------------------------
     Trip handlers
     ------------------------ */
  const handleTripPress = useCallback((trip: any) => {
    // Ensure status is set, default to 'pending'
    setCurrentTrip({ ...trip, status: trip.status || 'pending' });
    setTripModalVisible(true);
  }, []);

  const handleTripAcceptance = useCallback((trip: any) => {
    // This function is called *after* accepting, so navigate to pickup
    openInGoogleMaps(trip, 'pickup');
  }, [openInGoogleMaps]);

  // ***** LOGIC CHANGE 1: handleAcceptTrip *****
  // Now updates state instead of closing modal
  const handleAcceptTrip = useCallback(async (tripId: string) => {
    if (!currentTrip) return;
    try {
      console.log("[DEBUG] handleAcceptTrip:", tripId);
      const tripType = currentTrip.type || "transport";
      await captainTripApi.acceptTrip(tripId, tripType);
      console.log("[DEBUG] handleAcceptTrip: accepted on server", tripId);
      
      await fetchCaptainStats();
      
      // Update currentTrip state to 'accepted'
      setCurrentTrip(prev => ({ ...prev, status: 'accepted' }));

      // remove accepted trip from available list
      setAvailableTrips(prev => prev.filter(t => t.id !== tripId));
      setAvailableTripsCount(prev => Math.max(0, prev - 1));
      
      // Open maps for navigation to pickup
      handleTripAcceptance(currentTrip);

    } catch (error) {
      console.error("[ERROR] handleAcceptTrip:", error);
      Alert.alert("Error", "Could not accept trip. Please try again.");
      throw error; // Re-throw to be caught by the modal's onPress
    }
  }, [currentTrip, fetchCaptainStats, handleTripAcceptance]);

  // ***** LOGIC CHANGE 2: handleReachedPickup *****
  const handleReachedPickup = useCallback(async (tripId: string) => {
    if (!currentTrip) return;
    try {
      console.log("[DEBUG] handleReachedPickup:", tripId);
      const tripType = currentTrip.type || "transport";
      await captainTripApi.reachedPickup(tripId, tripType);
      console.log("[DEBUG] handleReachedPickup: success", tripId);

      // Update currentTrip state to 'reached_pickup'
      setCurrentTrip(prev => ({ ...prev, status: 'reached_pickup' }));
      Alert.alert("Success", "Arrived at pickup. Please collect OTP from customer to start the trip.");

    } catch (error) {
      console.error("[ERROR] handleReachedPickup:", error);
      Alert.alert("Error", "Could not update status. Please try again.");
      throw error;
    }
  }, [currentTrip]);

  // ***** LOGIC CHANGE 3: handleStartTrip *****
  const handleStartTrip = useCallback(async (tripId: string) => {
    if (!currentTrip) return;

    // --- OTP DUMMY VERIFICATION ---
    // In a real app, you'd send this OTP to your backend for verification
    if (!otp || otp.length < 4) {
      Alert.alert("Invalid OTP", "Please enter a valid 4-digit OTP.");
      return; // Stop execution
    }
    console.log(`[DEBUG] Verifying OTP: ${otp} for trip ${tripId}`);
    // --- End of dummy verification ---

    try {
      console.log("[DEBUG] handleStartTrip:", tripId);
      // Optional: API call to start trip
      // await captainTripApi.startTrip(tripId, { otp: otp }); 

      // Update currentTrip state to 'in_transit'
      setCurrentTrip(prev => ({ ...prev, status: 'in_transit' }));
      setOtp(""); // Clear OTP
      Alert.alert("Trip Started", "You can now navigate to the destination.");

    } catch (error) {
      console.error("[ERROR] handleStartTrip:", error);
      Alert.alert("Error", "Could not start trip. Please check OTP and try again.");
      throw error;
    }
  }, [currentTrip, otp]); // <-- Added otp dependency

  // ***** LOGIC CHANGE 4: handleNavigateToDestination *****
  const handleNavigateToDestination = useCallback((trip: any) => {
    // This function is now called *after* starting, so navigate to destination
    openInGoogleMaps(trip, 'destination');
  }, [openInGoogleMaps]);

  // ***** LOGIC CHANGE 5: handleCompleteTrip *****
  const handleCompleteTrip = useCallback(async (tripId: string) => {
    if (!currentTrip) return;
    try {
      console.log("[DEBUG] handleCompleteTrip:", tripId);
      const tripType = currentTrip.type || "transport";
      await captainTripApi.reachedDestination(tripId, tripType).catch((err: any) => {
        if (err?.response?.status >= 200 && err?.response?.status < 300) return { success: true };
        throw err;
      });

      console.log("[DEBUG] handleCompleteTrip: processed", tripId);
      Alert.alert("Trip Completed!", "Great job!");
      
      // Refresh stats
      await fetchCaptainStats();
      
      // FINALLY: Close modal and clear the active trip
      setTripModalVisible(false);
      setCurrentTrip(null);

    } catch (error: any) {
      console.log("[WARN] handleCompleteTrip fallback:", error);
      Alert.alert("Error", "Could not complete trip. Please try again.");
      // Don't close modal, let user retry
    }
  }, [currentTrip, fetchCaptainStats]);

  // ***** LOGIC CHANGE 6: handleCloseTripModal *****
  const handleCloseTripModal = useCallback(() => {
    setTripModalVisible(false);
    // Do not set currentTrip to null if it's in progress
    // Only set to null if it's 'pending'
    if (currentTrip?.status === 'pending' || !currentTrip?.status) {
      setCurrentTrip(null);
    }
    setOtp(""); // Clear OTP on close
  }, [currentTrip]); // <-- Added currentTrip dependency

  /* -------------------------
     Online toggle
     ------------------------ */
  const handleOnlineToggle = useCallback(async (value: boolean) => {
    console.log("[DEBUG] handleOnlineToggle:", value);
    setIsOnline(value);
    if (value) {
      Alert.alert("🚀 You're Online!", "You can now receive trip requests.");
      await fetchNearbyTrips();
      const s = getSocket();
      if (s && currentLocation) {
        console.log("[DEBUG] handleOnlineToggle: emitting location to socket");
        emitLocationUpdate(s, currentLocation);
      }
    } else {
      setAvailableTrips([]);
      setSelectedTrip(null);
      Alert.alert("📴 You're Offline", "You won't receive new trip requests.");
    }
  }, [fetchNearbyTrips, currentLocation]);

  /* -------------------------
     Initialization
     ------------------------ */
  useEffect(() => {
    let mounted = true;
    const initializeCaptain = async () => {
      console.log("[DEBUG] initializeCaptain: start");
      if (!captain) {
        console.log("[DEBUG] initializeCaptain: no captain - redirect to auth");
        router.replace("/(app)/(auth)");
        return;
      }

      setIsOnline(false);
      setLoading(true);

      try {
        const storedToken = await SecureStore.getItemAsync("captainToken");
        if (storedToken) {
          console.log("[DEBUG] initializeCaptain: setting token from SecureStore");
          setCaptainApiToken(storedToken);
        } else if (token) {
          console.log("[DEBUG] initializeCaptain: saving token to SecureStore");
          setCaptainApiToken(token);
          await SecureStore.setItemAsync("captainToken", token);
        }
      } catch (e) {
        console.warn("[WARN] Failed to load token from SecureStore", e);
        if (token) setCaptainApiToken(token);
      }

      try {
        const profile = await captainTripApi.getProfile();
        console.log("[DEBUG] initializeCaptain: profile", profile?.data);
        if (profile?.data?.city) setCity(profile.data.city);
        else if (captain?.city) setCity(captain.city);
        else {
          setTimeout(async () => {
            try {
              const p2 = await captainTripApi.getProfile();
              if (p2?.data?.city) setCity(p2.data.city);
            } catch (e) {
              console.warn("[WARN] retry profile failed", e);
            }
          }, 500);
        }
      } catch (e) {
        console.warn("[WARN] getProfile failed:", e);
        if (captain?.city) setCity(captain.city);
      }

      await requestLocationPermission();
      await fetchCaptainStats();

      // TODO: Check for an active, unfinished trip from the server
      // This is a complex step, but for now we assume no active trips on load

      if (mounted) {
        setLoading(false);
      }
      console.log("[DEBUG] initializeCaptain: done");
    };

    initializeCaptain();

    return () => {
      mounted = false;
    };
  }, [captain, token, router, requestLocationPermission, fetchCaptainStats]);

  /* -------------------------
     Effect: fetch trips when online/location changes
     ------------------------ */
  useEffect(() => {
    if (isOnline && currentLocation) {
      console.log("[DEBUG] online & location present - fetching trips");
      fetchNearbyTrips();
    } else if (!isOnline) {
      setAvailableTrips([]);
      setSelectedTrip(null);
    }
  }, [isOnline, currentLocation, fetchNearbyTrips]);

  /* -------------------------
     Socket setup & listeners
     ------------------------ */
  useEffect(() => {
    let mounted = true;
    let socketInstance: any = null;

    const setup = async () => {
      try {
        if (!token) {
          console.log("[DEBUG] socket setup: no token - skipping");
          return;
        }

        console.log("[DEBUG] socket setup: connecting...");
        socketInstance = await connectSocket(token); 
        console.log("[DEBUG] socket setup: connected", !!socketInstance);

        if (!mounted) return;

        try {
          socketInstance.off?.("trip:assigned");
          socketInstance.off?.("new-trip");
          socketInstance.off?.("stats:updated");
        } catch (e) {}

        setupSocketListeners(socketInstance, {
          onTripAssigned: (trip: any) => {
            console.log("[SOCKET] onTripAssigned:", trip?.id);
            // Don't add if it's the trip we already accepted
            if (currentTrip && currentTrip.id === trip.id) return;

            setAvailableTrips(prev => {
              const exists = prev.some(t => t.id === trip.id);
              if (exists) return prev;
              return [{...trip, status: 'pending'}, ...prev];
            });
            setAvailableTripsCount(prev => prev + 1);
            setNewTripToast(trip);
            setTimeout(() => setNewTripToast(null), 5000);
            fetchCaptainStats().catch(e => console.warn("[WARN] fetchCaptainStats after onTripAssigned failed", e));
          },
          onTripCancelled: (data: any) => {
            console.log("[SOCKET] onTripCancelled:", data);
            const tripId = data?.tripId;
            if (!tripId) return;
            // Check if it's our current trip that got cancelled
            if (currentTrip && currentTrip.id === tripId) {
              Alert.alert("Trip Cancelled", "The user has cancelled this trip.");
              setTripModalVisible(false);
              setCurrentTrip(null);
            }
            setAvailableTrips(prev => prev.filter(t => t.id !== tripId));
            setAvailableTripsCount(prev => Math.max(0, prev - 1));
            fetchCaptainStats().catch(e => console.warn("[WARN] fetchCaptainStats after onTripCancelled failed", e));
          },
        });

        socketInstance.on?.("stats:updated", (data: any) => {
          console.log("[SOCKET] stats:updated", data);
          if (data.todayTrips !== undefined) setTodayTrips(data.todayTrips);
          if (data.todayEarnings !== undefined) setEarnings(data.todayEarnings);
          if (data.activeTrips !== undefined) setActiveTrips(data.activeTrips);
        });

        if (currentLocation) {
          console.log("[DEBUG] socket setup: emitting initial location");
          emitLocationUpdate(socketInstance, currentLocation);
        }
      } catch (e) {
        console.warn("[WARN] Socket init failed:", e);
      }
    };
    setup();

    return () => {
      mounted = false;
      try {
         const s = getSocket();
        if (s) {
          s.off?.("trip:assigned");
          s.off?.("new-trip");
          s.off?.("stats:updated");
        }
      } catch (e) {
        console.warn("[WARN] cleanup sockets failed", e);
      }
    };
  }, [token, currentLocation, fetchCaptainStats, currentTrip]); // <-- Added currentTrip

  /* -------------------------
     Polling fallback while online
     ------------------------ */
  useEffect(() => {
    if (!isOnline) return;
    const id = setInterval(() => {
      console.log("[DEBUG] polling: fetchNearbyTrips()");
      fetchNearbyTrips();
    }, 15000);
    return () => clearInterval(id);
  }, [isOnline, fetchNearbyTrips]);

  /* -------------------------
     Emit location when it changes (if socket exists)
     ------------------------ */
  useEffect(() => {
    const s = getSocket();
    if (s && currentLocation && isOnline) {
      console.log("[DEBUG] emitLocationUpdate: emitting new location");
      emitLocationUpdate(s, currentLocation);
    }
  }, [currentLocation, isOnline]);

  /* -------------------------
     Map region (bulletproof)
     ------------------------ */
  const mapRegion = useMemo(() => {
    const defaultCoords = { latitude: 19.0760, longitude: 72.8777 };
    if (!currentLocation) return { ...defaultCoords, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    const validation = validateCoordinate(currentLocation.lat, currentLocation.lng);
    return { latitude: validation.latitude, longitude: validation.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 };
  }, [currentLocation]);

  /* -------------------------
     Marker component (memoized)
     ------------------------ */
  const TripMarker = React.memo(({ trip, onPress }: { trip: any; onPress: () => void }) => {
    const pickupValidation = validateCoordinate(trip.pickup.lat, trip.pickup.lng);
    if (!pickupValidation.isValid) return null;
    return (
      <Marker
        coordinate={{ latitude: pickupValidation.latitude, longitude: pickupValidation.longitude }}
        title={`${(trip.type || "TRIP").toString().toUpperCase()} Trip`}
        description={`₹${trip.fareEstimate || 0} - ${trip.vehicleType || "vehicle"}`}
        pinColor="#4CAF50" // This is already a nice green, let's keep it
        onPress={onPress}
      />
    );
  });

  /* -------------------------
     Loading screen
     ------------------------ */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {/* THEME: Use new green color */}
        <ActivityIndicator size="large" color={newPrimaryColor} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  /* -------------------------
     UI state data for RideRequestCard: show most recent available trip
     ------------------------ */
  // ***** LOGIC CHANGE 7: mostRecentTrip *****
  // This should NOT show the active trip
  const mostRecentTrip = availableTrips?.[0] ?? null;

  /* -------------------------
     Render
     ------------------------ */
  return (
    <View style={styles.container}>
      {/* THEME: Gradient updated to green */}
      <LinearGradient colors={newGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerGradient}>
        <View style={styles.headerTop}>
          <View style={styles.leftHeader}>
            <View style={styles.avatarOuter}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarLetter}>
                  {/* HEADER: Show first letter of name */}
                  {captain?.name ? captain.name[0].toUpperCase() : "C"}
                </Text>
              </View>
            </View>
            <Text style={styles.captainLabel}>Captain</Text>
          </View>
          <View style={styles.rightHeader}>
            <View style={styles.notification}>
              <Feather name="bell" size={20} color="#374151" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>1</Text>
              </View>
            </View>
            <View style={styles.profileCircle}>
              <Feather name="user" size={18} color="#374151" />
            </View>
          </View>
        </View>

        <View>
          {/* HEADER: Show captain's name */}
          <Text style={styles.greeting}>Hey {captain?.name || "Captain"} ✨</Text>
          {/* HEADER: Show vehicle type and city */}
          <Text style={styles.greetingSub}>
            {(captain?.vehicleType || "Vehicle").toUpperCase()} • {city || "Fetching Location..."}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
      
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={newPrimaryColor} />}>
        
        {/* --- Earnings card --- */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.smallMuted}>Today's Earnings</Text>
              <Text style={styles.amount}>₹{earnings}</Text>
              <Text style={styles.tinyMuted}> {todayTrips} rides · active</Text>
            </View>
            <View style={styles.iconBox}>
              {/* THEME: Use new green color */}
              <Feather name="wallet" size={22} color={newPrimaryColor} />
            </View>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.outlineBtn}>
              <Text style={styles.outlineBtnText}>View Payouts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Earning Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Availability card --- */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Availability</Text>
              <Text style={styles.muted}>Go online and start accepting rides</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleOnlineToggle(!isOnline)}
              activeOpacity={0.8}
              // THEME: Use new green color for toggle
              style={[styles.toggle, { backgroundColor: isOnline ? newPrimaryColor : "#D1D5DB" }]}
            >
              <View style={[styles.toggleCircle, { transform: [{ translateX: isOnline ? 22 : 2 }] }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ***** RIDE REQUEST CARD LOGIC (THEME UPDATED) ***** */}
        {/* THEME: Use new green color for new trip, success color for active trip */}
        <View style={[styles.rideCard, { backgroundColor: mostRecentTrip ? newPrimaryColor : (currentTrip ? successColor : "#f3f4f6") }]}>
          {/* Case 1: Active Trip in Progress */}
          {currentTrip && currentTrip.status !== 'pending' ? (
            <>
              <Text style={styles.rideTag}>Active Trip In Progress</Text>
              <Text style={styles.rideTitle}>
                {(currentTrip.pickup?.address?.split("•")?.[0] || "Pickup")} → {(currentTrip.delivery?.address?.split("•")?.[0] || "Destination")}
              </Text>
              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.priceText}>₹{currentTrip.fareEstimate || 0}</Text>
                  <Text style={styles.rideId}>{currentTrip.id || "RD-0000"}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.actionWhite, { flex: 0, paddingHorizontal: 20 }]}
                  onPress={() => setTripModalVisible(true)} // Re-open the modal
                >
                  <Text style={styles.acceptText}>View Status</Text>
                </TouchableOpacity>
              </View>
            </>
          /* Case 2: New Incoming Trip */
          ) : mostRecentTrip ? (
            <>
              <Text style={styles.rideTag}>Incoming Ride Request</Text>
              <Text style={styles.rideTitle}>
                {(mostRecentTrip.pickup?.address?.split("•")?.[0] || "Pickup")} → {(mostRecentTrip.delivery?.address?.split("•")?.[0] || "Destination")}
            _ </Text>

              <View style={styles.row}>
                <View style={styles.infoInline}>
                  {/* THEME: Use new accent color */}
                  <Feather name="map-pin" size={14} color={newAccentColor} />
                  <Text style={styles.infoText}>
                    {mostRecentTrip.distanceKm 
                          ? `${mostRecentTrip.distanceKm} km` 
                          : (mostRecentTrip.estimatedDistance ? `${mostRecentTrip.estimatedDistance.toFixed?.(1) ?? "—"} km` : "— km")}
                  </Text>
                </View>
                <View style={styles.infoInline}>
                  {/* THEME: Use new accent color */}
                  <Feather name="clock" size={14} color={newAccentColor} />
                  <Text style={styles.infoText}>ETA {mostRecentTrip.eta || "6"} min</Text>
                </View>
              </View>

              <View style={styles.priceRow}>
                <View />
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.priceText}>₹{mostRecentTrip.fareEstimate || 0}</Text>
                  <Text style={styles.rideId}>{mostRecentTrip.id || "RD-0000"}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionWhite]}>
                  <Text style={styles.callText}>Call Rider</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionWhite]}
                  onPress={() => {
                    // Open modal with this trip
                      handleTripPress(mostRecentTrip);
                  }}
                >
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </>
          /* Case 3: No active trip AND no new trips */
          ) : (
            <View style={{ paddingVertical: 20 }}>
              <Text style={styles.noTripTitle}>No trip available</Text>
              <Text style={styles.noTripSub}>{isOnline ? "Looking for trips..." : "Go online to see trips"}</Text>
            </View>
          )}
        </View>

        {/* --- Stats Grid --- */}
        <View style={styles.card}>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Rating</Text>
              <View style={styles.rowCenter}>
                <Text style={styles.gridValue}>{rating || 0}</Text>
                {/* Star color should stay yellow */}
                <Feather name="star" size={18} color="#FBBF24" />
              </View>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Acceptance</Text>
              <Text style={styles.gridValue}>92%</Text>
            </View>
            <View style={[styles.gridItem, styles.gridTopBorder]}>
              <Text style={styles.gridLabel}>Trips</Text>
              <Text style={styles.gridValue}>{todayTrips}</Text>
            </View>
            <View style={[styles.gridItem, styles.gridTopBorder]}>
              <Text style={styles.gridLabel}>Cancellation</Text>
              <Text style={styles.gridValue}>3%</Text>
            </View>
          </View>
        </View>

        {/* --- Map --- */}
        <View style={styles.mapContainer}>
          <MapView provider={PROVIDER_GOOGLE} style={styles.map} region={mapRegion} showsUserLocation showsMyLocationButton={true}>
            {currentLocation && (
              // THEME: Use new green color for captain's pin
              <Marker coordinate={{ latitude: currentLocation.lat, longitude: currentLocation.lng }} title="Your Location" pinColor={newPrimaryColor} />
            )}
            {/* Show active trip pickup marker if it exists */}
            {currentTrip && currentTrip.status !== 'pending' && (
              <TripMarker key={currentTrip.id} trip={currentTrip} onPress={() => handleNavigateToDestination(currentTrip)} />
            )}
            {/* Show available trip markers */}
            {availableTrips.map((t) => (
              <TripMarker key={t.id} trip={t} onPress={() => handleTripPress(t)} />
            ))}
          </MapView>

          {availableTrips.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tripSelector} contentContainerStyle={{ paddingHorizontal: 8 }}>
              {availableTrips.map((trip) => (
                <Pressable
                  key={trip.id}
                  style={[styles.tripChip, selectedTrip?.id === trip.id && styles.tripChipActive]}
                  onPress={() => setSelectedTrip(trip)}
                >
                  <Text style={styles.tripChipText}>{(trip.type || "TRIP").toUpperCase()}</Text>
                  <Text style={styles.tripChipFare}>₹{trip.fareEstimate || 0}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* --- Trips list --- */}
        <View style={styles.tripsContainer}>
          <View style={styles.tripsHeader}>
            <Text style={styles.tripsTitle}>Available Trips ({availableTrips.length})</Text>
            <Pressable onPress={onRefresh} style={styles.refreshBtn}>
              <Text style={styles.refreshTxt}>Refresh</Text>
            </Pressable>
          </View>
          {availableTrips.map((trip) => (
            <Pressable key={trip.id} style={styles.tripListItem} onPress={() => handleTripPress(trip)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tripType}>{(trip.type || "TRIP").toUpperCase()}</Text>
                <Text style={styles.tripFromTo}>{trip.pickup?.address || "Pickup"} → {trip.delivery?.address || "Delivery"}</Text>
                <Text style={styles.tripMeta}>₹{trip.fareEstimate || 0} • {trip.distanceKm ? `${trip.distanceKm} km` : "— km"}</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </Pressable>
          ))}
          {availableTrips.length === 0 && (
            <View style={styles.noTripsBox}>
              <Text style={styles.noTripsTitle}>{isOnline ? "No trips available nearby" : "Go online to see trips"}</Text>
              <Text style={styles.noTripsSub}>{isOnline ? "Trips will appear here when available" : "Toggle the switch above to start receiving trips"}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      
      {/* --- Bottom navigation (THEME UPDATED) --- */}
      <View style={styles.bottomNav}>
        <View style={styles.bottomInner}>
          <NavButton id="map" label="Map" active={false} onPress={() => {}} />
          <NavButton id="trips" label="Trips" active={true} onPress={() => {}} />
          <NavButton id="earnings" label="Earnings" active={false} onPress={() => {}} />
          <NavButton id="support" label="Support" active={false} onPress={() => {}} />
        </View>
      </View>

      {/* ***** MODAL LOGIC FULLY REBUILT (THEME UPDATED) ***** */}
      <Modal visible={tripModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              {/* --- Modal Header --- */}
              <Text style={styles.modalTitle}>
                {currentTrip?.status === 'pending' || !currentTrip?.status ? "New Trip Request" : "Active Trip"}
              </Text>
              
              {currentTrip ? (
                <>
                  {/* --- Trip Details (always shown) --- */}
                  <Text style={styles.modalLabel}>From</Text>
                  <Text style={styles.modalText}>{currentTrip.pickup?.address || "Pickup address"}</Text>

                  <Text style={styles.modalLabel}>To</Text>
                  <Text style={styles.modalText}>{currentTrip.delivery?.address || "Delivery address"}</Text>

                  <Text style={styles.modalLabel}>Fare</Text>
                  <Text style={styles.modalText}>₹{currentTrip.fareEstimate || 0}</Text>

                  <View style={{ height: 12, borderBottomWidth: 1, borderColor: '#E5E7EB', marginVertical: 20 }} />

                  {/* --- CONDITIONAL BUTTONS (STATE MACHINE) --- */}

                  {/* ===== STATE 1: PENDING (Show Accept) ===== */}
                  {(currentTrip.status === 'pending' || !currentTrip.status) && (
                    <TouchableOpacity style={styles.modalBtnPrimary} onPress={async () => {
                      try {
                        await handleAcceptTrip(currentTrip.id);
                        // DO NOT close modal here, handleAcceptTrip updates state
                      } catch (e) {
                        console.log("Accept failed, modal remains open");
                      }
                    }}>
                      <Text style={styles.modalBtnTextPrimary}>Accept Trip</Text>
                    </TouchableOpacity>
                  )}

                  {/* ===== STATE 2: ACCEPTED (Show Reached Pickup) ===== */}
                  {currentTrip.status === 'accepted' && (
                    <TouchableOpacity style={styles.modalBtnPrimary} onPress={async () => {
                      try {
                        await handleReachedPickup(currentTrip.id);
                      } catch (e) {
                        console.log("Reached pickup failed");
                      }
                    }}>
                      <Text style={styles.modalBtnTextPrimary}>I Have Reached Pickup</Text>
                    </TouchableOpacity>
                  )}

                  {/* ===== STATE 3: REACHED PICKUP (Show OTP + Start Trip) ===== */}
                  {currentTrip.status === 'reached_pickup' && (
                    <>
                      <Text style={styles.modalLabel}>Enter 4-Digit OTP</Text>
                      <TextInput
                       style={styles.otpInput}
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={4}
                        placeholder="1234"
                      />
                      <TouchableOpacity style={styles.modalBtnPrimary} onPress={async () => {
                        try {
                          await handleStartTrip(currentTrip.id);
                        } catch (e) {
                          console.log("Start trip failed");
                        }
                      }}>
                        <Text style={styles.modalBtnTextPrimary}>Start Trip</Text>
                    </TouchableOpacity>
  nbsp;               </>
                  )}

                  {/* ===== STATE 4: IN TRANSIT (Show Navigate + Complete) ===== */}
                  {currentTrip.status === 'in_transit' && (
                    <>
                      <TouchableOpacity style={styles.modalBtnPrimary} onPress={() => {
Note:                       handleNavigateToDestination(currentTrip);
                      }}>
                        <Text style={styles.modalBtnTextPrimary}>Navigate to Destination</Text>
                    </TouchableOpacity>

                        {/* THEME: Use success color for complete button */}
                      <TouchableOpacity style={[styles.modalBtnPrimary, { backgroundColor: successColor, marginTop: 12 }]} onPress={async () => {
                        try {
                          await handleCompleteTrip(currentTrip.id);
                     } catch (e) {
                          console.log("Complete trip failed");
                        }
                      }}>
                        <Text style={styles.modalBtnTextPrimary}>Complete Trip</Text>
                    </TouchableOpacity>
                    </>
                  )}

                  {/* --- Close Button (always shown) --- */}
                  <TouchableOpacity style={styles.modalBtnOutline} onPress={handleCloseTripModal}>
                    <Text style={styles.modalBtnTextOutline}>Close</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.modalText}>No trip selected</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

I       {/* --- New trip toast --- */}
      {newTripToast && (
        <Pressable style={styles.toast} onPress={() => { handleTripPress(newTripToast); setNewTripToast(null); }}>
          <Text style={styles.toastText}>New Trip • ₹{Math.round(newTripToast.fareEstimate || 0)} • Tap to view</Text>
        </Pressable>
      )}
    </View>
  );
}

/* -------------------------
   Small inline components
   ------------------------ */
// THEME: Updated NavButton active color
function NavButton({ id, label, active, onPress }: { id: string; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.navBtn} onPress={onPress}>
      <Feather name={id === "map" ? "map-pin" : id === "trips" ? "list" : id === "earnings" ? "wallet" : "life-buoy"} size={20} color={active ? newPrimaryColor : "#9CA3AF"} />
      <Text style={[styles.navLabel, { color: active ? newPrimaryColor : "#9CA3AF" }]}>{label}</Text>
    </Pressable>
  );
}


/* -------------------------
   Styles (THEME UPDATED)
   ------------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Use a slightly off-white bg
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: newPrimaryColor, // THEME
  },
  headerGradient: {
    paddingTop: 60, 
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: newPrimaryColor, // THEME
  },
  captainLabel: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#064E3B', // Darker green for contrast on light gradient
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notification: {
    position: 'relative',
    marginRight: 12,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444', // Keep red for notifications
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#064E3B', // THEME: Darker green
  },
  greetingSub: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857', // THEME: Mid green
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom nav
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smallMuted: {
    fontSize: 12,
    color: '#6B7280',
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginVertical: 4,
  },
  tinyMuted: {
    fontSize: 12,
    color: '#6B7280',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: newAccentColor, // THEME
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  outlineBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: newPrimaryColor, // THEME
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  muted: {
    fontSize: 14,
    color: '#6B7280',
   marginTop: 2,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  rideCard: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  rideTag: {
    fontSize: 12,
    fontWeight: '600',
    color: newAccentColor, // THEME
    marginBottom: 8,
  },
  rideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
  infoInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  priceText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rideId: {
    fontSize: 12,
    color: newAccentColor, // THEME
    marginTop: -4,
  },
  actionWhite: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  callText: {
    fontSize: 14,
    fontWeight: '600',
    color: newPrimaryColor, // THEME
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '600',
    color: newPrimaryColor, // THEME
  },
  noTripTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
  noTripSub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '50%',
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  gridLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridTopBorder: {
    borderTopWidth: 1,
   borderTopColor: '#E5E7EB',
  },
  mapContainer: {
    height: 250,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  tripSelector: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
 },
  tripChip: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tripChipActive: {
    backgroundColor: newPrimaryColor, // THEME
  },
  tripChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  tripChipFare: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 2,
  },
  tripsContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  tripsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  refreshBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: newAccentColor, // THEME
    borderRadius: 8,
  },
  refreshTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: newPrimaryColor, // THEME
  },
  tripListItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tripType: {
    fontSize: 12,
    fontWeight: '600',
    color: newPrimaryColor, // THEME
    marginBottom: 4,
  },
  tripFromTo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
  },
  tripMeta: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 6,
  },
  noTripsBox: {
    backgroundColor: '#FFFFFF', // Changed from F9FAFB for consistency
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  noTripsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  noTripsSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
   backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bottomInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60, // Adjust as needed
    paddingBottom: 10, // For home indicator
    paddingTop: 8,
  },
  navBtn: {
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 12,
   fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
   maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  modalText: {
    fontSize: 16,
    color: '#1F2937',
  },
  otpInput: {
    fontSize: 20,
   fontWeight: 'bold',
    color: '#1F2937',
    borderBottomWidth: 2,
    borderColor: '#D1D5DB',
    paddingVertical: 8,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
  },
  modalBtnPrimary: {
    backgroundColor: newPrimaryColor, // THEME
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12, // Reduced margin
  },
  modalBtnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBtnOutline: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalBtnTextOutline: {
    color: '#374151',
    fontSize: 16,
   fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    top: 60, // Adjust based on safe area
    left: 16,
   right: 16,
    backgroundColor: '#1F2937', // Kept dark for contrast
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
   fontWeight: '600',
    textAlign: 'center',
  },
});