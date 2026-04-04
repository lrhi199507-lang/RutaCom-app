import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rutacom.app',
  appName: 'RutaCom',
  webDir: 'dist', // CRÍTICO: Debe ser 'dist'
  server: {
    androidScheme: 'https'
  }
};

export default config;
