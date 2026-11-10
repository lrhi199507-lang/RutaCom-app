import React, { useState } from "react";
import { db } from "../firebaseConfig"; // Ajusta la ruta a tu config de Firebase
import { doc, updateDoc } from "firebase/firestore";
import { TERMINOS_Y_CONDICIONES } from "../terminosLegales";
import { ShieldCheck, XCircle, FileText } from "lucide-react";

interface ModalTerminosProps {
  uidUsuario: string;
  onAceptado: () => void;
  onRechazado?: () => void;
}

export default function ModalTerminos({ uidUsuario, onAceptado, onRechazado }: ModalTerminosProps) {
  const [guardando, setGuardando] = useState(false);

  const manejarAceptar = async () => {
    setGuardando(true);
    try {
      // Guardamos la evidencia legal digital en el documento del usuario
      await updateDoc(doc(db, "usuarios", uidUsuario), {
        terminosAceptados: true,
        fechaAceptacionTerminos: new Date().toISOString(),
        versionTerminos: TERMINOS_Y_CONDICIONES.version,
      });

      setGuardando(false);
      onAceptado();
    } catch (error) {
      console.error("Error al registrar la aceptación de términos:", error);
      alert("Hubo un problema de conexión al guardar tu aceptación. Inténtalo de nuevo.");
      setGuardando(false);
    }
  };

  const manejarRechazar = () => {
    alert("Para poder utilizar los servicios de Dame la Cola es indispensable aceptar los Términos y Condiciones de Uso.");
    if (onRechazado) onRechazado();
  };

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[30px] flex flex-col shadow-2xl overflow-hidden max-h-[85vh]">
        
        {/* ENCABEZADO */}
        <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center gap-3 shrink-0">
          <div className="p-2.5 bg-blue-600/20 text-blue-500 rounded-xl border border-blue-500/30">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-white font-black text-sm uppercase italic tracking-tight">
              {TERMINOS_Y_CONDICIONES.titulo}
            </h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
              Versión {TERMINOS_Y_CONDICIONES.version} • {TERMINOS_Y_CONDICIONES.fechaActualizacion}
            </p>
          </div>
        </div>

        {/* CUERPO CON SCROLL PARA LECTURA */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-slate-300 text-xs leading-relaxed">
          <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-2xl text-[11px] text-blue-300 font-medium">
            Por favor lee atentamente las condiciones del servicio antes de continuar. Al aceptar, otorgas una declaración jurada digital sobre la veracidad de tus datos e intenciones.
          </div>

          {TERMINOS_Y_CONDICIONES.clausulas.map((clausula) => (
            <div key={clausula.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-1.5">
              <h4 className="text-white font-black text-xs uppercase tracking-tight">
                {clausula.titulo}
              </h4>
              <p className="text-slate-400 text-[11px] font-normal leading-normal">
                {clausula.contenido}
              </p>
            </div>
          ))}
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 shrink-0 flex gap-3">
          <button
            onClick={manejarRechazar}
            disabled={guardando}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors border border-slate-800 flex items-center justify-center gap-1.5"
          >
            <XCircle size={16} />
            Rechazar
          </button>
          
          <button
            onClick={manejarAceptar}
            disabled={guardando}
            className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <ShieldCheck size={16} />
            {guardando ? "Guardando..." : "Aceptar y Continuar"}
          </button>
        </div>

      </div>
    </div>
  );
}
