import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { Clock, Navigation, Zap, Bell, MapPin } from "lucide-react-native";
import AnimatedCard from "../../components/AnimatedCard";
import TripCard from "../../components/TripCard";
import TripWorkflow from "../../components/TripWorkflow";
import MapInterface from "../../components/MapInterface";
import Modal from "../../components/Modal";
import Button from "../../components/Button";
import Input from "../../components/Input";

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [displayName, setDisplayName] = useState("Captain");
  const [firstName, setFirstName] = useState("Captain");
  const [vehicleType, setVehicleType] = useState("Bike");
  const [serviceScope, setServiceScope] = useState("City");
  const [rating, setRating] = useState(5);
  const [totalTrips, setTotalTrips] = useState(0);
  const [pendingTrips, setPendingTrips] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [incomingTrip, setIncomingTrip] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [mapInterfaceVisible, setMapInterfaceVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [orderPreviewVisible, setOrderPreviewVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [previewDistanceKm, setPreviewDistanceKm] = useState<number | null>(
    null
  );
  const [previewDurationMin, setPreviewDurationMin] = useState<number | null>(
    null
  );
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const mapRef = useRef<MapView>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [currentPhase, setCurrentPhase] = useState<"pickup" | "dropoff">(
    "pickup"
  );
  const [incomingTripNotifications, setIncomingTripNotifications] = useState<
    any[]
  >([]);
  const [isAvailable, setIsAvailable] = useState(true);

  const handleMenuPress = () => {};
  const handleNotificationPress = () => {};
  const handleAcceptTrip = (id: string) => {};
  const handleRejectTrip = () => {};
  const handleMapTripComplete = () => {};
  const handleMapTripCancel = () => {};
  const onRefresh = () => {};

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
          {/* Header */}
          <View style={styles.header}>
          <Text style={styles.headerTitle}>Welcome back, {displayName}</Text>
          <Text style={styles.headerSubtitle}>Ready to start your day?</Text>
        </View>

        {/* Status Card */}
        <AnimatedCard style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIcon}>
              <Zap size={24} color="#10B981" />
          </View>
            <View>
              <Text style={styles.statusTitle}>You're Online</Text>
              <Text style={styles.statusSubtitle}>Ready to accept trips</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.statusButton}>
            <Text style={styles.statusButtonText}>Go Offline</Text>
          </TouchableOpacity>
        </AnimatedCard>

          {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <AnimatedCard style={styles.statCard}>
            <View style={styles.statIcon}>
              <Clock size={20} color="#FB923C" />
              </View>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Today's Trips</Text>
            </AnimatedCard>

          <AnimatedCard style={styles.statCard}>
            <View style={styles.statIcon}>
              <Navigation size={20} color="#3B82F6" />
              </View>
            <Text style={styles.statValue}>₹0</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
            </AnimatedCard>
        </View>

        {/* Notifications */}
        <AnimatedCard style={styles.notificationCard}>
          <View style={styles.notificationHeader}>
            <Bell size={20} color="#FB923C" />
            <Text style={styles.notificationTitle}>Stay Updated</Text>
          </View>
          <Text style={styles.notificationText}>
            Keep your location services enabled for better trip matching.
          </Text>
        </AnimatedCard>

        {/* Available / Pending Trips */}
            <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Available Trips ({pendingCount})
          </Text>
          {pendingTrips.length === 0 ? (
            <View style={styles.emptyState}>
              <MapPin size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No trips available</Text>
              <Text style={styles.emptySubtitle}>
                {isAvailable
                  ? "New requests will appear automatically when available"
                  : "Go online to receive new requests"}
              </Text>
            </View>
          ) : (
            pendingTrips.map((trip) => (
              <TripCard
                key={trip.id || trip._id}
                trip={trip}
                onAccept={() => handleAcceptTrip(trip.id || trip._id || "")}
                onReject={() => setRejectModalVisible(true)}
              />
            ))
          )}
        </View>

        {/* Active Trip */}
        {activeTrip && (
              <TripWorkflow
                trip={activeTrip}
                onTripComplete={() => { 
                  setActiveTrip(null); 
              setRouteCoords([]);
              setCurrentPhase("pickup");
                }}
                onTripCancel={() => { 
                  setActiveTrip(null); 
              setRouteCoords([]);
              setCurrentPhase("pickup");
                }}
                onRouteUpdate={(coordinates) => setRouteCoords(coordinates)}
            onPhaseChange={(phase) =>
              setCurrentPhase(phase as "pickup" | "dropoff")
            }
          />
        )}
      </ScrollView>

      {/* Loading Overlay */}
      {loading && (
        <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
          <View style={styles.loadingContainer}>
            <Animated.View
              style={[
                styles.loadingSpinner,
                {
                  transform: [
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                    { scale: bounceAnim },
                  ],
                },
              ]}
            >
              <Ionicons name="refresh" size={32} color="#FF6B35" />
            </Animated.View>
            <Animated.Text
              style={{
                fontSize: 18,
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              }}
            >
              Loading...
            </Animated.Text>
            <Text style={{ marginTop: 8, color: "#111827" }}>
              Processing your request
            </Text>
                        </View>
        </Animated.View>
      )}

      {/* Modals */}
      <Modal
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        title="Reject Trip"
      >
        <Input
          label="Reason"
          value={rejectReason}
          onChangeText={setRejectReason}
          multiline
          numberOfLines={4}
        />
        <Button title="Submit" onPress={handleRejectTrip} />
      </Modal>

      <Modal
        visible={orderPreviewVisible}
        onClose={() => setOrderPreviewVisible(false)}
        title="Order Details"
      >
        <Text style={styles.modalText}>
          Order #{selectedOrder?.id || selectedOrder?._id}
                </Text>
        <Text style={styles.modalText}>
          Distance: {previewDistanceKm?.toFixed(1) ?? "-"} km
                    </Text>
        <Text style={styles.modalText}>
          ETA: {previewDurationMin ? Math.round(previewDurationMin) : "-"} min
                          </Text>
        <Text style={styles.modalText}>
          Fare: ₹{selectedOrder?.fareEstimate || selectedOrder?.fare}
                          </Text>
        <View style={styles.modalButtonContainer}>
          <Button
            title="Ignore"
            onPress={() => setOrderPreviewVisible(false)}
            variant="secondary"
          />
          <Button
            title="Accept"
            onPress={() => {
            setOrderPreviewVisible(false); 
              handleAcceptTrip(selectedOrder!.id || selectedOrder!._id || "");
            }}
          />
        </View>
      </Modal>

      <Modal visible={!!incomingTrip} onClose={() => setIncomingTrip(null)}>
        <View style={styles.incomingTripModal}>
          <Text style={styles.modalTitle}>🎉 New Trip Request!</Text>
          <View style={styles.tripDetails}>
            <Text style={styles.tripDetailLabel}>Pickup:</Text>
            <Text style={styles.tripDetailValue}>
              {incomingTrip?.pickup.address}
            </Text>
          </View>
          <View style={styles.tripDetails}>
            <Text style={styles.tripDetailLabel}>Destination:</Text>
            <Text style={styles.tripDetailValue}>
              {incomingTrip?.destination?.address ||
                incomingTrip?.delivery?.address}
            </Text>
          </View>
          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Estimated Fare</Text>
            <Text style={styles.fareValue}>
              ₹{incomingTrip?.fareEstimate || incomingTrip?.fare}
            </Text>
          </View>
          <View style={styles.modalButtonContainer}>
              <TouchableOpacity
              style={[styles.modalBtn, styles.acceptBtn]}
                onPress={async () => {
                await handleAcceptTrip(
                  incomingTrip!.id || incomingTrip!._id || ""
                );
                  setIncomingTrip(null);
                }}
              >
              <Text style={styles.modalBtnText}>Accept Trip</Text>
              </TouchableOpacity>
              <TouchableOpacity
              style={[styles.modalBtn, styles.declineBtn]}
                onPress={() => setIncomingTrip(null)}
              >
              <Text style={styles.modalBtnText}>Decline</Text>
              </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Map Interface */}
      {activeTrip && (
        <MapInterface
          trip={activeTrip}
          visible={mapInterfaceVisible}
          onClose={() => setMapInterfaceVisible(false)}
          onTripComplete={handleMapTripComplete}
          onTripCancel={handleMapTripCancel}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: "#FB923C",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 16, color: "#FFFFFF", opacity: 0.9 },
  statusCard: {
    margin: 20,
    marginBottom: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusHeader: { flexDirection: "row", alignItems: "center", flex: 1 },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statusSubtitle: { fontSize: 14, color: "#6B7280" },
  statusButton: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  statusButtonText: { fontSize: 14, fontWeight: "600", color: "#DC2626" },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: { flex: 1, padding: 16, alignItems: "center" },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF3E7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: "#6B7280", textAlign: "center" },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  emptyState: { padding: 32, alignItems: "center" },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center" },
  tripDetails: { marginBottom: 16 },
  tripDetailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "600",
  },
  tripDetailValue: { fontSize: 14, color: "#111827", fontWeight: "500" },
  fareContainer: {
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 12,
  },
  fareLabel: { fontSize: 12, color: "#16A34A", fontWeight: "600" },
  fareValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16A34A",
    marginTop: 4,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  acceptBtn: { backgroundColor: "#10B981" },
  declineBtn: { backgroundColor: "#EF4444" },
  modalBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  modalText: { fontSize: 14, color: "#111827", marginBottom: 8 },
  incomingTripModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
  },
  notificationCard: {
    margin: 20,
    padding: 16,
    backgroundColor: "#FEF3E7",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 8,
  },
  notificationText: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: "#FFF",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
});
