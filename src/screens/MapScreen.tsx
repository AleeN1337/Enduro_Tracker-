import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  Modal,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { EnduroSpot, UserLocation } from "../types";
import AddSpotScreen from "./AddSpotScreen";
import { addSpot, getAllSpots } from "./SpotsListScreen";

const MapScreen = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [spots, setSpots] = useState<EnduroSpot[]>([]);
  const [mapRef, setMapRef] = useState<MapView | null>(null);
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    getLocationPermission();
    loadSpots();
  }, []);

  const getLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Błąd", "Potrzebujemy dostępu do lokalizacji!");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        altitude: currentLocation.coords.altitude || undefined,
        accuracy: currentLocation.coords.accuracy || undefined,
        timestamp: currentLocation.timestamp,
      });
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Błąd", "Nie można pobrać lokalizacji");
    }
  };

  const loadSpots = () => {
    // Pobierz wszystkie miejsca z globalnego storage
    const allSpots = getAllSpots();

    // Dodaj przykładowe dane jeśli storage jest pusty
    if (allSpots.length === 0) {
      const sampleSpots: EnduroSpot[] = [
        {
          id: "sample-1",
          name: "Kamienny Podjazd",
          description: "Trudny podjazd z dużymi kamieniami",
          latitude: 50.0647,
          longitude: 19.945,
          difficulty: "hard",
          category: "climb",
          rating: 4.5,
          images: [],
          createdBy: "sample-user",
          createdAt: new Date(),
          tags: ["kamienie", "stromy"],
        },
        {
          id: "sample-2",
          name: "Błotna Sekcja",
          description: "Głębokie błoto po deszczu",
          latitude: 50.07,
          longitude: 19.95,
          difficulty: "moderate",
          category: "mud",
          rating: 3.8,
          images: [],
          createdBy: "sample-user",
          createdAt: new Date(),
          tags: ["błoto", "mokro"],
        },
      ];

      // Dodaj przykładowe dane do storage
      sampleSpots.forEach((spot) => addSpot(spot));
    }

    setSpots(getAllSpots());
  };

  const centerOnUser = () => {
    if (location && mapRef) {
      mapRef.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const handleAddSpot = (newSpot: Omit<EnduroSpot, "id">) => {
    const spotWithId: EnduroSpot = {
      ...newSpot,
      id: Date.now().toString(), // Temporary ID generation
    };

    // Dodaj do globalnego storage
    addSpot(spotWithId);

    // Odśwież lokalną listę
    setSpots(getAllSpots());

    setShowAddSpot(false);
    setSelectedLocation(null);

    console.log("New spot added:", spotWithId);
  };

  const handleMapPress = (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    setSelectedLocation(coordinate);
    setShowAddSpot(true);
  };

  const getDifficultyColor = (difficulty: EnduroSpot["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return "#4CAF50";
      case "moderate":
        return "#FF9800";
      case "hard":
        return "#F44336";
      case "extreme":
        return "#9C27B0";
      default:
        return "#757575";
    }
  };

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Ładowanie mapy...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={setMapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        onLongPress={handleMapPress}
      >
        {/* Markery dla miejsc enduro */}
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{
              latitude: spot.latitude,
              longitude: spot.longitude,
            }}
            title={spot.name}
            description={spot.description}
            pinColor={getDifficultyColor(spot.difficulty)}
          />
        ))}
      </MapView>

      {/* Przycisk centrowania na użytkowniku */}
      <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
        <Ionicons name="locate" size={24} color="#FF6B35" />
      </TouchableOpacity>

      {/* Przycisk dodawania nowego miejsca */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          if (location) {
            setSelectedLocation({
              latitude: location.latitude,
              longitude: location.longitude,
            });
            setShowAddSpot(true);
          } else {
            Alert.alert("Błąd", "Nie można określić lokalizacji");
          }
        }}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Modal dodawania miejsca */}
      <Modal
        visible={showAddSpot}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedLocation && (
          <AddSpotScreen
            latitude={selectedLocation.latitude}
            longitude={selectedLocation.longitude}
            onAddSpot={handleAddSpot}
            onCancel={() => {
              setShowAddSpot(false);
              setSelectedLocation(null);
            }}
          />
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  centerButton: {
    position: "absolute",
    top: 70,
    right: 20,
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 14,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  addButton: {
    position: "absolute",
    bottom: 40,
    right: 20,
    backgroundColor: "#FF6B35",
    borderRadius: 20,
    padding: 18,
    elevation: 12,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    borderWidth: 2,
    borderColor: "#FF8E53",
  },
});

export default MapScreen;
