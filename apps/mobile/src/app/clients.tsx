import { useState } from "react";
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
import { clientTypes, consultantAreas, consultantsByArea } from "@app/catalogs";
import type { ConsultantArea } from "@app/types";
import { useAppContext } from "../providers/app-provider";

export default function ClientsScreen() {
  const { clients, properties, createClientAndProperty, session, captureLocation } = useAppContext();
  const [clientName, setClientName] = useState("");
  const [clientType, setClientType] = useState(clientTypes[0]);
  const [propertyName, setPropertyName] = useState("");
  const [consultantArea, setConsultantArea] = useState<ConsultantArea>(
    session?.consultantArea ?? consultantAreas[0]
  );
  const [consultantName, setConsultantName] = useState(consultantsByArea[consultantArea][0]);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  async function handleCaptureLocation() {
    const result = await captureLocation();

    if (!result) {
      Alert.alert("Não foi possível capturar o GPS neste dispositivo.");
      return;
    }

    setLatitude(String(result.latitude));
    setLongitude(String(result.longitude));
  }

  async function handleSave() {
    if (!clientName || !propertyName || !latitude || !longitude) {
      Alert.alert("Preencha cliente, propriedade e GPS.");
      return;
    }

    await createClientAndProperty({
      clientName,
      clientType,
      propertyName,
      consultantArea,
      consultantName,
      latitude: Number(latitude),
      longitude: Number(longitude),
      city,
      state
    });

    setClientName("");
    setPropertyName("");
    setCity("");
    setState("");
    Alert.alert("Cliente e propriedade salvos offline.");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Novo cliente e propriedade</Text>
          <Text style={styles.label}>Cliente</Text>
          <TextInput onChangeText={setClientName} style={styles.input} value={clientName} />
          <Text style={styles.label}>Tipo de cliente</Text>
          <TextInput onChangeText={(value) => setClientType(value as typeof clientType)} style={styles.input} value={clientType} />
          <Text style={styles.helper}>Opções: {clientTypes.join(", ")}</Text>
          <Text style={styles.label}>Propriedade</Text>
          <TextInput onChangeText={setPropertyName} style={styles.input} value={propertyName} />
          <Text style={styles.label}>Área do consultor</Text>
          <TextInput
            onChangeText={(value) => {
              const area = (value as ConsultantArea) || consultantAreas[0];
              setConsultantArea(area);
              setConsultantName(consultantsByArea[area]?.[0] ?? "");
            }}
            style={styles.input}
            value={consultantArea}
          />
          <Text style={styles.helper}>Opções: {consultantAreas.join(", ")}</Text>
          <Text style={styles.label}>Consultor</Text>
          <TextInput onChangeText={setConsultantName} style={styles.input} value={consultantName} />
          <Text style={styles.label}>Latitude</Text>
          <TextInput keyboardType="decimal-pad" onChangeText={setLatitude} style={styles.input} value={latitude} />
          <Text style={styles.label}>Longitude</Text>
          <TextInput keyboardType="decimal-pad" onChangeText={setLongitude} style={styles.input} value={longitude} />
          <Pressable onPress={handleCaptureLocation} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Capturar GPS atual</Text>
          </Pressable>
          <Text style={styles.label}>Cidade</Text>
          <TextInput onChangeText={setCity} style={styles.input} value={city} />
          <Text style={styles.label}>Estado</Text>
          <TextInput onChangeText={setState} style={styles.input} value={state} />
          <Pressable onPress={handleSave} style={styles.button}>
            <Text style={styles.buttonText}>Salvar offline</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Clientes locais</Text>
          {clients.map((client) => (
            <View key={client.id} style={styles.listItem}>
              <Text style={styles.itemTitle}>{client.name}</Text>
              <Text style={styles.itemMeta}>Tipo: {client.clientType}</Text>
              {properties
                .filter((property) => property.clientId === client.id)
                .map((property) => (
                  <Text key={property.id} style={styles.itemMeta}>
                    {property.name} • Área {property.consultantArea}
                  </Text>
                ))}
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
  label: {
    marginTop: 8,
    color: "#103d24",
    fontWeight: "600"
  },
  helper: {
    color: "#52705e",
    fontSize: 12
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
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#1f7a43",
    paddingVertical: 14,
    alignItems: "center"
  },
  secondaryButton: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f7a43",
    paddingVertical: 12,
    alignItems: "center"
  },
  secondaryButtonText: {
    color: "#1f7a43",
    fontWeight: "700"
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