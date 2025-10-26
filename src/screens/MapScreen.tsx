import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  Modal,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { EnduroSpot, UserLocation } from "../types";
import AddSpotScreen from "./AddSpotScreen";
import OpenStreetMapSimple from "../components/OpenStreetMapSimple";
import GPSNavigation from "../components/GPSNavigation";
import WebLeafletMap from "../components/WebLeafletMap";
import { addSpot, getAllSpots } from "./SpotsListScreen";
import { useNavigation as useNavigationContext } from "../contexts/NavigationContext";

// MapView components will be null on web due to metro config
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

// Web-compatible map component - memoized for performance
const WebMapScreen: React.FC<{
  location: UserLocation;
  spots: EnduroSpot[];
  onSpotPress: (spot: EnduroSpot) => void;
}> = React.memo(({ location, spots, onSpotPress }) => {
  return (
    <View style={styles.webMapContainer}>
      <View style={styles.webMapHeader}>
        <Ionicons name="map" size={32} color="#FF6B35" />
        <Text style={styles.webMapTitle}>Mapa niedostępna w przeglądarce</Text>
        <Text style={styles.webMapSubtitle}>
          Użyj aplikacji mobilnej aby zobaczyć pełną mapę z nawigacją GPS
        </Text>
      </View>

      <View style={styles.webMapContent}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>Twoja lokalizacja:</Text>
          <Text style={styles.locationCoords}>
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>
        </View>

        <Text style={styles.spotsTitle}>
          Dostępne miejscówki ({spots.length}):
        </Text>
        <View style={styles.spotsList}>
          {spots.map((spot) => (
            <TouchableOpacity
              key={spot.id}
              style={styles.spotItem}
              onPress={() => onSpotPress(spot)}
            >
              <View style={styles.spotHeader}>
                <Text style={styles.spotName}>{spot.name}</Text>
                <Text style={styles.spotDifficulty}>{spot.difficulty}</Text>
              </View>
              <Text style={styles.spotCoords}>
                {spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}
              </Text>
              <Text style={styles.spotDescription} numberOfLines={2}>
                {spot.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
});

const MapScreen = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [spots, setSpots] = useState<EnduroSpot[]>([]);
  const [mapRef, setMapRef] = useState<any>(null);
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapProvider, setMapProvider] = useState<"google" | "osm">("osm"); // Default to OpenStreetMap
  const navigationContext = useNavigationContext();

  // Throttle location updates for better performance
  const locationUpdateTimeout = useRef<NodeJS.Timeout | null>(null);

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

  const getLocationPermission = useCallback(async () => {
    try {
      if (Platform.OS === "web") {
        // Use browser geolocation API for web
        if (!navigator.geolocation) {
          Alert.alert(
            "Błąd",
            "Twoja przeglądarka nie obsługuje geolokalizacji!"
          );
          return;
        }

        // Get initial location
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              altitude: position.coords.altitude || undefined,
              accuracy: position.coords.accuracy || undefined,
              timestamp: position.timestamp,
            });
          },
          (error) => {
            console.error("Error getting web location:", error);
            Alert.alert("Błąd", "Nie można pobrać lokalizacji z przeglądarki");
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
          }
        );

        // Watch position for updates
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            // Throttle updates to prevent excessive re-renders
            if (locationUpdateTimeout.current) {
              clearTimeout(locationUpdateTimeout.current);
            }
            locationUpdateTimeout.current = setTimeout(() => {
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                altitude: position.coords.altitude || undefined,
                accuracy: position.coords.accuracy || undefined,
                timestamp: position.timestamp,
              });
            }, 1000); // Throttle to 1 second
          },
          (error) => {
            console.error("Error watching web location:", error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
          }
        );

        // Return cleanup function
        return () => {
          navigator.geolocation.clearWatch(watchId);
          if (locationUpdateTimeout.current) {
            clearTimeout(locationUpdateTimeout.current);
          }
        };
      } else {
        // Use Expo Location API for native platforms
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Błąd", "Potrzebujemy dostępu do lokalizacji!");
          return;
        }

        // Start watching location with throttling for better performance
        const locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000, // Update every 5 seconds minimum
            distanceInterval: 10, // Update when moved 10 meters
          },
          (locationData) => {
            // Throttle updates to prevent excessive re-renders
            if (locationUpdateTimeout.current) {
              clearTimeout(locationUpdateTimeout.current);
            }
            locationUpdateTimeout.current = setTimeout(() => {
              setLocation({
                latitude: locationData.coords.latitude,
                longitude: locationData.coords.longitude,
                altitude: locationData.coords.altitude || undefined,
                accuracy: locationData.coords.accuracy || undefined,
                timestamp: locationData.timestamp,
              });
            }, 1000); // Throttle to 1 second
          }
        );

        // Get initial location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          altitude: currentLocation.coords.altitude || undefined,
          accuracy: currentLocation.coords.accuracy || undefined,
          timestamp: currentLocation.timestamp,
        });

        // Store subscription for cleanup
        return () => {
          locationSubscription.remove();
          if (locationUpdateTimeout.current) {
            clearTimeout(locationUpdateTimeout.current);
          }
        };
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Błąd", "Nie można pobrać lokalizacji");
    }
  }, []);

  const loadSpots = useCallback(() => {
    setSpots(getAllSpots());
  }, []);

  const centerOnUser = useCallback(() => {
    if (location && mapRef && mapProvider === "google") {
      mapRef.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [location, mapProvider]);

  const handleAddSpot = useCallback((newSpot: Omit<EnduroSpot, "id">) => {
    const spotWithId: EnduroSpot = {
      ...newSpot,
      id: Date.now().toString(),
    };

    addSpot(spotWithId);
    setSpots(getAllSpots());

    setShowAddSpot(false);
    setSelectedLocation(null);

    console.log("New spot added:", spotWithId);
  }, []);

  const handleMapPress = useCallback((event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    setSelectedLocation(coordinate);
    setShowAddSpot(true);
  }, []);

  const handleSeznamMapPress = useCallback(
    (coordinate: { latitude: number; longitude: number }) => {
      setSelectedLocation(coordinate);
      setShowAddSpot(true);
    },
    []
  );

  const openNavigation = useCallback(
    (spot: EnduroSpot) => {
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
    },
    [location, mapProvider, navigationContext]
  );

  const handleSpotPress = useCallback(
    (spot: EnduroSpot) => {
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
    },
    [openNavigation]
  );

  const toggleMapProvider = useCallback(() => {
    console.log("Current map provider:", mapProvider);
    if (mapProvider === "google") {
      console.log("Switching to OpenStreetMap");
      setMapProvider("osm");
    } else {
      console.log("Switching to Google Maps");
      setMapProvider("google");
    }
  }, [mapProvider]);

  const getMapProviderLabel = useCallback(() => {
    console.log("Current map provider label:", mapProvider);
    switch (mapProvider) {
      case "google":
        return "Google Maps";
      case "osm":
        return "OpenStreetMap";
      default:
        return "Mapy";
    }
  }, [mapProvider]);

  const getDifficultyColor = useCallback(
    (difficulty: EnduroSpot["difficulty"]) => {
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
    },
    []
  );

  // Memoize markers to prevent unnecessary re-renders
  const markers = useMemo(() => {
    return spots.map((spot) => (
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
    ));
  }, [spots, getDifficultyColor]);

  if (!location) {
    console.log("Location is null, showing loading screen");
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "#fff", fontSize: 16 }}>Ładowanie mapy...</Text>
        <Text style={{ color: "#ccc", fontSize: 12, marginTop: 8 }}>
          Pobieranie lokalizacji...
        </Text>
      </View>
    );
  }

  console.log("MapScreen rendering with mapProvider:", mapProvider);
  console.log("Location:", location);
  console.log("Spots count:", spots.length);

  return (
    <View style={styles.container}>
      {/* Map Provider Toggle Button - only show on native */}
      {Platform.OS !== "web" && (
        <TouchableOpacity
          style={styles.mapToggleButton}
          onPress={toggleMapProvider}
        >
          <Text style={styles.mapToggleText}>{getMapProviderLabel()}</Text>
        </TouchableOpacity>
      )}

      {Platform.OS === "web" ? (
        <WebLeafletMap
          location={location}
          spots={spots}
          onSpotPress={handleSpotPress}
          onMapPress={handleSeznamMapPress}
        />
      ) : mapProvider === "osm" ? (
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
          {markers}
        </MapView>
      )}

      {Platform.OS !== "web" && mapProvider === "google" && (
        <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={24} color="#FF6B35" />
        </TouchableOpacity>
      )}

      {Platform.OS !== "web" && (
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
      )}

      {Platform.OS !== "web" && (
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
      )}

      {/* GPS Navigation Modal - only on native */}
      {Platform.OS !== "web" && (
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
      )}
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
  webMapContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 20,
  },
  webMapHeader: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  webMapTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginTop: 10,
    textAlign: "center",
  },
  webMapSubtitle: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  webMapContent: {
    flex: 1,
  },
  locationInfo: {
    backgroundColor: "#2a2a2a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#444",
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B35",
    marginBottom: 8,
  },
  locationCoords: {
    fontSize: 14,
    color: "#ccc",
    fontFamily: "monospace",
  },
  spotsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  spotsList: {
    flex: 1,
  },
  spotItem: {
    backgroundColor: "#2a2a2a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#444",
  },
  spotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  spotName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  spotDifficulty: {
    fontSize: 12,
    color: "#FF6B35",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  spotCoords: {
    fontSize: 12,
    color: "#888",
    fontFamily: "monospace",
    marginBottom: 8,
  },
  spotDescription: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 20,
  },
});

export default MapScreen;
