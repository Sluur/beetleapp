import React, { useEffect, useState } from "react";
import { Feather, Ionicons } from "@expo/vector-icons";

import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useAuth } from "../context/AuthContext";
import { listObservations, Observation } from "../api/observations";

type Props = NativeStackScreenProps<RootStackParamList, "ObservationsList">;

export default function ObservationsListScreen({ navigation }: Props) {
  const { access, logout } = useAuth();
  const [items, setItems] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!access) return;
      setLoading(true);
      try {
        const rows = await listObservations(access, {
          search: query || undefined,
        });
        setItems(rows);
      } catch (err) {
        console.warn("Error loading observations", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [access, query]);

  const handleSearchChange = (text: string) => {
    setSearchText(text);

    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    const timer = setTimeout(() => {
      setQuery(text);
    }, 500);

    setSearchTimer(timer);
  };

  const renderItem = ({ item }: { item: Observation }) => {
    const photo = (item as any).photo_url || (item as any).photo;
    const conf = item.inference?.confidence
      ? item.inference.confidence <= 1
        ? item.inference.confidence * 100
        : item.inference.confidence
      : null;

    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("ObservationDetail", { id: item.id })} activeOpacity={0.6}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>📷</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.place} numberOfLines={1}>
            {item.place_text || "Sin ubicación"}
          </Text>
          <Text style={styles.date}>{item.date}</Text>

          {item.inference && (
            <View style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>
                {item.inference.predicted_label}
              </Text>
              <Text style={styles.confidence}>{conf!.toFixed(0)}%</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Observaciones</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("Map")}>
            <Ionicons name="location-sharp" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={logout}>
            <Feather name="power" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={handleSearchChange}
        />
      </View>

      {items.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No hay observaciones</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity style={styles.floatingBtn} onPress={() => navigation.navigate("NewObservation")} activeOpacity={0.8}>
        <Text style={styles.floatingBtnIcon}>+</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  iconWhite: {
    fontSize: 20,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },
  image: {
    width: 100,
    height: 100,
    backgroundColor: "#f5f5f5",
  },
  placeholder: {
    width: 100,
    height: 100,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 32,
    opacity: 0.3,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
    gap: 4,
  },
  place: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
    color: "#666",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000",
    maxWidth: 140,
  },
  confidence: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    color: "#666",
  },
  floatingBtn: {
    position: "absolute",
    bottom: 32,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingBtnIcon: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "100",
  },
});
