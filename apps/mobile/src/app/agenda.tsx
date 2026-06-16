import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useAppContext } from "../providers/app-provider";

export default function AgendaScreen() {
  const { schedules, properties, createSchedule } = useAppContext();
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");

  const propertyMap = useMemo(
    () => new Map(properties.map((property) => [property.id, property])),
    [properties]
  );

  async function handleCreateSchedule() {
    if (!propertyId) {
      Alert.alert("Selecione a propriedade.");
      return;
    }

    await createSchedule({
      propertyId,
      scheduledAt: new Date(scheduledAt).toISOString(),
      notes
    });

    setNotes("");
    Alert.alert("Agenda salva localmente.");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Nova agenda</Text>
          <Text style={styles.label}>ID da propriedade</Text>
          <TextInput onChangeText={setPropertyId} style={styles.input} value={propertyId} />
          <Text style={styles.label}>Data e hora</Text>
          <TextInput onChangeText={setScheduledAt} style={styles.input} value={scheduledAt} />
          <Text style={styles.label}>Observações</Text>
          <TextInput
            multiline
            numberOfLines={3}
            onChangeText={setNotes}
            style={[styles.input, styles.multiline]}
            value={notes}
          />
          <Pressable onPress={handleCreateSchedule} style={styles.button}>
            <Text style={styles.buttonText}>Salvar agenda</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Agendas locais</Text>
          {schedules.map((schedule) => {
            const property = propertyMap.get(schedule.propertyId);

            return (
              <View key={schedule.id} style={styles.listItem}>
                <Text style={styles.itemTitle}>{property?.name ?? schedule.propertyId}</Text>
                <Text style={styles.itemMeta}>{new Date(schedule.scheduledAt).toLocaleString()}</Text>
                <Text style={styles.itemMeta}>Status: {schedule.status}</Text>
                {schedule.notes ? <Text style={styles.itemMeta}>{schedule.notes}</Text> : null}
              </View>
            );
          })}
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
  label: {
    marginTop: 8,
    color: "#103d24",
    fontWeight: "600"
  },
  input: {
    borderWidth: 1,
    borderColor: "#d7e4d9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fbfdfb"
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: "top"
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
  listItem: {
    borderTopWidth: 1,
    borderTopColor: "#e6eee7",
    paddingTop: 12,
    gap: 4
  },
  itemTitle: {
    fontWeight: "700",
    color: "#103d24"
  },
  itemMeta: {
    color: "#52705e"
  }
});