import React, { useState } from "react";
import { View, Text, TextInput, Button, ActivityIndicator, Image, Alert, ScrollView, StyleSheet } from "react-native";
import MapView, { Marker, MapPressEvent, Region } from "react-native-maps";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useAuth } from "../context/AuthContext";
import { createObservation, predictPreview } from "../api/observations";
import axios from "axios";

type Props = NativeStackScreenProps<RootStackParamList, "NewObservation">;

type Preview = {
  label: string;
  confidence: number;
  version: string;
};

export default function NewObservationScreen({ navigation }: Props) {
  const { access } = useAuth();

  // Fecha por defecto = hoy, en formato YYYY-MM-DD
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [place, setPlace] = useState("");
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const [saving, setSaving] = useState(false);

  // Preview IA
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pvLoading, setPvLoading] = useState(false);

  const initialRegion: Region = {
    latitude: -24.7821,
    longitude: -65.4232,
    latitudeDelta: 0.3,
    longitudeDelta: 0.3,
  };

  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitas permitir acceso a la galería.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImage(asset);
      setPreview(null);

      if (!access) return;

      try {
        setPvLoading(true);
        const file = {
          uri: asset.uri,
          name: asset.fileName ?? "photo.jpg",
          type: asset.mimeType ?? "image/jpeg",
        };
        const data = await predictPreview(access, file);
        setPreview({
          label: data.label,
          confidence: data.confidence,
          version: data.version,
        });
      } catch (err) {
        console.warn("Error predict_preview", err);
        setPreview(null);
      } finally {
        setPvLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!access) return;

    if (!date || !marker || !image) {
      Alert.alert("Faltan datos", "Completá fecha, seleccioná un punto en el mapa y elegí una foto.");
      return;
    }

    // 👉 redondeamos a 6 decimales para respetar max_digits/decimal_places de Django
    const latDb = Number(marker.latitude.toFixed(6));
    const lonDb = Number(marker.longitude.toFixed(6));

    try {
      setSaving(true);

      const photoFile = {
        uri: image.uri,
        name: image.fileName ?? "photo.jpg",
        type: image.mimeType ?? "image/jpeg",
      };

      await createObservation(access, {
        date, // ya está en YYYY-MM-DD
        place_text: place || undefined,
        latitude: latDb,
        longitude: lonDb,
        photo: photoFile,
        predicted_label: preview?.label,
        predicted_confidence: preview?.confidence,
        predicted_version: preview?.version,
      });

      Alert.alert("OK", "Observación creada.", [
        {
          text: "Aceptar",
          onPress: () => navigation.navigate("ObservationsList"),
        },
      ]);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        console.log("STATUS", err.response?.status);
        console.log("DATA", err.response?.data);
        Alert.alert("Error", typeof err.response?.data === "string" ? err.response.data : JSON.stringify(err.response?.data, null, 2));
      } else {
        console.log("Error creando observación", err);
        Alert.alert("Error", "No se pudo guardar la observación.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        {/* Mapa */}
        <View style={styles.mapContainer}>
          <MapView style={StyleSheet.absoluteFill} initialRegion={initialRegion} onPress={handleMapPress}>
            {marker && <Marker coordinate={marker} />}
          </MapView>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Text style={styles.title}>Nueva observación</Text>

          <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} placeholder="2025-11-17" value={date} onChangeText={setDate} />

          <Text style={styles.label}>Lugar (opcional)</Text>
          <TextInput style={styles.input} placeholder="Cerro San Bernardo" value={place} onChangeText={setPlace} />

          <Text style={styles.label}>Coordenadas</Text>
          <Text style={styles.coords}>
            {marker
              ? `Lat: ${marker.latitude.toFixed(6)}  Lon: ${marker.longitude.toFixed(6)}`
              : "Tocá en el mapa para seleccionar un punto"}
          </Text>

          <Text style={styles.label}>Foto</Text>
          <Button title="Elegir foto" onPress={pickImage} />

          {image && <Image source={{ uri: image.uri }} style={styles.preview} />}

          {/* Predicción del modelo (preview) */}
          <View style={styles.predBox}>
            <Text style={styles.predTitle}>Predicción del modelo</Text>
            {pvLoading && <ActivityIndicator style={{ marginTop: 6 }} />}
            {!pvLoading && preview && (
              <>
                <Text style={styles.predLine}>Etiqueta: {preview.label}</Text>
                <Text style={styles.predLine}>Confianza: {Math.round(preview.confidence * 100)}%</Text>
                <Text style={styles.predLine}>Modelo: {preview.version}</Text>
              </>
            )}
            {!pvLoading && !preview && <Text style={styles.predLine}>Elegí una foto para ver la predicción.</Text>}
          </View>

          <View style={{ marginTop: 16 }}>
            {saving ? <ActivityIndicator /> : <Button title="Guardar observación" onPress={handleSave} />}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  mapContainer: {
    height: 300,
    backgroundColor: "#e2e8f0",
  },
  form: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  label: {
    fontWeight: "600",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
  },
  coords: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
  preview: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginTop: 8,
  },
  predBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  predTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  predLine: {
    fontSize: 14,
    marginTop: 2,
  },
});
