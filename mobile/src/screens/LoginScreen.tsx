import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Completá todos los campos");
      return;
    }

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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Logo */}
        <View style={styles.header}>
          <Text style={styles.logo}>BeetleApp</Text>
          <Text style={styles.subtitle}>Identificación de escarabajos</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Usuario</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu usuario"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Tu contraseña"
                placeholderTextColor="#999"
                secureTextEntry={!showPwd}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowPwd(!showPwd)}>
                <Text style={styles.toggleText}>{showPwd ? "Ocultar" : "Ver"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Entrar</Text>}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>© 2025 BeetleApp · UNSa</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 48,
    alignItems: "center",
  },
  logo: {
    fontSize: 42,
    fontWeight: "700",
    color: "#000",
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#000",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    height: 52,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 70,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#000",
  },
  toggleBtn: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  btn: {
    height: 52,
    backgroundColor: "#000",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  footer: {
    marginTop: 48,
    textAlign: "center",
    fontSize: 13,
    color: "#999",
  },
});
