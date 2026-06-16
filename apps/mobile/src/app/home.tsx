import { router } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAppContext } from "../providers/app-provider";

export default function HomeScreen() {
  const { session, syncState, localSummary, signOut } = useAppContext();

  const cards = [
    {
      title: "Agenda",
      value: String(localSummary.scheduleCount),
      subtitle: "Visitas planejadas",
      route: "/agenda"
    },
    {
      title: "Clientes",
      value: String(localSummary.clientCount),
      subtitle: "Clientes locais",
      route: "/clients"
    },
    {
      title: "Pendências",
      value: String(localSummary.pendingSyncCount),
      subtitle: "Itens aguardando sync",
      route: "/sync"
    },
    {
      title: "Visitas",
      value: String(localSummary.visitCount),
      subtitle: "Registros locais",
      route: "/visit"
    }
  ] as const;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {session?.name}</Text>
            <Text style={styles.meta}>
              Área {session?.consultantArea ?? "--"} • {syncState.online ? "Online" : "Offline"}
            </Text>
          </View>
          <Pressable onPress={signOut} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Sair</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {cards.map((card) => (
            <Pressable key={card.title} onPress={() => router.push(card.route)} style={styles.card}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardValue}>{card.value}</Text>
              <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações rápidas</Text>
          <View style={styles.actions}>
            <ActionButton label="Nova visita" route="/visit" />
            <ActionButton label="Nova agenda" route="/agenda" />
            <ActionButton label="Clientes" route="/clients" />
            <ActionButton label="Sincronizar" route="/sync" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Última sincronização</Text>
          <Text style={styles.infoText}>{syncState.lastSyncAt ?? "Ainda não sincronizado"}</Text>
          {syncState.lastError ? <Text style={styles.errorText}>{syncState.lastError}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({ label, route }: { label: string; route: "/agenda" | "/clients" | "/visit" | "/sync" }) {
  return (
    <Pressable onPress={() => router.push(route)} style={styles.actionButton}>
      <Text style={styles.actionButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f7f4"
  },
  container: {
    padding: 20,
    gap: 20
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#103d24"
  },
  meta: {
    marginTop: 4,
    color: "#52705e"
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#c7d8cb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  secondaryButtonText: {
    color: "#103d24",
    fontWeight: "600"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  card: {
    width: "47%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16
  },
  cardTitle: {
    fontSize: 14,
    color: "#52705e"
  },
  cardValue: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: "700",
    color: "#103d24"
  },
  cardSubtitle: {
    marginTop: 8,
    color: "#52705e"
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    gap: 12
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#103d24"
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  actionButton: {
    borderRadius: 12,
    backgroundColor: "#1f7a43",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "700"
  },
  infoText: {
    color: "#103d24"
  },
  errorText: {
    color: "#b3261e"
  }
});