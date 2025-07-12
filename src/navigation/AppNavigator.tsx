import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import MapScreen from "../screens/MapScreen";
import SpotsListScreen from "../screens/SpotsListScreen";
import TrackingScreen from "../screens/TrackingScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { BottomTabParamList } from "../types";

const Tab = createBottomTabNavigator<BottomTabParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === "MapTab") {
              iconName = focused ? "map" : "map-outline";
            } else if (route.name === "SpotsTab") {
              iconName = focused ? "location" : "location-outline";
            } else if (route.name === "TrackingTab") {
              iconName = focused ? "bicycle" : "bicycle-outline";
            } else if (route.name === "ProfileTab") {
              iconName = focused ? "person" : "person-outline";
            } else {
              iconName = "help-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#FF6B35",
          tabBarInactiveTintColor: "gray",
          headerStyle: {
            backgroundColor: "#FF6B35",
          },
          headerTintColor: "#fff",
        })}
      >
        <Tab.Screen
          name="MapTab"
          component={MapScreen}
          options={{ title: "Mapa" }}
        />
        <Tab.Screen
          name="SpotsTab"
          component={SpotsListScreen}
          options={{ title: "Miejscówki" }}
        />
        <Tab.Screen
          name="TrackingTab"
          component={TrackingScreen}
          options={{ title: "Tracking" }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileScreen}
          options={{ title: "Profil" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
