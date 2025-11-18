// src/screens/ObservationDetailScreen.tsx
import React from "react";
import { View, Text } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "ObservationDetail">;

export default function ObservationDetailScreen({ route }: Props) {
  const { id } = route.params;

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Detalle de observación #{id}</Text>
      <Text>(Después lo conectamos al endpoint /observations/:id/)</Text>
    </View>
  );
}
