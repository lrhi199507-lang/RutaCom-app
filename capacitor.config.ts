import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.damelacola.app', // <-- Pon este texto exacto en la casilla de Google Play
  appName: 'Dame la cola',     // <-- Nombre oficial
  webDir: 'dist', 
  server: {
    androidScheme: 'https'
  }
};

export default config;
