import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EnduroSpot } from "../types";

const SpotsListScreen = () => {
  const [spots, setSpots] = useState<EnduroSpot[]>([]);
  const [filter, setFilter] = useState<"all" | EnduroSpot["difficulty"]>("all");

  useEffect(() => {
    loadSpots();
  }, []);

  const loadSpots = () => {
    // Przykładowe dane - później będą pobierane z bazy danych
    const sampleSpots: EnduroSpot[] = [
      {
        id: "1",
        name: "Kamienny Podjazd",
        description:
          "Trudny podjazd z dużymi kamieniami. Wymaga dobrej techniki i mocnego motocykla.",
        latitude: 50.0647,
        longitude: 19.945,
        difficulty: "hard",
        category: "climb",
        rating: 4.5,
        images: [],
        createdBy: "user1",
        createdAt: new Date("2024-01-15"),
        tags: ["kamienie", "stromy", "techniczny"],
      },
      {
        id: "2",
        name: "Błotna Sekcja",
        description:
          "Głębokie błoto po deszczu. Najlepiej jeździć w suchej porze.",
        latitude: 50.07,
        longitude: 19.95,
        difficulty: "moderate",
        category: "mud",
        rating: 3.8,
        images: [],
        createdBy: "user2",
        createdAt: new Date("2024-01-10"),
        tags: ["błoto", "mokro", "sezonowe"],
      },
      {
        id: "3",
        name: "Skok przez wąwóz",
        description:
          "Spektakularny skok dla odważnych. Tylko dla zaawansowanych!",
        latitude: 50.06,
        longitude: 19.94,
        difficulty: "extreme",
        category: "jump",
        rating: 4.9,
        images: [],
        createdBy: "user3",
        createdAt: new Date("2024-01-20"),
        tags: ["skok", "ekstrem", "niebezpieczne"],
      },
    ];
    setSpots(sampleSpots);
  };

  const filteredSpots = spots.filter(
    (spot) => filter === "all" || spot.difficulty === filter
  );

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

  const getDifficultyText = (difficulty: EnduroSpot["difficulty"]) => {
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

  const getCategoryIcon = (category: EnduroSpot["category"]) => {
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
  };

  const renderSpotItem = ({ item }: { item: EnduroSpot }) => (
    <TouchableOpacity
      style={styles.spotItem}
      onPress={() => {
        Alert.alert("Info", `Szczegóły miejsca: ${item.name}`);
      }}
    >
      <View style={styles.spotHeader}>
        <View style={styles.spotTitleRow}>
          <Ionicons
            name={getCategoryIcon(item.category)}
            size={20}
            color="#FF6B35"
          />
          <Text style={styles.spotName}>{item.name}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>

      <Text style={styles.spotDescription} numberOfLines={2}>
        {item.description}
      </Text>

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
  );

  const FilterButton = ({
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
  );

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
      <FlatList
        data={filteredSpots}
        renderItem={renderSpotItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "white",
    elevation: 2,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 15,
    backgroundColor: "#e0e0e0",
  },
  activeFilterButton: {
    backgroundColor: "#FF6B35",
  },
  filterText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  activeFilterText: {
    color: "white",
  },
  list: {
    flex: 1,
    paddingHorizontal: 15,
  },
  spotItem: {
    backgroundColor: "white",
    marginVertical: 8,
    padding: 15,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  spotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  spotTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  spotName: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#333",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  spotDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  spotFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flex: 1,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
  },
  tagText: {
    fontSize: 12,
    color: "#666",
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default SpotsListScreen;
