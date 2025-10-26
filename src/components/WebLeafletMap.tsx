import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Platform, Text } from "react-native";
import { EnduroSpot, UserLocation } from "../types";
import { Ionicons } from "@expo/vector-icons";

// Declare Leaflet as global for CDN usage
declare global {
  interface Window {
    L: any;
    handleSpotPress?: (spotId: string) => void;
  }
}

// Web-only map component using Leaflet from CDN
const WebLeafletMap: React.FC<{
  location: UserLocation;
  spots: EnduroSpot[];
  onSpotPress: (spot: EnduroSpot) => void;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
}> = ({ location, spots, onSpotPress, onMapPress }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapError, setMapError] = React.useState<string | null>(null);
  const [isMapReady, setIsMapReady] = React.useState(false);
  const [leafletLoaded, setLeafletLoaded] = React.useState(false);

  // Load Leaflet from CDN
  useEffect(() => {
    if (Platform.OS !== "web") return;

    // Check if Leaflet is already loaded
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    console.log("Loading Leaflet from CDN...");

    // Add Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Add Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.async = true;

    script.onload = () => {
      console.log("Leaflet loaded from CDN successfully");
      setLeafletLoaded(true);
    };

    script.onerror = () => {
      console.error("Failed to load Leaflet from CDN");
      setMapError("Nie udało się załadować biblioteki map");
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!leafletLoaded) return;
    if (!mapRef.current) return;
    if (!window.L) return;

    console.log("Initializing Leaflet map with location:", location);

    const initializeMap = () => {
      try {
        const L = window.L;

        // Check if map container exists
        if (!mapRef.current) {
          console.error("Map container not found");
          setMapError("Kontener mapy nie został znaleziony");
          return;
        }

        console.log("Creating map instance...");
        // Initialize the map
        const map = L.map(mapRef.current).setView(
          [location.latitude, location.longitude],
          13
        );
        console.log("Map instance created");

        // Add OpenStreetMap tiles
        console.log("Adding tile layer...");
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map);
        console.log("Tile layer added");

        // Add user location marker
        const userIcon = L.divIcon({
          html: '<div style="background-color: #4285F4; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(66, 133, 244, 0.5);"></div>',
          className: "user-location-marker",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        L.marker([location.latitude, location.longitude], { icon: userIcon })
          .addTo(map)
          .bindPopup("Twoja lokalizacja");

        console.log(`Adding ${spots.length} spot markers...`);
        // Add spot markers
        const spotMarkers = spots.map((spot) => {
          const difficultyColor = getDifficultyColor(spot.difficulty);
          const spotIcon = L.divIcon({
            html: `<div style="background-color: ${difficultyColor}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; font-weight: bold;">${getDifficultyIcon(
              spot.difficulty
            )}</div>`,
            className: "spot-marker",
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          const marker = L.marker([spot.latitude, spot.longitude], {
            icon: spotIcon,
          }).addTo(map).bindPopup(`
              <div style="font-family: Arial, sans-serif; max-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #333;">${spot.name}</h3>
                <p style="margin: 4px 0; color: #666; font-size: 14px;">${
                  spot.description
                }</p>
                <p style="margin: 4px 0; color: #666; font-size: 12px;">Trudność: ${getDifficultyLabel(
                  spot.difficulty
                )}</p>
                <button onclick="window.handleSpotPress('${
                  spot.id
                }')" style="background: #FF6B35; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-top: 8px;">Zobacz szczegóły</button>
              </div>
            `);

          return marker;
        });

        // Store references
        leafletMapRef.current = map;
        markersRef.current = spotMarkers;
        setIsMapReady(true);
        console.log("Map initialization complete!");

        // Add click handler for map
        if (onMapPress) {
          map.on("click", (e: any) => {
            onMapPress({
              latitude: e.latlng.lat,
              longitude: e.latlng.lng,
            });
          });
        }

        // Add global function for popup buttons
        window.handleSpotPress = (spotId: string) => {
          const spot = spots.find((s) => s.id === spotId);
          if (spot) {
            onSpotPress(spot);
          }
        };
      } catch (error) {
        console.error("Failed to initialize web map:", error);
        setMapError(`Błąd inicjalizacji mapy: ${error}`);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      markersRef.current = [];
      if (window.handleSpotPress) {
        delete window.handleSpotPress;
      }
    };
  }, [leafletLoaded, location, spots, onSpotPress, onMapPress]);

  // Update markers when spots change
  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      leafletMapRef.current.removeLayer(marker);
    });

    // Add new markers
    const L = (window as any).L;
    if (!L) return;

    const spotMarkers = spots.map((spot) => {
      const difficultyColor = getDifficultyColor(spot.difficulty);
      const spotIcon = L.divIcon({
        html: `<div style="background-color: ${difficultyColor}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; font-weight: bold;">${getDifficultyIcon(
          spot.difficulty
        )}</div>`,
        className: "spot-marker",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([spot.latitude, spot.longitude], {
        icon: spotIcon,
      }).addTo(leafletMapRef.current).bindPopup(`
          <div style="font-family: Arial, sans-serif; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #333;">${spot.name}</h3>
            <p style="margin: 4px 0; color: #666; font-size: 14px;">${
              spot.description
            }</p>
            <p style="margin: 4px 0; color: #666; font-size: 12px;">Trudność: ${getDifficultyLabel(
              spot.difficulty
            )}</p>
            <button onclick="window.handleSpotPress('${
              spot.id
            }')" style="background: #FF6B35; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-top: 8px;">Zobacz szczegóły</button>
          </div>
        `);

      return marker;
    });

    markersRef.current = spotMarkers;
  }, [spots]);

  const getDifficultyColor = (difficulty: string) => {
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

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "E";
      case "moderate":
        return "M";
      case "hard":
        return "H";
      case "extreme":
        return "X";
      default:
        return "?";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "Łatwy";
      case "moderate":
        return "Średni";
      case "hard":
        return "Trudny";
      case "extreme":
        return "Ekstremalny";
      default:
        return "Nieznany";
    }
  };

  if (Platform.OS !== "web") {
    return null; // This component is web-only
  }

  if (mapError) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#FF6B35', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Błąd ładowania mapy
          </Text>
          <Text style={{ color: '#fff', textAlign: 'center' }}>
            {mapError}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isMapReady && (
        <View style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -50 }, { translateY: -50 }], zIndex: 2000 }}>
          <Text style={{ color: '#FF6B35', fontSize: 16 }}>Ładowanie mapy...</Text>
        </View>
      )}
      <div
        ref={mapRef}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: 8,
        }}
      />
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.centerButton}
          onPress={() => {
            if (leafletMapRef.current) {
              leafletMapRef.current.setView(
                [location.latitude, location.longitude],
                13
              );
            }
          }}
        >
          <Ionicons name="locate" size={20} color="#FF6B35" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  overlay: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1000,
  },
  centerButton: {
    backgroundColor: "#2a2a2a",
    borderRadius: 20,
    padding: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
});

export default WebLeafletMap;
