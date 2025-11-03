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
  TextInput,
  AppState,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { Feather } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";

// Keep these imports pointing to your existing helpers
import { Colors } from "@/constants/colors";
import { captainTripApi, setCaptainApiToken } from "../lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  connectSocket,
  setupSocketListeners,
  emitLocationUpdate,
  getSocket,
} from "../lib/socket";

const { width, height } = Dimensions.get("window");

// --- THEME ---
const newPrimaryColor = "#007AFF";
const newAccentColor = "#D1FAE5";
const newGradient: readonly [string, string] = ["#007AFF", "#007AFF"];
const successColor = "#16A34A";
const errorColor = "#EF4444";
const warningColor = "#FBBF24";

/* -------------------------
     Notification Handler
     ------------------------ */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/* -------------------------
     Coordinate Validation
     ------------------------ */
const validateCoordinate = (lat: any, lng: any) => {
  const defaultCoords = { latitude: 19.0760, longitude: 72.8777 }; // Mumbai
  try {
    const latitude = parseFloat(String(lat));
    const longitude = parseFloat(String(lng));
    if (isNaN(latitude) || isNaN(longitude))
      return { isValid: false, ...defaultCoords };
    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return { isValid: false, ...defaultCoords };
    }
    if (latitude === 0 && longitude === 0)
      return { isValid: false, ...defaultCoords };
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
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
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
  const [otp, setOtp] = useState<string>("");

  // refs
  const isRefreshingRef = useRef(false);
  const appState = useRef(AppState.currentState);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  /* -------------------------
       Fetch captain stats
       ------------------------ */
  const fetchCaptainStats = useCallback(async () => {
    try {
      console.log("[DEBUG] fetchCaptainStats: starting");
      const response = await captainTripApi.getCaptainStats();
      console.log("[DEBUG] fetchCaptainStats: response", response);
      if (response?.data) {
        setEarnings(response.data.earnings || 0);
        setTodayTrips(response.data.todayTrips || 0);
        setRating(
          typeof response.data.rating === "number" ? response.data.rating : 0
        );
        if (typeof response.data.activeTrips === "number")
          setActiveTrips(response.data.activeTrips);
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
        console.warn(
          "[WARN] Location permission not granted - falling back to default coords (Mumbai)"
        );
        setCurrentLocation({ lat: 19.076, lng: 72.8777 });
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const validation = validateCoordinate(
        location.coords.latitude,
        location.coords.longitude
      );
      setCurrentLocation({ lat: validation.latitude, lng: validation.longitude });
      console.log("[DEBUG] requestLocationPermission: got location", validation);
    } catch (error) {
      console.error("[ERROR] Location error:", error);
      setCurrentLocation({ lat: 19.076, lng: 72.8777 });
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
      console.log(
        "[DEBUG] fetchNearbyTrips: requesting trips for",
        currentLocation
      );
      const response = await captainTripApi.getNearbyTrips({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        radius: 10,
      });
      console.log("[DEBUG] fetchNearbyTrips: raw response", response?.data);

      const safeTrips = (response.data?.trips || [])
        .filter((trip: any) => {
          if (!trip || !trip.id || !trip.pickup) return false;
          if (
            trip.status &&
            trip.status !== "pending" &&
            trip.status !== "pending_assignment"
          )
            return false;
          if (currentTrip && trip.id === currentTrip.id) return false;
          const pVal = validateCoordinate(trip.pickup.lat, trip.pickup.lng);
          return pVal.isValid;
        })
        .map((trip: any) => {
          const pickupValidation = validateCoordinate(
            trip.pickup.lat,
            trip.pickup.lng
          );
          const deliveryValidation = validateCoordinate(
            trip.delivery?.lat,
            trip.delivery?.lng
          );
          return {
            ...trip,
            status: trip.status || "pending",
            pickup: {
              ...trip.pickup,
              lat: pickupValidation.latitude,
              lng: pickupValidation.longitude,
            },
            delivery: {
              ...trip.delivery,
              lat: deliveryValidation.latitude,
              lng: deliveryValidation.longitude,
            },
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
      } else if (sorted.length === 0) {
        setSelectedTrip(null);
      }
    } catch (error: any) {
      console.error("[ERROR] fetchNearbyTrips:", error);
      if (String(error?.message || "").includes("Network Error")) {
        Alert.alert(
          "Connection Error",
          "Unable to connect to server. Please check your internet connection and try again."
        );
      }
      setAvailableTrips([]);
      setAvailableTripsCount(0);
    }
  }, [currentLocation, selectedTrip, currentTrip]);

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
  const openInGoogleMaps = useCallback(
    (trip: any, leg: "pickup" | "destination" = "pickup") => {
      if (!trip || !trip.pickup || !trip.delivery) {
        console.warn("[WARN] openInGoogleMaps: invalid trip data", trip);
        return;
      }

      const startLat = currentLocation?.lat || trip.pickup.lat;
      const startLng = currentLocation?.lng || trip.pickup.lng;

      const destLat = leg === "pickup" ? trip.pickup.lat : trip.delivery.lat;
      const destLng = leg === "pickup" ? trip.pickup.lng : trip.delivery.lng;
      const destAddress =
        leg === "pickup" ? trip.pickup.address : trip.delivery.address;

      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${destLat},${destLng}&travelmode=driving`;

      Alert.alert(
        `Maps to ${leg === "pickup" ? "Pickup" : "Destination"}`,
        `Open navigation to: ${destAddress || leg}`,
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
    },
    [currentLocation]
  );

  /* -------------------------
       Trip handlers
       ------------------------ */
  const handleTripPress = useCallback((trip: any) => {
    setCurrentTrip({ ...trip, status: trip.status || "pending" });
    setTripModalVisible(true);
  }, []);

  const handleTripAcceptance = useCallback(
    (trip: any) => {
      openInGoogleMaps(trip, "pickup");
    },
    [openInGoogleMaps]
  );

  const handleAcceptTrip = useCallback(
    async (tripId: string) => {
      if (!currentTrip) return;
      try {
        console.log("[DEBUG] handleAcceptTrip:", tripId);
        const tripType = currentTrip.type || "transport";
        await captainTripApi.acceptTrip(tripId, tripType);
        console.log("[DEBUG] handleAcceptTrip: accepted on server", tripId);

        await fetchCaptainStats();

        setCurrentTrip((prev) => ({ ...prev, status: "accepted" }));

        setAvailableTrips((prev) => prev.filter((t) => t.id !== tripId));
        setAvailableTripsCount((prev) => Math.max(0, prev - 1));

        handleTripAcceptance(currentTrip);
      } catch (error) {
        console.error("[ERROR] handleAcceptTrip:", error);
        Alert.alert("Error", "Could not accept trip. Please try again.");
        throw error;
      }
    },
    [currentTrip, fetchCaptainStats, handleTripAcceptance]
  );

  const handleReachedPickup = useCallback(
    async (tripId: string) => {
      if (!currentTrip) return;
      try {
        console.log("[DEBUG] handleReachedPickup:", tripId);
        const tripType = currentTrip.type || "transport";
        // This API call (in the new backend) just verifies the trip is valid
        await captainTripApi.reachedPickup(tripId, tripType);
        console.log("[DEBUG] handleReachedPickup: success", tripId);

        // We update the local state to show the OTP input
        setCurrentTrip((prev) => ({ ...prev, status: "reached_pickup" }));
        Alert.alert(
          "Success",
          "Arrived at pickup. Please collect OTP from customer to start the trip."
        );
      } catch (error) {
        console.error("[ERROR] handleReachedPickup:", error);
        Alert.alert("Error", "Could not update status. Please try again.");
        throw error;
      }
    },
    [currentTrip]
  );

  // --- handleStartTrip (Pickup OTP) - Trip completes when OTP is verified ---
  const handleStartTrip = useCallback(
    async (tripId: string) => {
      if (!currentTrip) return;

      if (!otp || otp.length < 4) {
        Alert.alert("Invalid OTP", "Please enter a valid 4-digit OTP.");
        return;
      }
      console.log(`[DEBUG] Verifying OTP: ${otp} for trip ${tripId}`);

      try {
        const tripType = currentTrip.type || "transport";
        // Call verifyOtp endpoint - trip completes when pickup OTP is verified
        await captainTripApi.verifyOtp(tripId, tripType, {
          otp: otp,
          phase: "pickup",
        });

        console.log("[DEBUG] handleStartTrip: OTP Verified, Trip Completed");

        Alert.alert("Trip Completed!", "Great job! Your earnings have been updated.");

        await fetchCaptainStats(); // Refresh stats

        // Clean up UI - trip is complete
        setTripModalVisible(false);
        setCurrentTrip(null);
        setOtp(""); // Clear OTP input
      } catch (error: any) {
        console.error("[ERROR] handleStartTrip (Verify OTP):", error);
        const errorMsg =
          error?.response?.data?.message ||
          "Could not complete trip. Please check OTP and try again.";
        Alert.alert("Error", errorMsg);
        throw error; // Keep modal open
      }
    },
    [currentTrip, otp, fetchCaptainStats]
  );

  const handleCloseTripModal = useCallback(() => {
    setTripModalVisible(false);
    if (currentTrip?.status === "pending" || !currentTrip?.status) {
      setCurrentTrip(null);
    }
    setOtp("");
  }, [currentTrip]);

  /* -------------------------
       Online toggle
       ------------------------ */
  const handleOnlineToggle = useCallback(
    async (value: boolean) => {
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
    },
    [fetchNearbyTrips, currentLocation]
  );

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
          console.log(
            "[DEBUG] initializeCaptain: setting token from SecureStore"
          );
          setCaptainApiToken(storedToken);
        } else if (token) {
          console.log(
            "[DEBUG] initializeCaptain: saving token to SecureStore"
          );
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

        if (!mounted || !socketInstance) return; // Guard against async race condition

        try {
          socketInstance.off?.("trip:assigned");
          socketInstance.off?.("new-trip");
          socketInstance.off?.("stats:updated");
        } catch (e) {}

        setupSocketListeners(socketInstance, {
          onTripAssigned: (trip: any) => {
            console.log("[SOCKET] onTripAssigned:", trip?.id);
            if (currentTrip && currentTrip.id === trip.id) return;

            setAvailableTrips((prev) => {
              const exists = prev.some((t) => t.id === trip.id);
              if (exists) return prev;
              return [{ ...trip, status: "pending" }, ...prev];
            });
            setAvailableTripsCount((prev) => prev + 1);

            setNewTripToast(trip);
         setTimeout(() => setNewTripToast(null), 5000);

            fetchCaptainStats().catch((e) =>
              console.warn(
                "[WARN] fetchCaptainStats after onTripAssigned failed",
                e
              )
            );
          },
          onTripCancelled: (data: any) => {
            console.log("[SOCKET] onTripCancelled:", data);
            const tripId = data?.tripId;
            if (!tripId) return;
            if (currentTrip && currentTrip.id === tripId) {
              Alert.alert("Trip Cancelled", "The user has cancelled this trip.");
              setTripModalVisible(false);
              setCurrentTrip(null);
            }
            setAvailableTrips((prev) => prev.filter((t) => t.id !== tripId));
            setAvailableTripsCount((prev) => Math.max(0, prev - 1));
            fetchCaptainStats().catch((e) =>
              console.warn(
                "[WARN] fetchCaptainStats after onTripCancelled failed",
                e
              )
            );
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
        if (socketInstance) {
          console.log("[DEBUG] socket cleanup: removing listeners");
          socketInstance.off?.("trip:assigned");
          socketInstance.off?.("new-trip");
          socketInstance.off?.("stats:updated");
     }
      } catch (e) {
        console.warn("[WARN] cleanup sockets failed", e);
      }
    };
  }, [token, currentLocation, fetchCaptainStats, currentTrip]);

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
       AppState listener
       ------------------------ */
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          console.log("[DEBUG] App has come to the foreground!");
          if (isOnline) {
            await onRefresh();
          }
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isOnline, onRefresh]);

  /* -------------------------
       Push Notification setup
       ------------------------ */
  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      let token;
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        console.warn(
          "[WARN] Failed to get push token for push notification!"
        );
        return;
      }

      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log("[DEBUG] Expo Push Token:", token);
        // =================================================================
        // !! IMPORTANT !!
        // Send this 'token' to your backend server.
        // Example: await captainTripApi.updatePushToken(token);
        // =================================================================
      } catch (e) {
        console.error("[ERROR] Getting push token failed:", e);
      }
      return token;
    }

    registerForPushNotificationsAsync();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("[DEBUG] Notification Received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("[DEBUG] Notification Tapped:", response);
        const tripData = response.notification.request.content.data;
        if (tripData && tripData.id) {
          // handleTripPress(tripData);
        } else {
          onRefresh();
        }
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [onRefresh]);

  /* -------------------------
       Map region (bulletproof)
       ------------------------ */
  const mapRegion = useMemo(() => {
    const defaultCoords = { latitude: 19.076, longitude: 72.8777 };
    if (!currentLocation)
      return { ...defaultCoords, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    const validation = validateCoordinate(
      currentLocation.lat,
      currentLocation.lng
    );
    return {
      latitude: validation.latitude,
      longitude: validation.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [currentLocation]);

  /* -------------------------
       Marker component (memoized)
       ------------------------ */
  const TripMarker = React.memo(
    ({ trip, onPress }: { trip: any; onPress: () => void }) => {
      const pickupValidation = validateCoordinate(
        trip.pickup.lat,
        trip.pickup.lng
      );
      if (!pickupValidation.isValid) return null;
      
      // Colorful pin colors based on trip type
      const getPinColor = () => {
        if (trip.type === 'parcel') return '#F59E0B'; // Orange
        if (trip.type === 'packers') return '#8B5CF6'; // Purple
        return '#10B981'; // Green for transport
      };
      
      return (
        <Marker
          coordinate={{
           latitude: pickupValidation.latitude,
            longitude: pickupValidation.longitude,
          }}
          title={`${(trip.type || "TRIP").toString().toUpperCase()} Trip`}
          description={`₹${trip.fareEstimate || 0} - ${
            trip.vehicleType || "vehicle"
          }`}
          pinColor={getPinColor()}
          onPress={onPress}
          tracksViewChanges={false}
        />
      );
    }
  );

  /* -------------------------
       Loading screen
       ------------------------ */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={newPrimaryColor} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const mostRecentTrip = availableTrips?.[0] ?? null;

  /* -------------------------
       Render
       ------------------------ */
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={newGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerTop}>
          <View style={styles.leftHeader}>
            <View style={styles.avatarOuter}>
              <View style={styles.avatarInner}>
                <Feather name="user" size={20} color={newPrimaryColor} />
              </View>
            </View>
            <Text style={styles.captainLabel}>
              {(captain?.vehicleType || "Vehicle").toUpperCase()}
            </Text>
          </View>
          <View style={styles.rightHeader}>
            {/* UPDATED: Refresh Button Added */}
            <TouchableOpacity onPress={onRefresh} style={styles.headerRefreshBtn}>
              <Feather name="refresh-cw" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.notification}
              onPress={() => {
                // Navigate to notifications or show notification list
                Alert.alert("Notifications", `You have ${availableTripsCount} new trip${availableTripsCount !== 1 ? 's' : ''} available`);
              }}
              activeOpacity={0.7}
            >
              <Feather name="bell" size={20} color="#FBBF24" />
              {availableTripsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {availableTripsCount > 9 ? '9+' : availableTripsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.profileCircle}>
              <Feather name="user" size={18} color={newPrimaryColor} />
            </View>
          </View>
        </View>

        <View>
          <Text style={styles.greeting}>Hey {captain?.name || "Captain"} ✨</Text>
          <Text style={styles.greetingSub}>
            {(captain?.vehicleType || "Vehicle").toUpperCase()} •{" "}
            {city || "Fetching Location..."}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={newPrimaryColor}
          />
        }
      >
        {/* --- Earnings card --- */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.smallMuted}>Today's Earnings</Text>
              <Text style={styles.amount}>₹{earnings}</Text>
              <Text style={styles.tinyMuted}> {todayTrips} rides</Text>
            </View>
            <TouchableOpacity
              style={styles.earningsButton}
              onPress={() => router.push("/(app)/earnings")}
            >
              <Text style={styles.earningsButtonText}>View Earnings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Availability card --- */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Availability</Text>
              <Text style={styles.muted}>
                Go online and start accepting rides
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleOnlineToggle(!isOnline)}
              activeOpacity={0.8}
              style={[
                styles.toggle,
                { backgroundColor: isOnline ? newPrimaryColor : "#D1D5DB" },
              ]}
            >
              <View
                style={[
                  styles.toggleCircle,
                  { transform: [{ translateX: isOnline ? 22 : 2 }] },
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- RIDE REQUEST CARD --- */}
        <View
          style={[
            styles.rideCard,
            {
              backgroundColor: mostRecentTrip
                ? newPrimaryColor
                : currentTrip
                ? successColor
                : "#f3f4f6",
            },
          ]}
        >
          {/* Case 1: Active Trip in Progress */}
          {currentTrip && currentTrip.status !== "pending" ? (
            <>
              <Text style={styles.rideTag}>Active Trip In Progress</Text>
              <Text style={styles.rideTitle} numberOfLines={2}>
                {currentTrip.pickup?.address?.split("•")?.[0] || "Pickup"} →{" "}
                {currentTrip.delivery?.address?.split("•")?.[0] ||
                  "Destination"}
              </Text>
              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.priceText}>
                    ₹{Number(currentTrip.fareEstimate || 0).toFixed(2)}
                  </Text>
                  <Text style={styles.rideId}>{currentTrip.id || "RD-0000"}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.actionWhite,
                    { flex: 0, paddingHorizontal: 20 },
                  ]}
                  onPress={() => setTripModalVisible(true)}
                >
                  <Text style={styles.acceptText}>View Status</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : /* Case 2: New Incoming Trip */
          mostRecentTrip ? (
            <>
              <Text style={styles.rideTag}>Incoming Ride Request</Text>
              <Text style={styles.rideTitle} numberOfLines={2}>
                {mostRecentTrip.pickup?.address?.split("•")?.[0] || "Pickup"} →{" "}
                {mostRecentTrip.delivery?.address?.split("•")?.[0] ||
                  "Destination"}
              </Text>

              <View style={styles.row}>
                <View style={styles.infoInline}>
                  <Feather name="map-pin" size={14} color="#EF4444" />
                  <Text style={[styles.infoText, { color: "#FFFFFF" }]}>
                    {mostRecentTrip.distanceKm
                      ? `${Number(mostRecentTrip.distanceKm).toFixed(2)} km`
                      : mostRecentTrip.estimatedDistance
                      ? `${Number(mostRecentTrip.estimatedDistance).toFixed(2)} km`
                      : "— km"}
                  </Text>
                </View>
                <View style={styles.infoInline}>
                  <Feather name="clock" size={14} color="#16A34A" />
                  <Text style={[styles.infoText, { color: "#16A34A" }]}>
                    ETA {mostRecentTrip.eta || "6"} min
                  </Text>
                </View>
              </View>

              <View style={styles.priceRow}>
                <View />
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.priceText}>
                    ₹{Number(mostRecentTrip.fareEstimate || 0).toFixed(2)}
                  </Text>
                  <Text style={styles.rideId}>
                    {mostRecentTrip.id || "RD-0000"}
               </Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionWhite]}>
                  <Text style={styles.callText}>Call Rider</Text>
            </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionWhite]}
                  onPress={() => {
                    handleTripPress(mostRecentTrip);
               }}
                >
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* Case 3: No active trip AND no new trips */
         <View style={{ paddingVertical: 20 }}>
              <Text style={styles.noTripTitle}>No trip available</Text>
              <Text style={styles.noTripSub}>
                {isOnline ? "Looking for trips..." : "Go online to see trips"}
              </Text>
            </View>
          )}
        </View>

        {/* --- Stats Grid (2 items: Trips & Rating) --- */}
        <View style={styles.card}>
          <View style={styles.grid}>
            {/* Item 1: Trips */}
           <View style={styles.gridItem}>
              <View style={styles.gridItemInner}>
                <Feather name="map" size={18} color={newPrimaryColor} />
                <Text style={styles.gridValue}>{todayTrips}</Text>
                <Text style={styles.gridLabel}>Trips</Text>
              </View>
            </View>
            {/* Item 2: Rating */}
            <View style={styles.gridItem}>
              <View style={styles.gridItemInner}>
                <Feather name="star" size={18} color={warningColor} />
             <Text style={styles.gridValue}>{rating || 0}</Text>
                <Text style={styles.gridLabel}>Rating</Text>
       </View>
            </View>
          </View>
        </View>

        {/* --- Map --- */}
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={mapRegion}
            showsUserLocation
            showsMyLocationButton={true}
          >
            {currentLocation && (
              <Marker
                coordinate={{
                  latitude: currentLocation.lat,
                  longitude: currentLocation.lng,
                }}
                title="Your Location"
                pinColor={newPrimaryColor}
                tracksViewChanges={false}
  	        />
            )}
            {currentTrip && currentTrip.status !== "pending" && (
              <TripMarker
                key={currentTrip.id}
                trip={currentTrip}
                onPress={() => openInGoogleMaps(currentTrip, "destination")}
              />
  	        )}
  	        {availableTrips.map((t) => (
              <TripMarker
                key={t.id}
  	            trip={t}
                onPress={() => handleTripPress(t)}
           />
            ))}
          </MapView>

          {availableTrips.length > 0 && (
  	        <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            style={styles.tripSelector}
              contentContainerStyle={{ paddingHorizontal: 8 }}
  	        >
              {availableTrips.map((trip) => (
  	            <Pressable
                  key={trip.id}
  	              style={[
                    styles.tripChip,
  	                selectedTrip?.id === trip.id && styles.tripChipActive,
  	              ]}
                  onPress={() => setSelectedTrip(trip)}
  	            >
                  <Text style={styles.tripChipText}>
  	                {(trip.type || "TRIP").toUpperCase()}
                  </Text>
  	              <Text style={styles.tripChipFare}>
                    ₹{trip.fareEstimate || 0}
             </Text>
                </Pressable>
  	          ))}
            </ScrollView>
  	      )}
        </View>

        {/* --- Trips list (REMOVED) --- */}
  	  </ScrollView>

      {/* --- Trip Modal (STATE MACHINE UPDATED) --- */}
  	  <Modal visible={tripModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
  	      <View style={styles.modalCard}>
            <ScrollView>
  	          <Text style={styles.modalTitle}>
                {currentTrip?.status === "pending" || !currentTrip?.status
  	              ? "New Trip Request"
                  : "Active Trip"}
  	          </Text>

              {currentTrip ? (
  	            <>
                  <Text style={styles.modalLabel}>From</Text>
  	              <Text style={styles.modalText}>
                    {currentTrip.pickup?.address || "Pickup address"}
  	              </Text>

                  <Text style={styles.modalLabel}>To</Text>
  	              <Text style={styles.modalText}>
                    {currentTrip.delivery?.address || "Delivery address"}
  	              </Text>

                 <Text style={styles.modalLabel}>Fare</Text>
                  <Text style={styles.modalText}>
  	                ₹{currentTrip.fareEstimate || 0}
              </Text>

                  <View
  	                style={{
                      height: 1,
  	                  backgroundColor: "#E5E7EB",
                      marginVertical: 20,
  	                }}
                  />

                  {/* ===== STATE 1: PENDING ===== */}
  	              {(currentTrip.status === "pending" ||
      	            !currentTrip.status) && (
                    <TouchableOpacity
  	                  style={styles.modalBtnPrimary}
                      onPress={async () => {
  	                    try {
                          await handleAcceptTrip(currentTrip.id);
  	                    } catch (e) {
                          console.log("Accept failed, modal remains open");
  	                    }
                 }}
                    >
  	                  <Text style={styles.modalBtnTextPrimary}>
                        Accept Trip
  	                  </Text>
              	  </TouchableOpacity>
                  )}

  	              {/* ===== STATE 2: ACCEPTED ===== */}
                  {currentTrip.status === "accepted" && (
  	                <TouchableOpacity
                      style={styles.modalBtnPrimary}
  	    	          onPress={async () => {
                        try {
  	        	          await handleReachedPickup(currentTrip.id);
                        } catch (e) {
  	                      console.log("Reached pickup failed");
                  	    }
  	                  }}
            	      >
                      <Text style={styles.modalBtnTextPrimary}>
  	      	            I Have Reached Pickup
                  	  </Text>
            	      </TouchableOpacity>
              	  )}

                  {/* ===== STATE 3: REACHED PICKUP (Calls handleStartTrip) ===== */}
  	              {currentTrip.status === "reached_pickup" && (
                    <>
  	                  <Text style={styles.modalLabel}>Enter 4-Digit OTP</Text>
                      <TextInput
  	                    style={styles.otpInput}
                  value={otp}
                        onChangeText={setOtp}
  	                    keyboardType="number-pad"
                        maxLength={4}
  	    	            placeholder="1234"
                        placeholderTextColor="#9CA3AF"
  	    	          />
                     <TouchableOpacity
                       style={styles.modalBtnPrimary}
                       onPress={async () => {
                         try {
                           await handleStartTrip(currentTrip.id);
                         } catch (e) {
                           console.log("Start trip failed");
                         }
                       }}
                     >
                       <Text style={styles.modalBtnTextPrimary}>
                         Verify OTP & Complete Trip
                       </Text>
                     </TouchableOpacity>
                   </>
                 )}

                 {/* --- Close Button (always shown) --- */}
                 <TouchableOpacity
                   style={styles.modalBtnOutline}
                   onPress={handleCloseTripModal}
                 >
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

      {/* --- New trip toast (This is your in-app "box" notification) --- */}
  	  {newTripToast && (
        <Pressable
      	  style={styles.toast}
          onPress={() => {
  	        handleTripPress(newTripToast);
            setNewTripToast(null);
  	      }}
        >
      	  <Text style={styles.toastText}>
         New Trip • ₹{Math.round(newTripToast.fareEstimate || 0)} • Tap to
            view
    	      </Text>
        </Pressable>
    	  )}
    </View>
  );
}

/* -------------------------
     Styles (FINAL)
     ------------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 10,
    color: newPrimaryColor,
    fontSize: 17,
  },
  headerGradient: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  leftHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  captainLabel: {
    marginLeft: 8,
    fontSize: 17,
    fontWeight: "700", // Increased
    color: "#FFFFFF", // Fixed
  },
  rightHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRefreshBtn: {
    marginRight: 16,
  },
  notification: {
    position: "relative",
    marginRight: 12,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
   fontWeight: "bold",
  },
  profileCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  greeting: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF", // Fixed
  },
  greetingSub: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)", // Fixed
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallMuted: {
    fontSize: 13,
    color: "#6B7280",
  },
  amount: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#1F2937",
    marginVertical: 4,
  },
  tinyMuted: {
    fontSize: 13,
    color: "#6B7280",
  },
  earningsButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: newPrimaryColor,
     alignItems: "center",
   justifyContent: "center",
  },
  earningsButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
  },
  muted: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 2,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: "center",
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  rideCard: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rideTag: {
  	fontSize: 12,
  	fontWeight: "600",
  	color: newAccentColor,
  	marginBottom: 8,
  },
  rideTitle: {
  	fontSize: 17,
  	fontWeight: "bold",
  	color: "#FFFFFF",
  	lineHeight: 22,
  },
  row: {
  	flexDirection: "row",
  	alignItems: "center",
  	marginTop: 12,
  	gap: 16,
  },
  infoInline: {
  	flexDirection: "row",
  	alignItems: "center",
  	gap: 6,
  },
  infoText: {
  	fontSize: 15,
  	fontWeight: "600", // Increased
  	color: "#FFFFFF",
  },
  priceRow: {
  	flexDirection: "row",
  	justifyContent: "space-between",
  	alignItems: "flex-end",
  	marginTop: 12,
  },
  priceText: {
  	fontSize: 30,
  	fontWeight: "bold",
  	color: "#FFFFFF",
  },
  rideId: {
  	fontSize: 12,
  	color: newAccentColor,
  	marginTop: -4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionWhite: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  callText: {
  	fontSize: 15,
  	fontWeight: "700",
  	color: newPrimaryColor,
  },
  acceptText: {
  	fontSize: 15,
  	fontWeight: "700",
  	color: newPrimaryColor,
  },
  noTripTitle: {
  	fontSize: 17,
  	fontWeight: "700", // Increased
  	color: "#4B5563",
  	textAlign: "center",
},
  noTripSub: {
  	fontSize: 15,
  	color: "#6B7280",
  	textAlign: "center",
  	marginTop: 4,
  },
  // --- Grid Styles ---
  grid: {
  	flexDirection: "row",
  	gap: 12,
  },
  gridItem: {
  	flex: 1,
  },
  gridItemInner: {
  	backgroundColor: "#F9FAFB",
  	borderRadius: 10,
  	padding: 12,
  	alignItems: "center",
  	justifyContent: "center",
  	minHeight: 80,
  	borderWidth: 1,
  	borderColor: "#E5E7EB",
  },
  gridLabel: {
  	fontSize: 12,
  	color: "#6B7280",
  	marginTop: 6,
  },
  gridValue: {
  	fontSize: 20,
  	fontWeight: "bold",
   color: "#1F2937",
  	marginTop: 6,
  },


  mapContainer: {
  	height: 250,
  	marginHorizontal: 16,
  	marginTop: 16,
  	borderRadius: 16,
  	overflow: "hidden",
  	position: "relative",
  	backgroundColor: "#E5E7EB",
  	shadowColor: "#000",
  	shadowOffset: { width: 0, height: 2 },
  	shadowOpacity: 0.05,
  	shadowRadius: 4,
  	elevation: 3,
  	borderWidth: 1,
  	borderColor: "#E5E7EB",
  },
  map: {
  	...StyleSheet.absoluteFillObject,
  },
  tripSelector: {
  	position: "absolute",
  	bottom: 12,
  	left: 0,
  	right: 0,
  },
  tripChip: {
  	backgroundColor: "rgba(255,255,255,0.9)",
  	borderRadius: 16,
  	paddingVertical: 8,
  	paddingHorizontal: 12,
  	marginHorizontal: 4,
  	shadowColor: "#000",
  	shadowOffset: { width: 0, height: 1 },
  	shadowOpacity: 0.1,
  	shadowRadius: 2,
  	elevation: 2,
  },
  tripChipActive: {
  	backgroundColor: newPrimaryColor,
  },
  tripChipText: {
  	fontSize: 13,
  	fontWeight: "700", // Increased
  	color: "#374151",
  },
  tripChipFare: {
  	fontSize: 15,
  	fontWeight: "bold",
  	color: "#1F2937",
  	marginTop: 2,
  },

  // --- STYLES FOR REMOVED LIST (CLEANED UP) ---
  // (No longer needed)

  modalOverlay: {
  	flex: 1,
  	backgroundColor: "rgba(0,0,0,0.5)",
  	justifyContent: "flex-end",
 },
  modalCard: {
  	backgroundColor: "#FFFFFF",
  	borderTopLeftRadius: 16,
  	borderTopRightRadius: 16,
  	padding: 20,
  	paddingBottom: 40,
  	maxHeight: "80%",
  },
  modalTitle: {
  	fontSize: 22,
  	fontWeight: "bold",
  	color: "#1F2937",
  	marginBottom: 16,
  },
  modalLabel: {
  	fontSize: 13,
  	color: "#6B7280",
  	marginTop: 12,
  	marginBottom: 4,
  },
  modalText: {
  	fontSize: 17,
  	color: "#1F2937",
  },
  otpInput: {
  	fontSize: 22,
  	fontWeight: "bold",
  	color: "#1F2937",
  	borderBottomWidth: 2,
  	borderColor: "#D1D5DB",
  	paddingVertical: 8,
  	textAlign: "center",
  	letterSpacing: 8,
  	marginBottom: 16,
  },
  modalBtnPrimary: {
  	backgroundColor: newPrimaryColor,
  	paddingVertical: 14,
  	borderRadius: 8,
  	alignItems: "center",
  	marginTop: 12,
  },
  modalBtnTextPrimary: {
  	color: "#FFFFFF",
  	fontSize: 17,
  	fontWeight: "700", // Increased
  },
  modalBtnOutline: {
  	backgroundColor: "#FFFFFF",
  	paddingVertical: 14,
  	borderRadius: 8,
  	alignItems: "center",
  	marginTop: 12,
  	borderWidth: 1,
  	borderColor: "#D1D5DB",
  },
  modalBtnTextOutline: {
  	color: "#374151",
  	fontSize: 17,
  	fontWeight: "700", // Increased
  },
  toast: {
  	position: "absolute",
  	top: 60,
  	left: 16,
  	right: 16,
  	backgroundColor: "#1F2937",
  	paddingVertical: 12,
  	paddingHorizontal: 16,
  	borderRadius: 8,
  	zIndex: 999,
  	shadowColor: "#000",
   shadowOffset: { width: 0, height: 2 },
  	shadowOpacity: 0.1,
  	shadowRadius: 4,
  	elevation: 5,
  },
  toastText: {
  	color: "#FFFFFF",
  	fontSize: 15,
  	fontWeight: "700", // Increased
  	textAlign: "center",
  },
});