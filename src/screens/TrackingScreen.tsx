import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { TrackingSession, UserLocation } from "../types";

const TrackingScreen = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<TrackingSession | null>(
    null
  );
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(
    null
  );
  const [locationSubscription, setLocationSubscription] =
    useState<Location.LocationSubscription | null>(null);

  // Statystyki sesji
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTracking && currentSession) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor(
          (now.getTime() - currentSession.startTime.getTime()) / 1000
        );
        setDuration(elapsed);

        // Oblicz średnią prędkość
        if (elapsed > 0) {
          setAverageSpeed((distance / elapsed) * 3.6); // km/h
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, currentSession, distance]);

  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locationSubscription]);

  const startTracking = async () => {
    try {
      // Sprawdź uprawnienia
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Błąd", "Potrzebujemy dostępu do lokalizacji!");
        return;
      }

      // Utwórz nową sesję
      const newSession: TrackingSession = {
        id: Date.now().toString(),
        startTime: new Date(),
        distance: 0,
        maxSpeed: 0,
        averageSpeed: 0,
        route: [],
        spotsVisited: [],
      };

      setCurrentSession(newSession);
      setIsTracking(true);
      setDistance(0);
      setDuration(0);
      setMaxSpeed(0);
      setAverageSpeed(0);

      // Rozpocznij śledzenie lokalizacji
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // co sekundę
          distanceInterval: 5, // co 5 metrów
        },
        (location) => {
          const newLocation: UserLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude || undefined,
            accuracy: location.coords.accuracy || undefined,
            timestamp: location.timestamp,
          };

          setCurrentLocation(newLocation);

          // Aktualizuj trasę
          if (currentSession) {
            const updatedRoute = [...currentSession.route, newLocation];

            // Oblicz dystans
            if (updatedRoute.length > 1) {
              const lastLocation = updatedRoute[updatedRoute.length - 2];
              const segmentDistance = calculateDistance(
                lastLocation,
                newLocation
              );
              setDistance((prev) => prev + segmentDistance);
            }

            // Aktualizuj maksymalną prędkość
            if (location.coords.speed && location.coords.speed > maxSpeed) {
              setMaxSpeed(location.coords.speed * 3.6); // m/s to km/h
            }

            setCurrentSession((prev) =>
              prev
                ? {
                    ...prev,
                    route: updatedRoute,
                  }
                : null
            );
          }
        }
      );

      setLocationSubscription(subscription);
    } catch (error) {
      console.error("Error starting tracking:", error);
      Alert.alert("Błąd", "Nie można rozpocząć śledzenia");
    }
  };

  const stopTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }

    if (currentSession) {
      const finalSession: TrackingSession = {
        ...currentSession,
        endTime: new Date(),
        distance,
        maxSpeed,
        averageSpeed,
      };

      // TODO: Zapisz sesję do bazy danych
      console.log("Session completed:", finalSession);

      Alert.alert(
        "Sesja zakończona!",
        `Przejechałeś ${(distance / 1000).toFixed(
          2
        )} km w czasie ${formatDuration(duration)}`
      );
    }

    setIsTracking(false);
    setCurrentSession(null);
    setDistance(0);
    setDuration(0);
    setMaxSpeed(0);
    setAverageSpeed(0);
  };

  const calculateDistance = (
    loc1: UserLocation,
    loc2: UserLocation
  ): number => {
    const R = 6371e3; // promień Ziemi w metrach
    const φ1 = (loc1.latitude * Math.PI) / 180;
    const φ2 = (loc2.latitude * Math.PI) / 180;
    const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const StatCard = ({
    icon,
    label,
    value,
    unit,
  }: {
    icon: string;
    label: string;
    value: string;
    unit: string;
  }) => (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={24} color="#FF6B35" />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GPS Tracking</Text>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: isTracking ? "#4CAF50" : "#757575" },
          ]}
        >
          <Text style={styles.statusText}>
            {isTracking ? "AKTYWNY" : "NIEAKTYWNY"}
          </Text>
        </View>
      </View>

      {/* Statystyki */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatCard
            icon="speedometer"
            label="Dystans"
            value={(distance / 1000).toFixed(2)}
            unit="km"
          />
          <StatCard
            icon="time"
            label="Czas"
            value={formatDuration(duration)}
            unit=""
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            icon="flash"
            label="Maks. prędkość"
            value={maxSpeed.toFixed(0)}
            unit="km/h"
          />
          <StatCard
            icon="trending-up"
            label="Śred. prędkość"
            value={averageSpeed.toFixed(0)}
            unit="km/h"
          />
        </View>
      </View>

      {/* Informacje o lokalizacji */}
      {currentLocation && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>Aktualna pozycja</Text>
          <Text style={styles.coordinates}>
            {currentLocation.latitude.toFixed(6)},{" "}
            {currentLocation.longitude.toFixed(6)}
          </Text>
          {currentLocation.altitude && (
            <Text style={styles.altitude}>
              Wysokość: {currentLocation.altitude.toFixed(0)}m
            </Text>
          )}
        </View>
      )}

      {/* Przycisk start/stop */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.trackingButton,
            { backgroundColor: isTracking ? "#F44336" : "#4CAF50" },
          ]}
          onPress={isTracking ? stopTracking : startTracking}
        >
          <Ionicons
            name={isTracking ? "stop" : "play"}
            size={32}
            color="white"
          />
          <Text style={styles.buttonText}>
            {isTracking ? "ZATRZYMAJ" : "ROZPOCZNIJ"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Informacje */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          💡 Podczas trackingu aplikacja będzie monitorować Twoją pozycję i
          zapisywać trasę przejażdżki.
        </Text>
      </View>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  statusIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  statusText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: "#444",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#ccc",
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FF6B35",
    marginTop: 5,
    letterSpacing: 0.5,
  },
  statUnit: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  locationInfo: {
    backgroundColor: "#2a2a2a",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#444",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  coordinates: {
    fontSize: 16,
    color: "#ccc",
    fontFamily: "monospace",
    fontWeight: "500",
  },
  altitude: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
    fontWeight: "500",
  },
  buttonContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  trackingButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 5,
    letterSpacing: 0.3,
  },
  infoContainer: {
    backgroundColor: "#2a2a2a",
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B35",
    borderWidth: 1,
    borderColor: "#444",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  infoText: {
    fontSize: 15,
    color: "#ccc",
    lineHeight: 22,
    fontWeight: "500",
  },
});

export default TrackingScreen;
