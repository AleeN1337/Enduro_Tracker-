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
import OpenStreetMapSimple from "../components/OpenStreetMapSimple";
import GPSNavigation from "../components/GPSNavigation";
import { addSpot, getAllSpots } from "./SpotsListScreen";
import { useNavigation as useNavigationContext } from "../contexts/NavigationContext";

const MapScreen = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [spots, setSpots] = useState<EnduroSpot[]>([]);
  const [mapRef, setMapRef] = useState<MapView | null>(null);
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapProvider, setMapProvider] = useState<"google" | "osm">("osm"); // Default to OpenStreetMap
  const navigationContext = useNavigationContext();

  useEffect(() => {
    getLocationPermission();
    loadSpots();
  }, []);

  // Reaguj na zmiany w kontekście nawigacji
  useEffect(() => {
    if (
      navigationContext.shouldShowNavigation &&
      navigationContext.navigationTarget
    ) {
      // Przełącz na OpenStreetMap
      setMapProvider("osm");

      // Wyzeruj flagi nawigacji
      setTimeout(() => {
        navigationContext.setShouldShowNavigation(false);
        navigationContext.setNavigationTarget(null);
      }, 1000);
    }
  }, [
    navigationContext.shouldShowNavigation,
    navigationContext.navigationTarget,
  ]);

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
    if (location && mapRef && mapProvider === "google") {
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

  const openNavigation = (spot: EnduroSpot) => {
    if (!location) {
      Alert.alert("Błąd", "Nie można ustalić twojej lokalizacji");
      return;
    }

    // Pokaż opcje nawigacji
    Alert.alert("Wybierz typ nawigacji", `Nawiguj do: ${spot.name}`, [
      { text: "Anuluj", style: "cancel" },
      {
        text: "🗺️ Trasa na mapie",
        onPress: () => {
          // Przełącz na OpenStreetMap jeśli używamy Google Maps
          if (mapProvider === "google") {
            setMapProvider("osm");
          }
          navigationContext.setNavigationTarget(spot);
          navigationContext.setShouldShowNavigation(true);
          navigationContext.setNavigationMode("map");
        },
      },
      {
        text: "🧭 Nawigacja GPS",
        onPress: () => {
          navigationContext.setNavigationTarget(spot);
          navigationContext.setIsGPSNavigating(true);
          navigationContext.setNavigationMode("gps");
        },
      },
    ]);
  };

  const handleSpotPress = (spot: EnduroSpot) => {
    const categoriesText = spot.categories
      .map((cat) => {
        switch (cat) {
          case "climb":
            return "Podjazd";
          case "technical":
            return "Techniczny";
          case "jump":
            return "Skok";
          case "creek":
            return "Potok";
          case "rocks":
            return "Kamienie";
          case "mud":
            return "Błoto";
          default:
            return cat;
        }
      })
      .join(", ");

    Alert.alert(
      spot.name,
      `Trudność: ${spot.difficulty}\\nKategorie: ${categoriesText}\\n\\n${spot.description}`,
      [
        { text: "Zamknij", style: "cancel" },
        {
          text: "🧭 Nawiguj",
          onPress: () => openNavigation(spot),
          style: "default",
        },
      ]
    );
  };

  const toggleMapProvider = () => {
    console.log("Current map provider:", mapProvider);
    if (mapProvider === "google") {
      console.log("Switching to OpenStreetMap");
      setMapProvider("osm");
    } else {
      console.log("Switching to Google Maps");
      setMapProvider("google");
    }
  };

  const getMapProviderLabel = () => {
    console.log("Current map provider label:", mapProvider);
    switch (mapProvider) {
      case "google":
        return "Google Maps";
      case "osm":
        return "OpenStreetMap";
      default:
        return "Mapy";
    }
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

  console.log("MapScreen rendering with mapProvider:", mapProvider);

  return (
    <View style={styles.container}>
      {/* Map Provider Toggle Button */}
      <TouchableOpacity
        style={styles.mapToggleButton}
        onPress={toggleMapProvider}
      >
        <Text style={styles.mapToggleText}>{getMapProviderLabel()}</Text>
      </TouchableOpacity>

      {mapProvider === "osm" ? (
        <OpenStreetMapSimple
          location={location}
          spots={spots}
          onMapPress={handleSeznamMapPress}
          onMarkerPress={handleSpotPress}
          onNavigateToSpot={(destination: {
            latitude: number;
            longitude: number;
            name: string;
          }) => {
            // Nawigacja odbywa się już na mapie OpenStreetMap - nie robimy nic więcej
            console.log("Nawigacja do:", destination.name);
          }}
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
        </MapView>
      )}

      {mapProvider === "google" && (
        <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={24} color="#FF6B35" />
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

      {/* GPS Navigation Modal */}
      <Modal
        visible={navigationContext.isGPSNavigating}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {navigationContext.navigationTarget && (
          <GPSNavigation
            destination={navigationContext.navigationTarget}
            currentLocation={location}
            onClose={() => {
              navigationContext.setIsGPSNavigating(false);
              navigationContext.setNavigationTarget(null);
              navigationContext.setNavigationMode("map");
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
    top: 60, // zwiększone z 20 na 60
    left: 20,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    paddingVertical: 10, // zwiększone z 8 na 10
    paddingHorizontal: 16, // zwiększone z 12 na 16
    zIndex: 9999, // zwiększone z 1000 na 9999
    elevation: 15, // zwiększone z 8 na 15
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, // zwiększone z 0.3 na 0.5
    shadowRadius: 8,
    borderWidth: 2, // zwiększone z 1 na 2
    borderColor: "#FF6B35", // zmienione z #444 na #FF6B35
  },
  mapToggleText: {
    color: "#FFFFFF", // zmienione z #FF6B35 na białe
    fontWeight: "700", // zwiększone z 600 na 700
    fontSize: 14, // zwiększone z 12 na 14
  },
});

export default MapScreen;
