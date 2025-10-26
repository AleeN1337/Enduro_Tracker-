import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationProvider } from "./src/contexts/NavigationContext";
import { AuthProvider } from "./src/contexts/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
