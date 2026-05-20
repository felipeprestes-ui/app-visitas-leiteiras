import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'CRV Lagoa Visitas',
  slug: 'app-visitas-leiteiras',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  assetBundlePatterns: ['**/*'],
  icon: './assets/icon.png',
  splash: {
    image: './assets/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#1a3c7a',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.prestesfelipe.appvisitasleiteiras',
  },
  android: {
    package: 'com.prestesfelipe.appvisitasleiteiras',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1a3c7a',
    },
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
    ],
  },
  extra: {
    eas: {
      projectId: 'ddc3db9a-e48b-4fc5-bbeb-c206d77b7eb4',
    },
  },
  owner: 'prestesfelipe',
});
