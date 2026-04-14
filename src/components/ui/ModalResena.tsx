// src/components/ui/ModalResena.tsx
import React from 'react';
import { Star } from 'lucide-react';

export const ModalResena = ({ 
  modalResena, 
  setModalResena, 
  calificacion, 
  setCalificacion, 
  textoResena, 
  setTextoResena, 
  enviarResena 
}) => {
  if (!modalResena.visible) return null;

  return (
    <div className="absolute inset-0 bg-slate-900/95 z-[300] flex items-center justify-center p-6 backdrop-blur-md animate-in zoom-in duration-300">
      <div className="bg-white rounded-[40px] p-8 w-full shadow-2xl space-y-5 text-center">
         {/* ... Todo el código que me pasaste arriba ... */}
         {/* Asegúrate de usar los nombres de las props que definimos arriba */}
      </div>
    </div>
  );
};