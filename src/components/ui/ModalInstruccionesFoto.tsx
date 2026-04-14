import React, { useRef } from 'react';
import { Camera, CigaretteOff, User, Users } from "lucide-react";

export const ModalInstruccionesFoto = ({ isOpen, onClose, onFotoSeleccionada }) => {
  // Referencia para el input de archivo oculto
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleButtonClick = () => {
    // Simulamos el click en el input invisible
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Pasamos el archivo real a la función padre
      onFotoSeleccionada(file);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
      {/* Input de archivo oculto */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        capture="user" // Esto sugiere abrir la cámara frontal en móviles
        className="hidden" 
      />

      <div className="bg-white w-full max-w-sm rounded-[40px] p-8 space-y-6 shadow-2xl animate-in zoom-in duration-300">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-4">
            <Camera size={40} />
          </div>
          <h3 className="text-2xl font-black italic uppercase text-slate-800 leading-tight">Foto de Perfil</h3>
          <p className="text-slate-500 text-sm font-medium">Para tu seguridad y la de los demás, sigue estas reglas:</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="bg-red-100 text-red-600 p-2 rounded-lg"><CigaretteOff size={20} /></div>
            <p className="text-[11px] font-black uppercase italic text-slate-700">Sin lentes de sol ni gorras</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><User size={20} /></div>
            <p className="text-[11px] font-black uppercase italic text-slate-700">De frente y donde se vea tu cara</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
             <div className="bg-green-100 text-green-600 p-2 rounded-lg"><Users size={20} /></div>
            <p className="text-[11px] font-black uppercase italic text-slate-700">Tú solo, sin acompañantes</p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
          <p className="text-[10px] text-blue-800 font-bold text-center leading-relaxed">
            "Tómate una foto clara: sin gorra, sin lentes de sol y de frente. ¡Queremos saber quién eres!"
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleButtonClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
          >
             Entendido, subir foto
          </button>
          <button 
            onClick={onClose}
            className="w-full text-slate-400 font-black uppercase italic py-2 text-[10px]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};