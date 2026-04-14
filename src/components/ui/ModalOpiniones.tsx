import React from 'react';
import { X, Star } from 'lucide-react';

export const ModalOpiniones = ({ 
  modalOpinionesVisible, 
  setModalOpinionesVisible, 
  perfilPublico, 
  opinionesPerfil 
}) => {
  if (!modalOpinionesVisible) return null;

  return (
    <div className="absolute inset-0 bg-slate-900/95 z-[200] flex flex-col p-6 backdrop-blur-md animate-in slide-in-from-bottom duration-300">
       {/* Aquí va todo el contenido que me pasaste arriba */}
       {/* ... */}
    </div>
  );
};