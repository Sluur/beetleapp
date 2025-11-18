// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false); // si después querés botón Ver/Ocultar
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const ok = await login(username, password);
      if (!ok) {
        Alert.alert("Error", "Credenciales inválidas");
      }
    } catch (err: any) {
      Alert.alert("Error", "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>BeetleApp</Text>
        <Text style={styles.subtitle}>Iniciar sesión</Text>

        <TextInput style={styles.input} placeholder="Usuario" autoCapitalize="none" value={username} onChangeText={setUsername} />

        <TextInput style={styles.input} placeholder="Contraseña" secureTextEntry={!showPwd} value={password} onChangeText={setPassword} />

        {loading ? <ActivityIndicator /> : <Button title="Entrar" onPress={handleSubmit} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#e5edff",
  },
  card: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
});
