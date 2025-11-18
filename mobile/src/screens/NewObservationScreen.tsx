import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
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

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [place, setPlace] = useState("");
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const [saving, setSaving] = useState(false);
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

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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

    if (!marker || !image) {
      Alert.alert("Faltan datos", "Seleccioná ubicación y foto.");
      return;
    }

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
        date: date.toISOString().slice(0, 10),
        place_text: place || undefined,
        latitude: latDb,
        longitude: lonDb,
        photo: photoFile,
        predicted_label: preview?.label,
        predicted_confidence: preview?.confidence,
        predicted_version: preview?.version,
      });

      Alert.alert("✓ Guardado", "Observación creada", [
        {
          text: "OK",
          onPress: () => navigation.navigate("ObservationsList"),
        },
      ]);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        Alert.alert("Error", JSON.stringify(err.response?.data));
      } else {
        Alert.alert("Error", "No se pudo guardar.");
      }
    } finally {
      setSaving(false);
    }
  };

  const confPct = preview ? preview.confidence * 100 : null;
  const canSave = marker && image && preview && !pvLoading && !saving;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Nueva</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.mapContainer}>
            <MapView style={StyleSheet.absoluteFill} initialRegion={initialRegion} onPress={handleMapPress}>
              {marker && <Marker coordinate={marker} />}
            </MapView>
            <View style={styles.mapHint}>
              <Text style={styles.mapHintText}>Toca para ubicar</Text>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Fecha</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateBtnText}>{formatDate(date)}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} />
                )}
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Lugar</Text>
                <TextInput style={styles.input} placeholder="Opcional" value={place} onChangeText={setPlace} />
              </View>
            </View>

            {marker && (
              <View style={styles.coords}>
                <Text style={styles.coordsText}>
                  📍 {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.photoBtn} onPress={pickImage} activeOpacity={0.7}>
              <Text style={styles.photoBtnText}>{image ? "Cambiar foto" : "📸 Elegir foto"}</Text>
            </TouchableOpacity>

            {image && <Image source={{ uri: image.uri }} style={styles.preview} />}

            {preview && (
              <>
                <Text style={styles.predLabel}>{preview.label}</Text>

                <View style={styles.predBar}>
                  <View style={[styles.predFill, { width: `${preview.confidence.toFixed(2)}%` as `${number}%` }]} />
                </View>

                <Text style={styles.predConf}>{preview.confidence.toFixed(2)}% confianza</Text>
              </>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!canSave}
              activeOpacity={0.7}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>{canSave ? "Guardar" : "Completá ubicación y foto"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  mapContainer: {
    height: 240,
    backgroundColor: "#f5f5f5",
    position: "relative",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  mapHint: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mapHintText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#000",
  },
  dateBtn: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  dateBtnText: {
    fontSize: 15,
    color: "#000",
  },
  coords: {
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
  },
  coordsText: {
    fontSize: 14,
    color: "#666",
  },
  photoBtn: {
    height: 48,
    backgroundColor: "#000",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  photoBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  predCard: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    gap: 8,
  },
  predTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  predLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginTop: 4,
  },
  predBar: {
    height: 6,
    backgroundColor: "#ddd",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 8,
  },
  predFill: {
    height: "100%",
    backgroundColor: "#000",
  },
  predConf: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  saveBtn: {
    height: 52,
    backgroundColor: "#000",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.3,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
});
