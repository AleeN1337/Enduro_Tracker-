import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  Modal,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { EnduroSpot, UserLocation } from "../types";
import AddSpotScreen from "./AddSpotScreen";
import OpenStreetMapSimple from "../components/OpenStreetMapSimple";
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
  const [useOpenStreetMap, setUseOpenStreetMap] = useState(true);
  const [activeNavigation, setActiveNavigation] = useState<{
    target: EnduroSpot;
    routeCoords: { latitude: number; longitude: number }[];
  } | null>(null);

  useEffect(() => {
    getLocationPermission();
    loadSpots();
  }, []);

  // Automatyczne aktualizowanie lokalizacji podczas nawigacji
  useEffect(() => {
    let locationInterval: NodeJS.Timeout | null = null;

    if (activeNavigation) {
      // Aktualizuj lokalizację co 5 sekund podczas nawigacji
      locationInterval = setInterval(async () => {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
          });
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            altitude: currentLocation.coords.altitude || undefined,
            accuracy: currentLocation.coords.accuracy || undefined,
            timestamp: currentLocation.timestamp,
          });
        } catch (error) {
          console.error("Error updating location:", error);
        }
      }, 5000);
    }

    return () => {
      if (locationInterval) {
        clearInterval(locationInterval);
      }
    };
  }, [activeNavigation]);

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
    setSpots(getAllSpots());
  };

  const centerOnUser = () => {
    if (location && mapRef && !useOpenStreetMap) {
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
      id: Date.now().toString(),
    };

    addSpot(spotWithId);
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

  const handleSeznamMapPress = (coordinate: {
    latitude: number;
    longitude: number;
  }) => {
    setSelectedLocation(coordinate);
    setShowAddSpot(true);
  };

  const handleSpotPress = (spot: EnduroSpot) => {
    Alert.alert(
      spot.name,
      `Trudność: ${spot.difficulty}\\nKategorie: ${spot.categories.join(
        ", "
      )}\\n\\n${spot.description}`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Nawiguj",
          onPress: () => startLiveNavigation(spot),
        },
      ]
    );
  };

  const startLiveNavigation = (spot: EnduroSpot) => {
    if (!location) {
      Alert.alert("Błąd", "Nie można określić Twojej lokalizacji");
      return;
    }

    // Tworzenie prostej trasy (linia prosta)
    const routeCoords = [
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: spot.latitude, longitude: spot.longitude },
    ];

    setActiveNavigation({
      target: spot,
      routeCoords: routeCoords,
    });

    // Przełącz na Google Maps jeśli używamy OpenStreetMap
    if (useOpenStreetMap) {
      setUseOpenStreetMap(false);
    }

    Alert.alert(
      "Nawigacja aktywna",
      `Nawigacja do ${spot.name} została uruchomiona. Trasa będzie aktualizowana na żywo.`,
      [{ text: "OK" }]
    );
  };

  const stopNavigation = () => {
    setActiveNavigation(null);
    Alert.alert("Nawigacja zatrzymana", "Nawigacja została zakończona.", [
      { text: "OK" },
    ]);
  };

  // Aktualizuj trasę gdy zmienia się lokalizacja
  useEffect(() => {
    if (activeNavigation && location) {
      const updatedRouteCoords = [
        { latitude: location.latitude, longitude: location.longitude },
        {
          latitude: activeNavigation.target.latitude,
          longitude: activeNavigation.target.longitude,
        },
      ];

      setActiveNavigation({
        ...activeNavigation,
        routeCoords: updatedRouteCoords,
      });
    }
  }, [location]);

  const toggleMapProvider = () => {
    setUseOpenStreetMap(!useOpenStreetMap);
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
        return "#2196F3";
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
      {/* Map Provider Toggle Button */}
      <TouchableOpacity
        style={styles.mapToggleButton}
        onPress={toggleMapProvider}
      >
        <Text style={styles.mapToggleText}>
          {useOpenStreetMap ? "Google Maps" : "OpenStreetMap"}
        </Text>
      </TouchableOpacity>

      {useOpenStreetMap ? (
        <OpenStreetMapSimple
          location={location}
          spots={spots}
          onMapPress={handleSeznamMapPress}
          onMarkerPress={handleSpotPress}
        />
      ) : (
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

          {/* Pokaż trasę nawigacji na żywo */}
          {activeNavigation && (
            <>
              <Polyline
                coordinates={activeNavigation.routeCoords}
                strokeColor="#FF6B35"
                strokeWidth={6}
              />
              <Marker
                coordinate={{
                  latitude: activeNavigation.target.latitude,
                  longitude: activeNavigation.target.longitude,
                }}
                title={`Cel: ${activeNavigation.target.name}`}
                description="Nawigacja aktywna"
                pinColor="#FF6B35"
              />
            </>
          )}
        </MapView>
      )}

      {!useOpenStreetMap && (
        <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={24} color="#FF6B35" />
        </TouchableOpacity>
      )}

      {/* Przycisk zatrzymania nawigacji */}
      {activeNavigation && (
        <TouchableOpacity
          style={styles.stopNavigationButton}
          onPress={stopNavigation}
        >
          <Ionicons name="stop-circle" size={24} color="white" />
          <Text style={styles.stopNavigationText}>Zatrzymaj nawigację</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          if (location) {
            setSelectedLocation({
              latitude: location.latitude,
              longitude: location.longitude,
            });
            setShowAddSpot(true);
          }
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

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
  mapToggleButton: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 1000,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  mapToggleText: {
    color: "#FF6B35",
    fontWeight: "600",
    fontSize: 12,
  },
  stopNavigationButton: {
    position: "absolute",
    bottom: 120,
    right: 20,
    backgroundColor: "#F44336",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#F44336",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: "#FF5722",
  },
  stopNavigationText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
});

export default MapScreen;
