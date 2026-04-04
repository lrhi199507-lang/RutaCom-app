import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
// Importamos Firebase
import { auth } from './firebaseConfig'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from 'firebase/auth';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [esRegistro, setEsRegistro] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);

  // ESTA FUNCIÓN REVISA SI YA ESTÁS LOGUEADO
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
    });
    return unsubscribe;
  }, []);

  const manejarAutenticacion = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor rellena todos los campos");
      return;
    }
    
    setCargando(true);
    try {
      if (esRegistro) {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert("¡Éxito!", "Cuenta creada correctamente");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      let mensaje = "Ocurrió un error";
      if (error.code === 'auth/weak-password') mensaje = "La clave es muy corta";
      if (error.code === 'auth/email-already-in-use') mensaje = "El correo ya está registrado";
      if (error.code === 'auth/invalid-credential') mensaje = "Correo o clave incorrectos";
      Alert.alert("Aviso", mensaje);
    }
    setCargando(false);
  };

  // SI EL USUARIO YA ESTÁ LOGUEADO, MOSTRAR EL HOME
  if (usuario) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Bienvenido, {usuario.email}</Text>
        <TouchableOpacity 
          onPress={() => auth.signOut()}
          className="mt-4 bg-red-500 p-4 rounded-xl"
        >
          <Text className="text-white">CERRAR SESIÓN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // PANTALLA DE INICIO (LOGIN / REGISTRO)
  return (
    <View className="flex-1 bg-[#0f172a] items-center justify-center px-8">
      {/* LOGO */}
      <View className="bg-blue-600 w-24 h-24 rounded-3xl items-center justify-center mb-6">
        <Text className="text-white text-5xl font-bold italic">R</Text>
      </View>
      
      <Text className="text-white text-4xl font-bold italic mb-2">RutaCom</Text>
      <Text className="text-gray-400 tracking-[4px] text-xs mb-10">CONECTANDO DESTINOS</Text>

      {/* FORMULARIO NUEVO */}
      <View className="w-full gap-y-4 mb-6">
        <TextInput 
          placeholder="Correo electrónico"
          placeholderTextColor="#9ca3af"
          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput 
          placeholder="Contraseña"
          placeholderTextColor="#9ca3af"
          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {/* BOTÓN PRINCIPAL */}
      <TouchableOpacity 
        onPress={manejarAutenticacion}
        disabled={cargando}
        className="w-full bg-blue-600 p-5 rounded-2xl items-center"
      >
        {cargando ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold tracking-widest">
            {esRegistro ? "CREAR CUENTA" : "ENTRAR A LA APP"}
          </Text>
        )}
      </TouchableOpacity>

      {/* CAMBIAR ENTRE LOGIN Y REGISTRO */}
      <TouchableOpacity 
        onPress={() => setEsRegistro(!esRegistro)}
        className="mt-6"
      >
        <Text className="text-gray-400 text-sm">
          {esRegistro ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
