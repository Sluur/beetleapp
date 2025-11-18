import React, { useEffect, useState, useMemo, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import MapView, { Marker, Region, Callout } from "react-native-maps";
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
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!access) return;
      setLoading(true);
      try {
        const rows = await listObservations(access);
        setItems(rows);
      } catch (err) {
        console.warn("Error loading observations", err);
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

  useEffect(() => {
    if (points.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(
        points.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
        { edgePadding: { top: 100, bottom: 100, left: 60, right: 60 }, animated: true }
      );
    }
  }, [points]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (points.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🗺️</Text>
        <Text style={styles.emptyText}>Sin observaciones</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mapa</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{points.length}</Text>
        </View>
      </View>

      {/* Map */}
      <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={initialRegion}>
        {points.map((p) => (
          <Marker key={p.id} coordinate={{ latitude: p.latitude, longitude: p.longitude }}>
            <Callout onPress={() => navigation.navigate("ObservationDetail", { id: p.id })}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{p.place_text || `Obs #${p.id}`}</Text>
                <Text style={styles.calloutDate}>{p.date}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  backText: {
    fontSize: 28,
    color: "#000",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  badge: {
    backgroundColor: "#000",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  callout: {
    width: 180,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  calloutDate: {
    fontSize: 13,
    color: "#666",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    color: "#666",
  },
});
