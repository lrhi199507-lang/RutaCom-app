import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig'; // Ajusta si la ruta a firebaseConfig es diferente
import { doc, getDoc } from 'firebase/firestore';
import { App as CapacitorApp } from '@capacitor/app';
import { Download } from 'lucide-react';

// Le agregamos el tipado para TypeScript ({ children: React.ReactNode })
export const ForzarActualizacion = ({ children }: { children: React.ReactNode }) => {
  const [requiereActualizar, setRequireActualizar] = useState(false);
  const [urlStore, setUrlStore] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const verificarVersion = async () => {
      try {
        const docRef = doc(db, "Configuracion", "app");
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();
          const versionMinima = Number(data.version_minima || 0);
          setUrlStore(data.url_playstore || "");

          // Obtenemos la versión instalada (el versionCode/build real)
          const info = await CapacitorApp.getInfo();
          const versionInstalada = Number(info.build || 0); 
          
          console.log(`Versión Mínima: ${versionMinima} | Instalada: ${versionInstalada}`);

          if (versionInstalada < versionMinima) {
            setRequireActualizar(true);
          }
        }
      } catch (error) {
        console.error("Error verificando actualización:", error);
      } finally {
        setCargando(false);
      }
    };

    verificarVersion();
  }, []);

  if (cargando) return null; 

  if (requiereActualizar) {
    return (
      <div className="fixed inset-0 z-[999999] bg-[#0b1120] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="absolute top-0 left-0 right-0 h-64 bg-blue-600/10 blur-3xl rounded-full -translate-y-1/2 pointer-events-none" />
        
        <div className="relative z-10 bg-blue-500/20 p-6 rounded-full mb-8 border-4 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.4)]">
          <Download size={60} className="text-blue-500 animate-bounce" />
        </div>
        
        <h1 className="relative z-10 text-2xl font-black italic uppercase text-white mb-3 tracking-widest">
          Actualización Obligatoria
        </h1>
        
        <p className="relative z-10 text-slate-400 font-bold text-sm mb-12 max-w-xs leading-relaxed">
          Hemos lanzado una nueva versión de <span className="text-white font-black">Dame la Cola</span> con mejoras importantes. Debes actualizar para continuar viajando.
        </p>
        
        <button 
          onClick={() => window.open(urlStore, '_system')}
          className="relative z-10 w-full max-w-xs bg-blue-600 text-white p-5 rounded-full font-black uppercase text-sm tracking-[3px] shadow-lg shadow-blue-600/40 active:scale-95 transition-all"
        >
          Ir a Play Store
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
