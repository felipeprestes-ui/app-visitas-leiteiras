import type { ExpoConfig } from "expo/config";

// Essas variaveis sao definidas no GitHub Actions ou no arquivo .env local
const projectId = process.env.EXPO_PROJECT_ID ?? "ddc3db9a-e48b-4fc5-bbeb-c206d77b7eb4";
const owner = process.env.EXPO_OWNER ?? "prestesfelipe";
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/api";

const config: ExpoConfig = {
  name: "Visitas Leiteiras",
  slug: "app-visitas-leiteiras",
  version: "1.0.0",
  scheme: "visitasleiteiras",
  owner: owner || undefined,
  orientation: "portrait",
  userInterfaceStyle: "light",

  // runtimeVersion com policy "sdkVersion" e compativel com Expo Go
  runtimeVersion: {
    policy: "sdkVersion"
  },

  // URL de updates (EAS Update) - so ativa quando EXPO_PROJECT_ID esta definido
  updates: projectId
    ? {
        url: `https://u.expo.dev/${projectId}`
      }
    : undefined,

  plugins: [
    "expo-router",
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission: "Permissao para capturar o GPS da propriedade."
      }
    ]
  ],

  experiments: {
    typedRoutes: true
  },

  android: {
    package: "com.visitasleiteiras.app",
    adaptiveIcon: {
      backgroundColor: "#1f7a43"
    }
  },

  ios: {
    bundleIdentifier: "com.visitasleiteiras.app"
  },

  extra: {
    apiUrl,
    eas: projectId
      ? {
          projectId
        }
      : undefined
  }
};

export default config;
