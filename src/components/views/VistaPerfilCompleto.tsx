import React, { useState } from 'react';
import { 
  User, ShieldCheck, Car, Camera, Award, 
  ChevronRight, ArrowLeft, MessageSquare, 
  Star, Clock, Calendar, ShieldAlert, Check
} from 'lucide-react';

export const VistaPerfilCompleto = ({ userData, isOwnProfile = false, onRegresar }) => {
  if (!userData) return <div className="p-10 text-center font-black animate-pulse text-slate-400 italic">CARGANDO...</div>;

  return (
    <div className="bg-white min-h-full pb-28 animate-in fade-in duration-300">
      
      {/* CABECERA ESTILO "SUPER DRIVER" */}
      <div className="bg-blue-600 p-6 pt-10 text-white relative">
        {!isOwnProfile && (
           <button onClick={onRegresar} className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20">
              <ArrowLeft size={20} />
           </button>
        )}
        
        <div className="flex flex-col items-center mt-4">
           <div className="relative">
              <div className="w-24 h-24 bg-slate-200 rounded-full border-4 border-white overflow-hidden shadow-lg">
                 <User size={50} className="text-slate-400 m-auto mt-4" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-md text-blue-600">
                 <Award size={20} fill="currentColor" />
              </div>
           </div>
           
           <h1 className="text-2xl font-black mt-4 tracking-tight uppercase italic">
              {userData.nombre?.split(' ')[0] || 'Usuario'}
           </h1>
           <p className="text-sm font-bold opacity-90 uppercase tracking-widest">
              {userData.edad || '30'} AÑOS
           </p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        
        {/* VALORACIÓN Y OPINIONES */}
        <button className="w-full flex items-center justify-between py-2 group">
           <div className="flex items-center gap-3">
              <Star size={24} className="text-blue-600" fill="currentColor" />
              <div className="text-left">
                 <p className="text-lg font-black text-slate-900 leading-none">
                    {userData.rating?.toFixed(1) || "5.0"}/5
                 </p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Basado en sus últimos viajes
                 </p>
              </div>
           </div>
           <ChevronRight size={20} className="text-slate-300 group-active:translate-x-1 transition-transform" />
        </button>

        <hr className="border-slate-100" />

        {/* PUNTOS DE CONFIANZA ESTILO BLABLACAR */}
        <div className="space-y-5">
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

        <hr className="border-slate-100" />

        {/* SECCIÓN ACERCA DE */}
        <div className="space-y-4">
           <h3 className="text-xl font-black text-slate-900 uppercase italic">Acerca de {userData.nombre?.split(' ')[0]}</h3>
           <p className="text-slate-600 font-medium leading-relaxed italic border-l-4 border-blue-100 pl-4">
              "{userData.bio || 'Sin biografía disponible'}"
           </p>
           
           {/* PREFERENCIAS DE VIAJE */}
           <div className="grid grid-cols-1 gap-3 pt-2">
              <PreferenciaMini icon={MessageSquare} text="¡Hablo por los codos!" active={true} />
              <PreferenciaMini icon={ShieldAlert} text="No quiere que se fume" active={true} />
           </div>
        </div>

        {/* ESTADÍSTICAS FINALES */}
        <div className="bg-slate-50 p-6 rounded-[30px] border border-slate-100">
           <div className="flex justify-between items-center text-center">
              <div>
                 <p className="text-lg font-black text-slate-900 leading-none">{userData.viajesRealizados || 124}</p>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">Viajes Completados</p>
              </div>
              <div className="h-10 w-[1px] bg-slate-200"></div>
              <div>
                 <p className="text-lg font-black text-slate-900 leading-none">0%</p>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">Índice Cancelación</p>
              </div>
           </div>
        </div>

        {!isOwnProfile && (
           <button className="w-full text-red-500 font-black text-[10px] uppercase tracking-[0.2em] py-4">
              Alertar sobre este usuario
           </button>
        )}
      </div>
    </div>
  );
};

// COMPONENTES AUXILIARES
const ConfianzaItem = ({ icon: Icon, text, verified }) => (
  <div className="flex items-center gap-4">
    <div className={`w-6 h-6 flex items-center justify-center ${verified ? 'text-blue-600' : 'text-slate-300'}`}>
       <Icon size={20} />
    </div>
    <span className={`text-[13px] font-bold ${verified ? 'text-slate-700' : 'text-slate-400'}`}>
       {text}
    </span>
  </div>
);

const PreferenciaMini = ({ icon: Icon, text, active }) => (
  <div className="flex items-center gap-3 text-slate-500">
     <Icon size={18} className="opacity-70" />
     <span className="text-sm font-semibold">{text}</span>
  </div>
);
