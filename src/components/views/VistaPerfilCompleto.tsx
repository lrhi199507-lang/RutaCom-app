import React, { useState } from 'react';
import { 
  User, ShieldCheck, Car, Clock, Calendar, 
  ChevronRight, ArrowLeft, MessageSquare, 
  Star, ShieldAlert, Award
} from 'lucide-react';

export const VistaPerfilCompleto = ({ userData, isOwnProfile = false, onRegresar }) => {
  if (!userData) return <div className="p-10 text-center font-black animate-pulse text-slate-400 italic">CARGANDO...</div>;

  return (
    <div className="bg-slate-50 min-h-full pb-28 animate-in fade-in duration-300">
      
      {/* BOTÓN REGRESAR MINIMALISTA */}
      {!isOwnProfile && (
        <div className="p-4 pt-6">
           <button onClick={onRegresar} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-blue-600 active:scale-95 transition-all">
              <ArrowLeft size={18} />
           </button>
        </div>
      )}
{/* TARJETA PRINCIPAL DEL PERFIL */}
<div className="px-4">
  <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm relative overflow-hidden">
    
    <div className="flex flex-col items-center text-center pb-6">
      <div className="relative mb-4">
        <div className="w-28 h-28 bg-slate-100 rounded-full border-4 border-white overflow-hidden shadow-xl flex items-center justify-center">
           <User size={60} className="text-slate-300 m-auto mt-3" />
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 bg-blue-600 p-2 rounded-full shadow-lg text-white">
           <Award size={18} fill="currentColor" />
        </div>
      </div>
      
      {/* CAMBIO AQUÍ: Concatenamos "PROPIETARIO" con el nombre real de Firebase */}
      <h1 className="text-2xl font-black text-slate-950 uppercase italic tracking-tight leading-tight">
         PROPIETARIO {userData.nombre?.split(' ')[0] || 'USUARIO'}
      </h1>
      
      <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
         {userData.edad || '30'} AÑOS
      </p>
    </div>

    {/* ... resto del código (Opiniones, Puntos de confianza) */}
  </div>
</div>
      
    
          <hr className="border-slate-100 mb-6" />

          {/* VALORACIÓN Y OPINIONES */}
          <button className="w-full flex items-center justify-between py-2 group">
             <div className="flex items-center gap-3">
                <Star size={24} className="text-blue-600" fill="currentColor" />
                <div className="text-left">
                   <p className="text-xl font-black text-slate-900 leading-none">
                      {userData.rating?.toFixed(1) || "5.0"}/5
                   </p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Basado en sus últimos viajes
                   </p>
                </div>
             </div>
             <ChevronRight size={20} className="text-slate-300 group-active:translate-x-1 transition-transform" />
          </button>

          <hr className="border-slate-100 my-6" />

          {/* PUNTOS DE CONFIANZA ESTILO BLABLACAR (LISTA) */}
          <div className="space-y-6 pb-2">
             <ConfianzaItem 
                icon={ShieldCheck} 
                text="Perfil verificado con Cédula" 
                verified={userData.kycVerificado} 
             />
             <ConfianzaItem 
                icon={Car} 
                text="Publica viajes regularmente" 
                verified={true} 
             />
             <ConfianzaItem 
                icon={Clock} 
                text="Tiempo de respuesta rápido" 
                verified={true} 
             />
             <ConfianzaItem 
                icon={Calendar} 
                text={`Usuario desde ${userData.fechaCreacion || 'Abril 2026'}`} 
                verified={true} 
             />
          </div>
        </div>
      </div>

      {/* SECCIÓN ACERCA DE (OTRA TARJETA) */}
      <div className="p-4 pt-6">
        <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm space-y-4">
           <h3 className="text-xl font-black text-slate-950 uppercase italic leading-none">Acerca de {userData.nombre?.split(' ')[0]}</h3>
           <p className="text-slate-600 font-medium leading-relaxed italic border-l-4 border-blue-100 pl-4">
              "{userData.bio || 'Sin biografía disponible'}"
           </p>
           
           {/* PREFERENCIAS DE VIAJE */}
           <div className="grid grid-cols-1 gap-4 pt-2">
              <PreferenciaMini icon={MessageSquare} text="¡Hablo por los codos!" active={true} />
              <PreferenciaMini icon={ShieldAlert} text="No quiere que se fume" active={true} />
           </div>
        </div>
      </div>

      {/* BOTÓN REPORTE MINIMALISTA */}
      {!isOwnProfile && (
        <div className="px-4 pt-2">
           <button className="w-full text-red-500 font-black text-[10px] uppercase tracking-[0.2em] py-4 bg-white rounded-xl border border-red-100/50 hover:bg-red-50 transition-colors">
              Alertar sobre este usuario
           </button>
        </div>
      )}
    </div>
  );
};

// COMPONENTES AUXILIARES
const ConfianzaItem = ({ icon: Icon, text, verified }) => (
  <div className="flex items-center gap-4">
    <div className={`w-6 h-6 flex items-center justify-center ${verified ? 'text-blue-600' : 'text-slate-300'}`}>
       <Icon size={20} />
    </div>
    <span className={`text-[13px] font-semibold ${verified ? 'text-slate-700' : 'text-slate-400'}`}>
       {text}
    </span>
  </div>
);

const PreferenciaMini = ({ icon: Icon, text, active }) => (
  <div className="flex items-center gap-3 text-slate-600">
     <Icon size={18} className="opacity-60" />
     <span className="text-sm font-semibold">{text}</span>
  </div>
);
