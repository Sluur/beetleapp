// src/screens/ObservationsListScreen.tsx
import React, { useEffect, useState, useMemo } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Button, TextInput } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useAuth } from "../context/AuthContext";
import { listObservations, Observation } from "../api/observations";

type Props = NativeStackScreenProps<RootStackParamList, "ObservationsList">;

export type ObsPoint = {
  id: number;
  date: string;
  place_text?: string;
  latitude: number;
  longitude: number;
  photo_url?: string;
};

export default function ObservationsListScreen({ navigation }: Props) {
  const { access, logout } = useAuth();
  const [items, setItems] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!access) return;
      setLoading(true);
      try {
        const rows = await listObservations(access, {
          search: query || undefined,
          ordering: ordering || undefined,
        });
        setItems(rows);
        setError("");
      } catch (err) {
        console.warn("Error loading observations", err);
        setError("No se pudo cargar la lista.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [access, query, ordering]);

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
          } as ObsPoint;
        })
        .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)),
    [items]
  );

  const renderItem = ({ item }: { item: Observation }) => {
    const photo = (item as any).photo_url || (item as any).photo || undefined;

    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("ObservationDetail", { id: item.id })}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text>Sin foto</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.date}>{item.date}</Text>
          <Text style={styles.place}>{item.place_text || "Sin lugar"}</Text>
          {item.inference && (
            <Text style={styles.inference}>
              {item.inference.predicted_label} ({Math.round(item.inference.confidence * 100)}%)
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.topBar}>
        <Button title="Nueva" onPress={() => navigation.navigate("NewObservation")} />
        {/* este lo usaremos para el mapa */}
        <Button title="Mapa" onPress={() => navigation.navigate("Map")} />
        <Button title="Salir" onPress={logout} />
      </View>

      <View style={styles.filters}>
        <TextInput style={styles.search} placeholder="Buscar por lugar…" value={query} onChangeText={setQuery} />
        {/* Para no complicar con picker nativo, de momento un input simple.
           Más adelante lo cambiamos a Picker o un menú. */}
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    gap: 8,
  },
  filters: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  search: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
  },
  listContent: {
    padding: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 1,
  },
  image: {
    width: 96,
    height: 96,
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e2e8f0",
  },
  info: {
    flex: 1,
    padding: 8,
  },
  date: {
    fontWeight: "bold",
  },
  place: {
    color: "#64748b",
  },
  inference: {
    marginTop: 4,
    color: "#1d4ed8",
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
