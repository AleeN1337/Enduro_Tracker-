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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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
  const [categories, setCategories] = useState<
    ("climb" | "technical" | "jump" | "creek" | "rocks" | "mud")[]
  >([]);
  const [images, setImages] = useState<string[]>([]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Błąd", "Podaj nazwę miejsca");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Błąd", "Podaj opis miejsca");
      return;
    }

    if (categories.length === 0) {
      Alert.alert("Błąd", "Wybierz przynajmniej jedną kategorię");
      return;
    }

    const newSpot: Omit<EnduroSpot, "id"> = {
      name: name.trim(),
      description: description.trim(),
      latitude,
      longitude,
      difficulty,
      categories,
      createdBy: "current-user", // TODO: Pobierz z kontekstu użytkownika
      createdAt: new Date(),
      rating: 0,
      images: images,
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

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Błąd", "Potrzebujemy dostępu do galerii zdjęć");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Błąd", "Potrzebujemy dostępu do aparatu");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const toggleCategory = (
    categoryKey: "climb" | "technical" | "jump" | "creek" | "rocks" | "mud"
  ) => {
    setCategories((prev) => {
      if (prev.includes(categoryKey)) {
        // Usuń kategorię jeśli już jest zaznaczona
        return prev.filter((cat) => cat !== categoryKey);
      } else {
        // Dodaj kategorię jeśli nie jest zaznaczona
        return [...prev, categoryKey];
      }
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const showImagePicker = () => {
    Alert.alert("Dodaj zdjęcie", "Wybierz źródło zdjęcia", [
      { text: "Anuluj", style: "cancel" },
      { text: "Galeria", onPress: pickImage },
      { text: "Aparat", onPress: takePhoto },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Ionicons name="close" size={24} color="#ccc" />
          </TouchableOpacity>
          <Text style={styles.title}>Dodaj nowe miejsce</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveText}>Zapisz</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              📍 Lokalizacja: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nazwa miejsca *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="np. Kamienny Podjazd"
              placeholderTextColor="#888"
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
              placeholderTextColor="#888"
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
            <Text style={styles.label}>Kategorie *</Text>
            <Text style={styles.helperText}>Możesz wybrać wiele kategorii</Text>
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
                    categories.includes(cat.key) && styles.selectedCategory,
                  ]}
                  onPress={() => toggleCategory(cat.key)}
                >
                  <Ionicons
                    name={getCategoryIcon(cat.key)}
                    size={20}
                    color={categories.includes(cat.key) ? "#FF6B35" : "#666"}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      categories.includes(cat.key) &&
                        styles.selectedCategoryText,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Zdjęcia (opcjonalne)</Text>

            {images.length > 0 && (
              <ScrollView
                horizontal
                style={styles.imagesPreview}
                showsHorizontalScrollIndicator={false}
              >
                {images.map((imageUri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.previewImage}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.addImageButton}
              onPress={showImagePicker}
            >
              <Ionicons name="camera" size={24} color="#FF6B35" />
              <Text style={styles.addImageText}>
                {images.length === 0
                  ? "Dodaj zdjęcie"
                  : "Dodaj kolejne zdjęcie"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a", // Ciemne tło
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    backgroundColor: "#2a2a2a",
  },
  cancelButton: {
    backgroundColor: "#3a3a3a",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#555",
  },
  cancelText: {
    color: "#ccc",
    fontWeight: "600",
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  saveButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  form: {
    padding: 20,
  },
  locationInfo: {
    backgroundColor: "#2a2a2a",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#444",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  locationText: {
    color: "#ccc",
    fontSize: 15,
    textAlign: "center",
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  helperText: {
    fontSize: 14,
    color: "#888",
    marginBottom: 12,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  difficultyContainer: {
    flexDirection: "row",
    gap: 12,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedDifficulty: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
    shadowColor: "#FF6B35",
    shadowOpacity: 0.3,
  },
  difficultyText: {
    color: "#ccc",
    fontWeight: "600",
    fontSize: 15,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 20,
    alignItems: "center",
    minWidth: 110,
    backgroundColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCategory: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
    shadowColor: "#FF6B35",
    shadowOpacity: 0.3,
  },
  categoryText: {
    color: "#ccc",
    fontWeight: "600",
    fontSize: 14,
  },
  selectedCategoryText: {
    color: "#fff",
    fontWeight: "700",
  },
  // Image styles
  imagesPreview: {
    marginTop: 12,
  },
  imageContainer: {
    marginTop: 12,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF4444",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FF6B35",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 20,
    backgroundColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addImageText: {
    marginLeft: 8,
    color: "#FF6B35",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default AddSpotScreen;
