import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { TERMINOS_Y_CONDICIONES } from "../constants/terminosLegales";
import { ShieldCheck, XCircle, FileText, AlertCircle } from "lucide-react";

interface ModalTerminosProps {
  uidUsuario: string;
  onAceptado: () => void;
  onRechazado?: () => void;
}

export default function ModalTerminos({ uidUsuario, onAceptado, onRechazado }: ModalTerminosProps) {
  const [guardando, setGuardando] = useState(false);
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false);

  const manejarAceptar = async () => {
    setGuardando(true);
    try {
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
    setMostrarAdvertencia(true);
  };

  return (
    <div className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-100 w-full max-w-lg rounded-[30px] flex flex-col shadow-2xl overflow-hidden max-h-[85vh] relative animate-in zoom-in-95 duration-200">
        
        {/* ENCABEZADO */}
        <div className="bg-white p-5 border-b border-slate-100 flex items-center gap-3 shrink-0">
          <div className="p-2.5 bg-[#063971]/10 text-[#063971] rounded-2xl border border-[#063971]/10">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-[#1F2937] font-black text-sm uppercase italic tracking-tight">
              {TERMINOS_Y_CONDICIONES.titulo}
            </h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
              Versión {TERMINOS_Y_CONDICIONES.version} • {TERMINOS_Y_CONDICIONES.fechaActualizacion}
            </p>
          </div>
        </div>

        {/* CUERPO CON SCROLL */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-slate-600 text-xs leading-relaxed">
          <div className="bg-[#063971]/5 border border-[#063971]/10 p-4 rounded-2xl text-[11px] text-[#063971] font-medium leading-relaxed">
            Por favor lee atentamente las condiciones del servicio antes de continuar. Al aceptar, otorgas una declaración jurada digital sobre la veracidad de tus datos e intenciones.
          </div>

          {TERMINOS_Y_CONDICIONES.clausulas.map((clausula) => (
            <div key={clausula.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5 shadow-sm">
              <h4 className="text-[#1F2937] font-black text-xs uppercase tracking-tight">
                {clausula.titulo}
              </h4>
              <p className="text-slate-500 text-[11px] font-normal leading-normal">
                {clausula.contenido}
              </p>
            </div>
          ))}
        </div>

        {/* ADVERTENCIA ELEGANTE SI INTENTA RECHAZAR */}
        {mostrarAdvertencia && (
          <div className="absolute inset-x-4 bottom-24 bg-white border border-slate-200 p-4 rounded-2xl shadow-2xl z-50 flex items-start gap-3 animate-in slide-in-from-bottom-3 duration-200">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl shrink-0">
              <AlertCircle size={20} />
            </div>
            <div className="flex-1">
              <h5 className="text-[#1F2937] font-black text-xs uppercase tracking-tight">Atención</h5>
              <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                Para poder utilizar los servicios de Dame la Cola es indispensable aceptar los Términos y Condiciones de Uso.
              </p>
              <button 
                onClick={() => setMostrarAdvertencia(false)}
                className="mt-3 bg-[#063971] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* BOTONES DE ACCIÓN */}
        <div className="p-5 bg-white border-t border-slate-100 shrink-0 flex gap-3">
          <button
            onClick={manejarRechazar}
            disabled={guardando}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 border border-slate-200/60"
          >
            <XCircle size={16} />
            Rechazar
          </button>
          
          <button
            onClick={manejarAceptar}
            disabled={guardando}
            className="flex-[2] bg-[#063971] hover:bg-blue-800 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-[#063971]/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <ShieldCheck size={16} />
            {guardando ? "Guardando..." : "Aceptar y Continuar"}
          </button>
        </div>

      </div>
    </div>
  );
}
