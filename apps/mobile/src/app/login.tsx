import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useAppContext } from "../providers/app-provider";

export default function LoginScreen() {
  const { signIn, loading } = useAppContext();
  const [email, setEmail] = useState("tecnico@visitasleiteiras.com");
  const [password, setPassword] = useState("123456");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const disabled = useMemo(() => !email || !password || loading, [email, loading, password]);

  async function handleLogin() {
    setErrorMessage(null);

    try {
      await signIn(email.trim(), password);
      router.replace("/home");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao entrar.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Visitas Leiteiras</Text>
        <Text style={styles.subtitle}>Acesso do técnico em modo offline-first</Text>
        <View style={styles.card}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="tecnico@visitasleiteiras.com"
            style={styles.input}
            value={email}
          />
          <Text style={styles.label}>Senha</Text>
          <TextInput
            onChangeText={setPassword}
            placeholder="******"
            secureTextEntry
            style={styles.input}
            value={password}
          />
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          <Pressable
            disabled={disabled}
            onPress={handleLogin}
            style={[styles.button, disabled ? styles.buttonDisabled : null]}
          >
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Entrar</Text>}
          </Pressable>
          <Text style={styles.hint}>Usuário seed: tecnico@visitasleiteiras.com / 123456</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f7f4"
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#103d24"
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 15,
    color: "#52705e"
  },
  card: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 20,
    gap: 10
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#103d24"
  },
  input: {
    borderWidth: 1,
    borderColor: "#d7e4d9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fbfdfb"
  },
  button: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#1f7a43",
    paddingVertical: 14,
    alignItems: "center"
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700"
  },
  hint: {
    marginTop: 8,
    color: "#52705e",
    fontSize: 12
  },
  error: {
    color: "#b3261e",
    fontSize: 13
  }
});