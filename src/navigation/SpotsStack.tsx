import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

import MapScreen from "../screens/MapScreen";
import SpotsListScreen from "../screens/SpotsListScreen";
import TrackingScreen from "../screens/TrackingScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SpotDetailsScreen from "../screens/SpotDetailsScreen";
import { RootStackParamList } from "../types";

const Stack = createStackNavigator<RootStackParamList>();

const SpotsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FF6B35",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="SpotsList"
        component={SpotsListScreen}
        options={{ title: "Moje Miejscówki" }}
      />
      <Stack.Screen
        name="SpotDetails"
        component={SpotDetailsScreen}
        options={({ navigation }) => ({
          title: "Szczegóły miejsca",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 16 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

export default SpotsStack;