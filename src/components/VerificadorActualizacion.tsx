import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // <-- Ajusta la ruta a tu archivo de configuración de Firebase

export function VerificadorActualizacion() {
  const [necesitaActualizar, setNecesitaActualizar] = useState(false);
  const [urlTienda, setUrlTienda] = useState('');

  useEffect(() => {
    const verificarVersion = async () => {
      try {
        // 1. Obtener la versión interna de la app instalada (el versionCode)
        const info = await App.getInfo();
        const versionActual = Number(info.build);

        // 2. Consultar la versión mínima permitida en Firebase
        const docRef = doc(db, 'configuracion', 'app');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const { version_minima, url_playstore } = docSnap.data();
          
          // 3. Si la versión actual es menor a la requerida, bloqueamos la app
          if (versionActual < version_minima) {
            setUrlTienda(url_playstore);
            setNecesitaActualizar(true);
          }
        }
      } catch (error) {
        console.error("Error verificando actualización:", error);
      }
    };

    verificarVersion();
  }, []);

  // Si no necesita actualizar, no renderizamos nada y la app sigue normal
  if (!necesitaActualizar) return null;

  // Si necesita actualizar, mostramos una pantalla negra que bloquea todo
  return (
    <div className="fixed inset-0 bg-zinc-950 z-[9999] flex flex-col items-center justify-center p-6 text-white">
      <h2 className="text-2xl font-bold mb-4 text-center">Actualización Requerida</h2>
      <p className="text-center mb-8 text-zinc-300">
        Hemos lanzado una nueva versión con mejoras importantes. Debes actualizar para seguir usando Dame la Cola.
      </p>
      <a 
        href={urlTienda}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold w-full text-center transition-colors"
      >
        Ir a la Play Store
      </a>
    </div>
  );
}

