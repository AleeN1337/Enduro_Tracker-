import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EnduroSpot } from "../types";

interface AddSpotScreenProps {
  latitude: number;
  longitude: number;
  onAddSpot: (spot: Omit<EnduroSpot, "id">) => void;
  onCancel: () => void;
}

const AddSpotScreen: React.FC<AddSpotScreenProps> = ({
  latitude,
  longitude,
  onAddSpot,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<
    "easy" | "moderate" | "hard" | "extreme"
  >("moderate");
  const [category, setCategory] = useState<
    "climb" | "technical" | "jump" | "creek" | "rocks" | "mud"
  >("climb");

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Błąd", "Podaj nazwę miejsca");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Błąd", "Podaj opis miejsca");
      return;
    }

    const newSpot: Omit<EnduroSpot, "id"> = {
      name: name.trim(),
      description: description.trim(),
      latitude,
      longitude,
      difficulty,
      category,
      createdBy: "current-user", // TODO: Pobierz z kontekstu użytkownika
      createdAt: new Date(),
      rating: 0,
      images: [],
      tags: [],
    };

    onAddSpot(newSpot);
    Alert.alert("Sukces", "Miejsce zostało dodane!");
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
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

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "climb":
        return "trending-up";
      case "technical":
        return "construct";
      case "jump":
        return "airplane";
      case "creek":
        return "water";
      case "rocks":
        return "diamond";
      case "mud":
        return "earth";
      default:
        return "location";
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Dodaj nowe miejsce</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveText}>Zapisz</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={20} color="#FF6B35" />
            <Text style={styles.locationText}>
              Lokalizacja: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nazwa miejsca *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="np. Kamienny Podjazd"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Opis *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Opisz miejsce, trudności, zalecenia..."
              multiline
              numberOfLines={4}
              maxLength={300}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Poziom trudności</Text>
            <View style={styles.difficultyContainer}>
              {(["easy", "moderate", "hard", "extreme"] as const).map(
                (level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.difficultyButton,
                      difficulty === level && styles.selectedDifficulty,
                      { borderColor: getDifficultyColor(level) },
                    ]}
                    onPress={() => setDifficulty(level)}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        difficulty === level && {
                          color: getDifficultyColor(level),
                        },
                      ]}
                    >
                      {level === "easy"
                        ? "Łatwy"
                        : level === "moderate"
                        ? "Średni"
                        : level === "hard"
                        ? "Trudny"
                        : "Ekstremalny"}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kategoria</Text>
            <View style={styles.categoryContainer}>
              {(
                [
                  { key: "climb", label: "Podjazd" },
                  { key: "technical", label: "Techniczny" },
                  { key: "jump", label: "Skok" },
                  { key: "creek", label: "Potok" },
                  { key: "rocks", label: "Kamienie" },
                  { key: "mud", label: "Błoto" },
                ] as const
              ).map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryButton,
                    category === cat.key && styles.selectedCategory,
                  ]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Ionicons
                    name={getCategoryIcon(cat.key)}
                    size={20}
                    color={category === cat.key ? "#FF6B35" : "#666"}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat.key && styles.selectedCategoryText,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  cancelButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveText: {
    color: "#fff",
    fontWeight: "600",
  },
  form: {
    padding: 16,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  locationText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  difficultyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  difficultyButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 4,
    backgroundColor: "#FAFAFA",
  },
  selectedDifficulty: {
    backgroundColor: "#F0F8FF",
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryButton: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "#FAFAFA",
  },
  selectedCategory: {
    borderColor: "#FF6B35",
    backgroundColor: "#FFF3F0",
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  selectedCategoryText: {
    color: "#FF6B35",
    fontWeight: "600",
  },
});

export default AddSpotScreen;
