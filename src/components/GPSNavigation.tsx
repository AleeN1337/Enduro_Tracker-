import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { EnduroSpot, UserLocation } from "../types";

interface GPSNavigationProps {
  destination: EnduroSpot;
  onClose: () => void;
  currentLocation: UserLocation | null;
}

const GPSNavigation: React.FC<GPSNavigationProps> = ({
  destination,
  onClose,
  currentLocation: initialLocation,
}) => {
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(
    initialLocation
  );
  const [distance, setDistance] = useState<number>(0);
  const [bearing, setBearing] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null
  );

  useEffect(() => {
    startNavigation();
    return () => {
      stopNavigation();
    };
  }, []);

  useEffect(() => {
    if (currentLocation) {
      updateNavigationInfo();
    }
  }, [currentLocation]);

  const startNavigation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Błąd", "Potrzebujemy dostępu do lokalizacji!");
        return;
      }

      setIsNavigating(true);

      // Subskrypcja na zmiany lokalizacji w czasie rzeczywistym
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // Aktualizacja co sekundę
          distanceInterval: 1, // Aktualizacja co metr
        },
        (location) => {
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude || undefined,
            accuracy: location.coords.accuracy || undefined,
            timestamp: location.timestamp,
          });
          setSpeed(location.coords.speed || 0);
        }
      );
    } catch (error) {
      console.error("Error starting navigation:", error);
      Alert.alert("Błąd", "Nie można uruchomić nawigacji");
    }
  };

  const stopNavigation = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsNavigating(false);
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Promień Ziemi w km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateBearing = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
    const x =
      Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
      Math.sin((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.cos(dLon);
    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  };

  const updateNavigationInfo = () => {
    if (!currentLocation) return;

    const dist = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      destination.latitude,
      destination.longitude
    );
    setDistance(dist);

    const bear = calculateBearing(
      currentLocation.latitude,
      currentLocation.longitude,
      destination.latitude,
      destination.longitude
    );
    setBearing(bear);
  };

  const formatDistance = (dist: number): string => {
    if (dist < 1) {
      return `${Math.round(dist * 1000)} m`;
    }
    return `${dist.toFixed(1)} km`;
  };

  const getDirectionArrow = (bearing: number): string => {
    const directions = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  };

  const getDirectionText = (bearing: number): string => {
    const directions = [
      "Północ",
      "Północny Wschód",
      "Wschód",
      "Południowy Wschód",
      "Południe",
      "Południowy Zachód",
      "Zachód",
      "Północny Zachód",
    ];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  };

  const handleClose = () => {
    stopNavigation();
    onClose();
  };

  if (!currentLocation) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Pobieranie lokalizacji GPS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.destinationName}>
          Nawigacja do: {destination.name}
        </Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      <View style={styles.navigationInfo}>
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceLabel}>Odległość</Text>
          <Text style={styles.distanceValue}>{formatDistance(distance)}</Text>
        </View>

        <View style={styles.directionContainer}>
          <Text style={styles.directionArrow}>
            {getDirectionArrow(bearing)}
          </Text>
          <Text style={styles.directionText}>{getDirectionText(bearing)}</Text>
          <Text style={styles.bearingText}>{Math.round(bearing)}°</Text>
        </View>

        <View style={styles.speedContainer}>
          <Text style={styles.speedLabel}>Prędkość</Text>
          <Text style={styles.speedValue}>
            {speed ? `${Math.round(speed * 3.6)} km/h` : "0 km/h"}
          </Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusItem}>
          <Ionicons
            name={isNavigating ? "navigate" : "navigate-outline"}
            size={20}
            color={isNavigating ? "#4CAF50" : "#666"}
          />
          <Text
            style={[
              styles.statusText,
              { color: isNavigating ? "#4CAF50" : "#666" },
            ]}
          >
            {isNavigating ? "Nawigacja aktywna" : "Nawigacja zatrzymana"}
          </Text>
        </View>

        <View style={styles.statusItem}>
          <Ionicons name="location" size={20} color="#FF6B35" />
          <Text style={styles.statusText}>
            GPS:{" "}
            {currentLocation.accuracy
              ? `±${Math.round(currentLocation.accuracy)}m`
              : "Nieznana"}
          </Text>
        </View>
      </View>

      <View style={styles.coordinatesContainer}>
        <Text style={styles.coordinatesLabel}>Twoja pozycja:</Text>
        <Text style={styles.coordinatesText}>
          {currentLocation.latitude.toFixed(6)},{" "}
          {currentLocation.longitude.toFixed(6)}
        </Text>
        <Text style={styles.coordinatesLabel}>Cel:</Text>
        <Text style={styles.coordinatesText}>
          {destination.latitude.toFixed(6)}, {destination.longitude.toFixed(6)}
        </Text>
      </View>

      {distance < 0.05 && (
        <View style={styles.arrivedContainer}>
          <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
          <Text style={styles.arrivedText}>Dotarłeś do celu!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  destinationName: {
    color: "#FF6B35",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  navigationInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 40,
  },
  distanceContainer: {
    alignItems: "center",
  },
  distanceLabel: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 8,
  },
  distanceValue: {
    color: "#FF6B35",
    fontSize: 24,
    fontWeight: "bold",
  },
  directionContainer: {
    alignItems: "center",
  },
  directionArrow: {
    fontSize: 48,
    color: "#FF6B35",
    marginBottom: 8,
  },
  directionText: {
    color: "#ccc",
    fontSize: 12,
    textAlign: "center",
  },
  bearingText: {
    color: "#888",
    fontSize: 10,
    marginTop: 4,
  },
  speedContainer: {
    alignItems: "center",
  },
  speedLabel: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 8,
  },
  speedValue: {
    color: "#4CAF50",
    fontSize: 18,
    fontWeight: "bold",
  },
  statusContainer: {
    marginBottom: 30,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
  },
  coordinatesContainer: {
    backgroundColor: "#2a2a2a",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  coordinatesLabel: {
    color: "#ccc",
    fontSize: 12,
    marginBottom: 4,
  },
  coordinatesText: {
    color: "#FF6B35",
    fontSize: 14,
    fontFamily: "monospace",
    marginBottom: 12,
  },
  arrivedContainer: {
    alignItems: "center",
    backgroundColor: "#2a4a2a",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  arrivedText: {
    color: "#4CAF50",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  loadingText: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },
});

export default GPSNavigation;
