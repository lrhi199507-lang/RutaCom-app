import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Tus datos reales de la consola
const firebaseConfig = {
  apiKey: "AIzaSyCXBs3-Z4-SC2UUAtZhjMgMZ74sD9rqq9Y",
  authDomain: "rutacom-4ea87.firebaseapp.com",
  projectId: "rutacom-4ea87",
  storageBucket: "rutacom-4ea87.firebasestorage.app",
  messagingSenderId: "1080063705561",
  appId: "1:1080063705561:web:13da1c6fe35eb0e40ad9c8",
  measurementId: "G-2TYQF2QBYD"
};

// 1. Inicializamos la App de Firebase
const app = initializeApp(firebaseConfig);

// 2. Configuramos la Autenticación para que RECUERDE al usuario
// Esto usa el almacenamiento del teléfono para que no pida login cada vez
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { auth };

