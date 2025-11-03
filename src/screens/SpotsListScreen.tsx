import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import { EnduroSpot, UserLocation } from "../types";
import { useNavigation as useNavigationContext } from "../contexts/NavigationContext";

// Mock storage - w prawdziwej aplikacji to będzie AsyncStorage lub SQLite
let globalSpots: EnduroSpot[] = [];

export const addSpot = (spot: EnduroSpot) => {
  globalSpots.push(spot);
};

export const removeSpot = (spotId: string) => {
  globalSpots = globalSpots.filter((spot) => spot.id !== spotId);
};

export const getAllSpots = () => {
  return globalSpots;
};

export const updateSpot = (updatedSpot: EnduroSpot) => {
  const index = globalSpots.findIndex((spot) => spot.id === updatedSpot.id);
  if (index !== -1) {
    globalSpots[index] = updatedSpot;
  }
};

const SpotsListScreen = () => {
  const [spots, setSpots] = useState<EnduroSpot[]>([]);
  const [filter, setFilter] = useState<"all" | EnduroSpot["difficulty"]>("all");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const navigationContext = useNavigationContext();
  const navigation = useNavigation();

  useEffect(() => {
    loadSpots();
    getUserLocation();
    
    // Nasłuchuj focusa ekranu aby odświeżyć listę
    const unsubscribe = navigation.addListener('focus', () => {
      loadSpots();
    });
    
    return unsubscribe;
  }, [navigation]);

  const getUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Zbalansowana dokładność dla lepszej wydajności
        });
        setUserLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          altitude: currentLocation.coords.altitude || undefined,
          accuracy: currentLocation.coords.accuracy || undefined,
          timestamp: currentLocation.timestamp,
        });
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
  }, []);

  const openNavigation = useCallback((spot: EnduroSpot) => {
    if (!userLocation) {
      Alert.alert("Błąd", "Nie można ustalić twojej lokalizacji");
      return;
    }

    // Pokaż opcje nawigacji
    Alert.alert("Wybierz typ nawigacji", `Nawiguj do: ${spot.name}`, [
      { text: "Anuluj", style: "cancel" },
      {
        text: "🗺️ Trasa na mapie",
        onPress: () => {
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
  }, [userLocation, navigationContext]);

  const loadSpots = useCallback(() => {
    // Filtruj tylko miejsca utworzone przez aktualnego użytkownika
    const userSpots = globalSpots.filter(
      (spot) => spot.createdBy === "current-user"
    );
    setSpots(userSpots);
  }, []);

  const handleDeleteSpot = useCallback((spot: EnduroSpot) => {
    Alert.alert(
      "Usuń miejscówkę",
      `Czy na pewno chcesz usunąć "${spot.name}"?`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: () => {
            removeSpot(spot.id);
            loadSpots();
          },
        },
      ]
    );
  }, [loadSpots]);

  const handleCommentsPress = useCallback((spot: EnduroSpot) => {
    (navigation as any).navigate("SpotDetails", { spotId: spot.id });
  }, [navigation]);

  const filteredSpots = useMemo(() => 
    spots.filter((spot) => filter === "all" || spot.difficulty === filter),
    [spots, filter]
  );

  const getDifficultyColor = useCallback((difficulty: EnduroSpot["difficulty"]) => {
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
  }, []);

  const getDifficultyText = useCallback((difficulty: EnduroSpot["difficulty"]) => {
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
  }, []);

  const getCategoryIcon = useCallback((
    category: "climb" | "technical" | "jump" | "creek" | "rocks" | "mud"
  ) => {
    switch (category) {
      case "climb":
        return "trending-up";
      case "technical":
        return "construct";
      case "jump":
        return "arrow-up";
      case "creek":
        return "water";
      case "rocks":
        return "diamond";
      case "mud":
        return "cloudy";
      default:
        return "location";
    }
  }, []);

  const handleSpotPress = useCallback((item: EnduroSpot) => {
    (navigation as any).navigate("SpotDetails", { spotId: item.id });
  }, [navigation]);

  const renderSpotItem = useCallback(({ item }: { item: EnduroSpot }) => (
    <TouchableOpacity
      style={styles.spotItem}
      onPress={() => handleSpotPress(item)}
    >
      <View style={styles.spotHeader}>
        <View style={styles.spotTitleRow}>
          <Ionicons
            name={getCategoryIcon(item.categories[0] || "climb")}
            size={20}
            color="#FF6B35"
          />
          <Text style={styles.spotName}>{item.name}</Text>
        </View>
        <View style={styles.spotActions}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
          </View>
          <TouchableOpacity
            style={styles.commentsButton}
            onPress={() => handleCommentsPress(item)}
          >
            <Ionicons name="chatbubble" size={16} color="#3498db" />
            <Text style={styles.commentsCount}>
              {item.comments?.length || 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteSpot(item)}
          >
            <Ionicons name="trash" size={18} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.spotDescription} numberOfLines={2}>
        {item.description}
      </Text>

      {/* Pokaż zdjęcia jeśli są */}
      {item.images && item.images.length > 0 && (
        <ScrollView
          horizontal
          style={styles.imagesContainer}
          showsHorizontalScrollIndicator={false}
        >
          {item.images.map((imageUri, index) => (
            <Image
              key={index}
              source={{ uri: imageUri }}
              style={styles.spotImage}
            />
          ))}
        </ScrollView>
      )}

      <View style={styles.spotFooter}>
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.difficultyBadge,
            { backgroundColor: getDifficultyColor(item.difficulty) },
          ]}
        >
          <Text style={styles.difficultyText}>
            {getDifficultyText(item.difficulty)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [handleSpotPress, openNavigation, handleDeleteSpot, handleCommentsPress, getDifficultyColor, getDifficultyText, getCategoryIcon]);

  const FilterButton = React.memo(({
    title,
    filterValue,
    isActive,
  }: {
    title: string;
    filterValue: typeof filter;
    isActive: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.activeFilterButton]}
      onPress={() => setFilter(filterValue)}
    >
      <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
        {title}
      </Text>
    </TouchableOpacity>
  ));

  return (
    <View style={styles.container}>
      {/* Filtry */}
      <View style={styles.filtersContainer}>
        <FilterButton
          title="Wszystkie"
          filterValue="all"
          isActive={filter === "all"}
        />
        <FilterButton
          title="Łatwe"
          filterValue="easy"
          isActive={filter === "easy"}
        />
        <FilterButton
          title="Średnie"
          filterValue="moderate"
          isActive={filter === "moderate"}
        />
        <FilterButton
          title="Trudne"
          filterValue="hard"
          isActive={filter === "hard"}
        />
        <FilterButton
          title="Ekstremalne"
          filterValue="extreme"
          isActive={filter === "extreme"}
        />
      </View>

      {/* Lista miejscówek */}
      {filteredSpots.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>Brak miejscówek</Text>
          <Text style={styles.emptyDescription}>
            Idź do zakładki "Mapa" i dodaj swoje pierwsze miejsce enduro!
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSpots}
          renderItem={renderSpotItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a", // Ciemne tło
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#2a2a2a", // Ciemny gradient
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: "#3a3a3a",
    borderWidth: 1,
    borderColor: "#555",
    minWidth: 80,
    alignItems: "center",
  },
  activeFilterButton: {
    backgroundColor: "linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%)", // Gradient pomarańczowy
    borderColor: "#FF6B35",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  filterText: {
    fontSize: 13,
    color: "#ccc",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  activeFilterText: {
    color: "#fff",
    fontWeight: "700",
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  spotItem: {
    backgroundColor: "#2a2a2a", // Ciemne karty
    marginVertical: 8,
    padding: 20,
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
  },
  spotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  spotTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  spotName: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 12,
    color: "#fff", // Biały tekst
    letterSpacing: 0.3,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  spotActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButton: {
    backgroundColor: "#ff4444",
    padding: 8,
    borderRadius: 12,
    shadowColor: "#ff4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  commentsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  commentsCount: {
    marginLeft: 4,
    fontSize: 12,
    color: "#3498db",
    fontWeight: "600",
  },
  imagesContainer: {
    marginVertical: 12,
  },
  spotImage: {
    width: 90,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#444",
  },
  rating: {
    marginLeft: 6,
    fontSize: 14,
    color: "#ffd700",
    fontWeight: "600",
  },
  spotDescription: {
    fontSize: 15,
    color: "#bbb", // Jasnoszary tekst
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: "400",
  },
  spotFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flex: 1,
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#3a3a3a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#555",
  },
  tagText: {
    fontSize: 12,
    color: "#FF6B35",
    fontWeight: "600",
  },
  difficultyBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  difficultyText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#666",
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  emptyDescription: {
    fontSize: 17,
    color: "#888",
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "400",
  },
});

export default SpotsListScreen;
