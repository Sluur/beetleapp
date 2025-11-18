import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useAuth } from "../context/AuthContext";
import { getObservation, deleteObservation, type Observation } from "../api/observations";
import { Feather } from "@expo/vector-icons";

type Props = NativeStackScreenProps<RootStackParamList, "ObservationDetail">;

export default function ObservationDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { access } = useAuth();

  const [item, setItem] = useState<Observation | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadObservation();
  }, [id]);

  const loadObservation = async () => {
    if (!access) return;

    setLoading(true);
    try {
      const data = await getObservation(access, id);
      setItem(data);
    } catch (err) {
      console.warn("Error loading observation", err);
      Alert.alert("Error", "No se pudo cargar la observación");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Eliminar observación", "¿Estás seguro? Esta acción no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          if (!access) return;

          setDeleting(true);
          try {
            await deleteObservation(access, id);
            Alert.alert("✓ Eliminado", "Observación eliminada", [{ text: "OK", onPress: () => navigation.navigate("ObservationsList") }]);
          } catch (err) {
            Alert.alert("Error", "No se pudo eliminar");
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Error</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>No se pudo cargar la observación</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadObservation}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const conf = item.inference?.confidence
    ? item.inference.confidence <= 1
      ? item.inference.confidence * 100
      : item.inference.confidence
    : null;

  const photo = item.photo_url || item.photo;
  const lat = typeof item.latitude === "string" ? parseFloat(item.latitude) : item.latitude;
  const lon = typeof item.longitude === "string" ? parseFloat(item.longitude) : item.longitude;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Detalle</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
          {deleting ? <ActivityIndicator size="small" color="#000" /> : <Feather name="trash-2" size={20} color="#000" />}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>📷</Text>
            <Text style={styles.imagePlaceholderLabel}>Sin imagen</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.row}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Fecha</Text>
              <Text style={styles.infoValue}>{item.date}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Lugar</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {item.place_text || "Sin especificar"}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Latitud</Text>
              <Text style={[styles.infoValue, styles.monoValue]}>{Number.isFinite(lat) ? lat.toFixed(6) : lat}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Longitud</Text>
              <Text style={[styles.infoValue, styles.monoValue]}>{Number.isFinite(lon) ? lon.toFixed(6) : lon}</Text>
            </View>
          </View>

          {item.inference ? (
            <View style={styles.predCard}>
              <Text style={styles.predTitle}>Predicción del modelo</Text>
              <Text style={styles.predLabel}>{item.inference.predicted_label}</Text>

              <View style={styles.predBar}>
                <View style={[styles.predFill, { width: conf ? `${Math.round(conf)}%` : "0%" }]} />
              </View>

              <View style={styles.predFooter}>
                <Text style={styles.predConf}>{conf ? `${conf.toFixed(1)}%` : "0%"} confianza</Text>
                {item.inference.created_at && (
                  <Text style={styles.predDate}>{new Date(item.inference.created_at).toLocaleDateString()}</Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.noPredCard}>
              <Text style={styles.noPredIcon}>🤖</Text>
              <Text style={styles.noPredText}>Sin predicción del modelo</Text>
            </View>
          )}

          {item.created_at && (
            <View style={styles.metaCard}>
              <Text style={styles.metaText}>Creada el {new Date(item.created_at).toLocaleString("es-AR")}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  deleteBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 320,
    backgroundColor: "#f5f5f5",
  },
  imagePlaceholder: {
    width: "100%",
    height: 320,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: 64,
    opacity: 0.3,
    marginBottom: 8,
  },
  imagePlaceholderLabel: {
    fontSize: 14,
    color: "#999",
  },
  content: {
    padding: 20,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  infoCard: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  monoValue: {
    fontFamily: "Courier",
    fontSize: 14,
  },
  predCard: {
    marginTop: 8,
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
  },
  predTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  predLabel: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  predBar: {
    height: 8,
    backgroundColor: "#ddd",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  predFill: {
    height: "100%",
    backgroundColor: "#000",
  },
  predFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  predConf: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  predDate: {
    fontSize: 12,
    color: "#666",
  },
  noPredCard: {
    marginTop: 8,
    padding: 32,
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    alignItems: "center",
  },
  noPredIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.3,
  },
  noPredText: {
    fontSize: 14,
    color: "#999",
  },
  metaCard: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: "#999",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#000",
    borderRadius: 10,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
