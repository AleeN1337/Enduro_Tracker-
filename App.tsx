import React, { Suspense } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationProvider } from "./src/contexts/NavigationContext";
import { AuthProvider } from "./src/contexts/AuthContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";

// Lazy-load the main navigator to reduce initial JS work on cold start
const AppNavigator = React.lazy(() => import("./src/navigation/AppNavigator"));

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationProvider>
          <Suspense
            fallback={
              <View style={styles.fallback}>
                <ActivityIndicator size="large" color="#FF6B35" />
              </View>
            }
          >
            <AppNavigator />
          </Suspense>
          <StatusBar style="auto" />
        </NavigationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
});
