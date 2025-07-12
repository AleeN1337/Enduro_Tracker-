import React from "react";
import { View, Text, StyleSheet } from "react-native";

const TestScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏍️ Enduro Tracker</Text>
      <Text style={styles.subtitle}>Aplikacja działa!</Text>
      <Text style={styles.description}>
        To jest test aplikacji Enduro Tracker. Jeśli widzisz ten ekran, znaczy
        że podstawowa konfiguracja działa poprawnie.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF6B35",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default TestScreen;
