import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { clientTypes, serviceTypes } from "@app/catalogs";
import { validateVisitForm, visitServiceTypesRequiringAnimalCount } from "../features/visits/visit-form-schema";
import type { VisitFormValues } from "../features/visits/types";
import { useAppContext } from "../providers/app-provider";

export default function VisitScreen() {
  const { properties, createVisit } = useAppContext();
  const [form, setForm] = useState<VisitFormValues>({
    propertyId: properties[0]?.id ?? "",
    herdSize: 0,
    clientType: clientTypes[0],
    serviceType: serviceTypes[0],
    animalCount: undefined,
    milkAverageLitersPerDay: 0,
    lactatingAnimals: 0,
    dealClosed: false,
    notes: ""
  });

  const [errors, setErrors] = useState<string[]>([]);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === form.propertyId),
    [form.propertyId, properties]
  );

  const requiresAnimalCount = visitServiceTypesRequiringAnimalCount.includes(form.serviceType);

  async function handleSaveVisit() {
    const result = validateVisitForm(form);

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    await createVisit(result.data);
    setErrors([]);
    Alert.alert("Visita salva offline.");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Formulário de visita</Text>
          <Text style={styles.label}>Propriedade</Text>
          <TextInput
            onChangeText={(value) => setForm((current) => ({ ...current, propertyId: value }))}
            style={styles.input}
            value={form.propertyId}
          />
          {selectedProperty ? (
            <Text style={styles.helper}>
              {selectedProperty.name} • {selectedProperty.consultantName}
            </Text>
          ) : null}
          <Text style={styles.label}>Nº rebanho</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={(value) => setForm((current) => ({ ...current, herdSize: Number(value || 0) }))}
            style={styles.input}
            value={String(form.herdSize)}
          />
          <Text style={styles.label}>Tipo de cliente</Text>
          <TextInput
            onChangeText={(value) => setForm((current) => ({ ...current, clientType: value as VisitFormValues["clientType"] }))}
            style={styles.input}
            value={form.clientType}
          />
          <Text style={styles.helper}>Opções: {clientTypes.join(", ")}</Text>
          <Text style={styles.label}>Serviço realizado</Text>
          <TextInput
            onChangeText={(value) =>
              setForm((current) => ({
                ...current,
                serviceType: value as VisitFormValues["serviceType"],
                animalCount: visitServiceTypesRequiringAnimalCount.includes(value as VisitFormValues["serviceType"])
                  ? current.animalCount
                  : undefined
              }))
            }
            style={styles.input}
            value={form.serviceType}
          />
          <Text style={styles.helper}>Opções: {serviceTypes.join(", ")}</Text>
          {requiresAnimalCount ? (
            <>
              <Text style={styles.label}>Nº animais</Text>
              <TextInput
                keyboardType="number-pad"
                onChangeText={(value) =>
                  setForm((current) => ({
                    ...current,
                    animalCount: Number(value || 0)
                  }))
                }
                style={styles.input}
                value={String(form.animalCount ?? 0)}
              />
            </>
          ) : null}
          <Text style={styles.label}>Produção média de leite L/dia</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={(value) =>
              setForm((current) => ({
                ...current,
                milkAverageLitersPerDay: Number(value || 0)
              }))
            }
            style={styles.input}
            value={String(form.milkAverageLitersPerDay)}
          />
          <Text style={styles.label}>Animais em lactação</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={(value) =>
              setForm((current) => ({
                ...current,
                lactatingAnimals: Number(value || 0)
              }))
            }
            style={styles.input}
            value={String(form.lactatingAnimals)}
          />
          <View style={styles.switchRow}>
            <Text style={styles.label}>Negócio fechado</Text>
            <Switch
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  dealClosed: value
                }))
              }
              value={form.dealClosed}
            />
          </View>
          <Text style={styles.label}>Observações</Text>
          <TextInput
            multiline
            numberOfLines={4}
            onChangeText={(value) => setForm((current) => ({ ...current, notes: value }))}
            style={[styles.input, styles.multiline]}
            value={form.notes ?? ""}
          />
          {errors.length > 0 ? (
            <View style={styles.errorBox}>
              {errors.map((error) => (
                <Text key={error} style={styles.errorText}>
                  • {error}
                </Text>
              ))}
            </View>
          ) : null}
          <Pressable onPress={handleSaveVisit} style={styles.button}>
            <Text style={styles.buttonText}>Salvar visita offline</Text>
          </Pressable>
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
    padding: 20
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
  multiline: {
    minHeight: 100,
    textAlignVertical: "top"
  },
  switchRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
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
  errorBox: {
    borderRadius: 12,
    backgroundColor: "#fdecea",
    padding: 12,
    gap: 4
  },
  errorText: {
    color: "#b3261e"
  }
});