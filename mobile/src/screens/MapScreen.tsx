// src/screens/MapScreen.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useAuth } from "../context/AuthContext";
import { listObservations, Observation } from "../api/observations";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Map">;

type ObsPoint = {
  id: number;
  date: string;
  place_text?: string;
  latitude: number;
  longitude: number;
  photo_url?: string;
};

export default function MapScreen({ navigation }: Props) {
  const { access } = useAuth();
  const [items, setItems] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!access) return;
      setLoading(true);
      try {
        const rows = await listObservations(access);
        setItems(rows);
        setError("");
      } catch (err) {
        console.warn("Error loading observations (map)", err);
        setError("No se pudieron cargar las observaciones.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [access]);

  const points: ObsPoint[] = useMemo(
    () =>
      items
        .map((o) => {
          const lat = typeof o.latitude === "string" ? parseFloat(o.latitude) : o.latitude;
          const lon = typeof o.longitude === "string" ? parseFloat(o.longitude) : o.longitude;
          const photo = (o as any).photo_url || (o as any).photo || undefined;
          return {
            id: o.id,
            date: o.date,
            place_text: o.place_text,
            latitude: lat as number,
            longitude: lon as number,
            photo_url: photo,
          };
        })
        .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)),
    [items]
  );

  const initialRegion: Region = useMemo(() => {
    if (points.length === 0) {
      // centro por defecto (Salta)
      return {
        latitude: -24.7821,
        longitude: -65.4232,
        latitudeDelta: 8,
        longitudeDelta: 8,
      };
    }
    const avgLat = points.reduce((s, p) => s + p.latitude, 0) / points.length;
    const avgLon = points.reduce((s, p) => s + p.longitude, 0) / points.length;
    return {
      latitude: avgLat,
      longitude: avgLon,
      latitudeDelta: 5,
      longitudeDelta: 5,
    };
  }, [points]);

  // Ajustar zoom al cargar
  useEffect(() => {
    if (points.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(
        points.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
        { edgePadding: { top: 60, bottom: 60, left: 60, right: 60 }, animated: true }
      );
    }
  }, [points]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Cargando mapa…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  if (points.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No hay observaciones con coordenadas.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={initialRegion}>
        {points.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            title={p.place_text || `Obs #${p.id}`}
            description={p.date}
            onPress={() => navigation.navigate("ObservationDetail", { id: p.id })}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
