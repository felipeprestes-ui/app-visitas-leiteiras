import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AppProvider } from "../providers/app-provider";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTitleAlign: "center"
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: "Entrar"
          }}
        />
        <Stack.Screen
          name="home"
          options={{
            title: "Home"
          }}
        />
        <Stack.Screen
          name="agenda"
          options={{
            title: "Agenda"
          }}
        />
        <Stack.Screen
          name="clients"
          options={{
            title: "Clientes"
          }}
        />
        <Stack.Screen
          name="visit"
          options={{
            title: "Nova Visita"
          }}
        />
        <Stack.Screen
          name="sync"
          options={{
            title: "Sincronização"
          }}
        />
      </Stack>
    </AppProvider>
  );
}