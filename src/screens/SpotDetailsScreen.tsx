import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import { EnduroSpot, Comment, RootStackParamList } from "../types";
import CommentsSection from "../components/CommentsSection";
import { getAllSpots, updateSpot } from "./SpotsListScreen";

type SpotDetailsScreenRouteProp = RouteProp<RootStackParamList, "SpotDetails">;

const SpotDetailsScreen: React.FC = () => {
  const route = useRoute<SpotDetailsScreenRouteProp>();
  const navigation = useNavigation();
  const { spotId } = route.params;

  const [spot, setSpot] = useState<EnduroSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const likeAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadSpot();
  }, [spotId]);

  const loadSpot = async () => {
    try {
      const spots = await getAllSpots();
      const foundSpot = spots.find((s: EnduroSpot) => s.id === spotId);
      if (foundSpot) {
        setSpot(foundSpot);
        // Initialize like state based on current user
        const currentUserId = "current_user"; // TODO: replace with actual user ID
        setIsLiked(foundSpot.likedBy?.includes(currentUserId) || false);
        setLikesCount(foundSpot.likes || 0);
      } else {
        Alert.alert("Błąd", "Nie znaleziono miejsca");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error loading spot:", error);
      Alert.alert("Błąd", "Nie udało się załadować miejsca");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (content: string, rating?: number) => {
    if (!spot) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      spotId: spot.id,
      userId: "current_user", // TODO: replace with actual user ID
      username: "Ty", // TODO: replace with actual username
      content,
      rating,
      createdAt: new Date(),
      likes: 0,
      likedBy: [],
    };

    const updatedSpot = {
      ...spot,
      comments: [...spot.comments, newComment],
    };

    try {
      // Update the spot in storage
      updateSpot(updatedSpot);
      setSpot(updatedSpot);
      Alert.alert("Sukces", "Komentarz został dodany!");
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się dodać komentarza");
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!spot) return;

    const updatedComments = spot.comments.map((comment) => {
      if (comment.id === commentId) {
        const isLiked = comment.likedBy.includes("current_user"); // TODO: actual user ID
        return {
          ...comment,
          likes: isLiked ? comment.likes - 1 : comment.likes + 1,
          likedBy: isLiked
            ? comment.likedBy.filter((id) => id !== "current_user")
            : [...comment.likedBy, "current_user"],
        };
      }
      return comment;
    });

    const updatedSpot = {
      ...spot,
      comments: updatedComments,
    };

    try {
      // Update the spot in storage
      updateSpot(updatedSpot);
      setSpot(updatedSpot);
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się zaktualizować polubienia");
    }
  };

  const handleLikeSpot = async () => {
    if (!spot) return;

    // Animate the button
    Animated.sequence([
      Animated.timing(likeAnimation, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(likeAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const currentUserId = "current_user"; // TODO: replace with actual user ID
    const userHasLiked = spot.likedBy?.includes(currentUserId) || false;

    const updatedSpot = {
      ...spot,
      likes: userHasLiked ? (spot.likes || 0) - 1 : (spot.likes || 0) + 1,
      likedBy: userHasLiked
        ? spot.likedBy?.filter((id) => id !== currentUserId) || []
        : [...(spot.likedBy || []), currentUserId],
    };

    try {
      updateSpot(updatedSpot);
      setSpot(updatedSpot);
      setIsLiked(!userHasLiked);
      setLikesCount(updatedSpot.likes);
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się zaktualizować polubienia");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "#66bb6a";
      case "moderate":
        return "#ffb74d";
      case "hard":
        return "#ef5350";
      case "extreme":
        return "#ba68c8";
      default:
        return "#2196F3";
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "climb":
        return "↗";
      case "technical":
        return "⚙";
      case "jump":
        return "✈";
      case "creek":
        return "≋";
      case "rocks":
        return "◆";
      case "mud":
        return "●";
      default:
        return "📍";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
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
        return "Inne";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Ładowanie...</Text>
      </View>
    );
  }

  if (!spot) {
    return (
      <View style={styles.errorContainer}>
        <Text>Miejsce nie zostało znalezione</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Mini mapa */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: spot.latitude,
            longitude: spot.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Marker
            coordinate={{
              latitude: spot.latitude,
              longitude: spot.longitude,
            }}
            title={spot.name}
          />
        </MapView>
      </View>

      {/* Szczegóły spotu */}
      <View style={styles.detailsContainer}>
        <Text style={styles.spotName}>{spot.name}</Text>

        <View style={styles.difficultyContainer}>
          <Text
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(spot.difficulty) },
            ]}
          >
            {getDifficultyLabel(spot.difficulty)}
          </Text>
        </View>

        <Text style={styles.description}>{spot.description}</Text>

        {/* Kategorie */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Kategorie:</Text>
          <View style={styles.categoriesList}>
            {spot.categories.map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                <Text style={styles.categoryIcon}>
                  {getCategoryIcon(category)}
                </Text>
                <Text style={styles.categoryLabel}>
                  {getCategoryLabel(category)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tagi */}
        {spot.tags && spot.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.sectionTitle}>Tagi:</Text>
            <View style={styles.tagsList}>
              {spot.tags.map((tag, index) => (
                <Text key={index} style={styles.tag}>
                  #{tag}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Statystyki */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.statValue}>{spot.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Ocena</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={20} color="#3498db" />
            <Text style={styles.statValue}>{spot.comments.length}</Text>
            <Text style={styles.statLabel}>Komentarze</Text>
          </View>
          <Animated.View style={{ transform: [{ scale: likeAnimation }] }}>
            <TouchableOpacity
              style={[styles.statItem, styles.likeButton, isLiked && styles.likedButton]}
              onPress={handleLikeSpot}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={20}
                color={isLiked ? "#e74c3c" : "#666"}
              />
              <Text style={styles.statValue}>{likesCount}</Text>
              <Text style={styles.statLabel}>Polubienia</Text>
            </TouchableOpacity>
          </Animated.View>
          <View style={styles.statItem}>
            <Ionicons name="person" size={20} color="#27ae60" />
            <Text style={styles.statValue}>{spot.createdBy}</Text>
            <Text style={styles.statLabel}>Autor</Text>
          </View>
        </View>
      </View>

      {/* Sekcja komentarzy */}
      <CommentsSection
        spotId={spot.id}
        comments={spot.comments}
        onAddComment={handleAddComment}
        onLikeComment={handleLikeComment}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mapContainer: {
    height: 200,
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  detailsContainer: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  spotName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  difficultyContainer: {
    marginBottom: 12,
  },
  difficultyBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  description: {
    fontSize: 16,
    color: "#34495e",
    lineHeight: 24,
    marginBottom: 16,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  categoriesList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryLabel: {
    fontSize: 14,
    color: "#34495e",
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#e8f4f8",
    color: "#3498db",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e1e8ed",
  },
  statItem: {
    alignItems: "center",
  },
  likeButton: {
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  likedButton: {
    backgroundColor: "rgba(231, 76, 60, 0.1)",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});

export default SpotDetailsScreen;
