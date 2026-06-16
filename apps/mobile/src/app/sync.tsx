import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAppContext } from "../providers/app-provider";

export default function SyncScreen() {
  const { syncQueue, syncState, syncNow } = useAppContext();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Estado da sincronização</Text>
          <Text style={styles.item}>Online: {syncState.online ? "Sim" : "Não"}</Text>
          <Text style={styles.item}>Último sync: {syncState.lastSyncAt ?? "Nunca"}</Text>
          <Text style={styles.item}>Pendências: {syncQueue.length}</Text>
          {syncState.lastError ? <Text style={styles.error}>{syncState.lastError}</Text> : null}
          <Pressable onPress={syncNow} style={styles.button}>
            <Text style={styles.buttonText}>Sincronizar agora</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Fila local</Text>
          {syncQueue.map((item) => (
            <View key={item.id} style={styles.queueItem}>
              <Text style={styles.queueTitle}>
                {item.entityType} • {item.operation}
              </Text>
              <Text style={styles.item}>Status: {item.status}</Text>
              <Text style={styles.item}>Tentativas: {item.retryCount}</Text>
              {item.lastError ? <Text style={styles.error}>{item.lastError}</Text> : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f7f4"
  },
  container: {
    padding: 20,
    gap: 16
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    gap: 10
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#103d24"
  },
  item: {
    color: "#52705e"
  },
  queueItem: {
    borderTopWidth: 1,
    borderTopColor: "#e6eee7",
    paddingTop: 12,
    gap: 4
  },
  queueTitle: {
    fontWeight: "700",
    color: "#103d24"
  },
  button: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#1f7a43",
    paddingVertical: 14,
    alignItems: "center"
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700"
  },
  error: {
    color: "#b3261e"
  }
});