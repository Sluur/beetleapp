// src/navigation/RootNavigator.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import ObservationsListScreen from "../screens/ObservationsListScreen";
import MapScreen from "../screens/MapScreen";
import ObservationDetailScreen from "../screens/ObservationDetailScreen";
import NewObservationScreen from "../screens/NewObservationScreen";

export type RootStackParamList = {
  Login: undefined;
  ObservationsList: undefined;
  ObservationDetail: { id: number };
  NewObservation: undefined;
  Map: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <Stack.Navigator>
          <Stack.Screen name="ObservationsList" component={ObservationsListScreen} options={{ title: "Observaciones" }} />
          <Stack.Screen name="Map" component={MapScreen} options={{ title: "Mapa de observaciones" }} />
          <Stack.Screen name="ObservationDetail" component={ObservationDetailScreen} options={{ title: "Detalle" }} />
          <Stack.Screen name="NewObservation" component={NewObservationScreen} options={{ title: "Nueva observación" }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: "BeetleApp - Login" }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
