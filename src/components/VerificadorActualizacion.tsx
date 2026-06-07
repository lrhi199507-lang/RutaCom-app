import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { doc, getDoc } from 'firebase/firestore';
import { db } from "../firebaseConfig";

export function VerificadorActualizacion() {
  const [necesitaActualizar, setNecesitaActualizar] = useState(false);
  const [urlTienda, setUrlTienda] = useState('');
  const [debug, setDebug] = useState<string>('Iniciando...'); // Para ver qué pasa en pantalla

  useEffect(() => {
    const verificarVersion = async () => {
      try {
        const info = await App.getInfo();
        // Convertimos a número de forma segura
        const versionActual = parseInt(info.build || "0", 10);
        
        setDebug(`V. Actual: ${versionActual}`);

        const docRef = doc(db, 'Configuracion', 'app');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const versionMinima = Number(data.version_minima);
          
          setDebug(`Actual: ${versionActual} | Min: ${versionMinima}`);

          if (versionActual < versionMinima) {
            setUrlTienda(data.url_playstore);
            setNecesitaActualizar(true);
          }
        } else {
          setDebug("Error: El documento 'app' no existe en Firebase");
        }
      } catch (error: any) {
        setDebug("Error: " + error.message);
      }
    };

    verificarVersion();
  }, []);

  // Si necesita actualizar, mostramos el bloqueo
  if (necesitaActualizar) {
    return (
      <div className="fixed inset-0 bg-zinc-950 z-[9999] flex flex-col items-center justify-center p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Actualización Requerida</h2>
        <a href={urlTienda} className="bg-blue-600 p-4 rounded-xl w-full text-center">Ir a Play Store</a>
      </div>
    );
  }

  // Si NO necesita actualizar, mostramos esto pequeño para saber que el código corrió
  // Borra este return de debug cuando funcione
  return (
    <div className="fixed top-0 left-0 bg-black/50 text-[8px] text-white z-[9999] p-1">
      {debug}
    </div>
  );
}
