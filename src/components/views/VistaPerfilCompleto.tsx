import React from 'react';
import { 
  User, ShieldCheck, Car, Clock, Calendar, 
  ChevronRight, ArrowLeft, MessageSquare, 
  Star, ShieldAlert, Award, Map, Wallet
} from 'lucide-react';

export const VistaPerfilCompleto = ({ userData, isOwnProfile = false, onRegresar }) => {
  if (!userData) return <div className="p-10 text-center font-black animate-pulse text-slate-400 italic">CARGANDO...</div>;

  return (
    <div className="bg-slate-50 min-h-full pb-28 animate-in fade-in duration-300">
      
      {/* --------------------------------------------------------------------------------- */}
      {/* NUEVA CABECERA MINIMALISTA (ESTILO MODO PASAJERO / FOTO 6) */}
      {/* --------------------------------------------------------------------------------- */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
         <div className="flex items-center gap-3">
            {/* Si estás en el perfil de otro, este es el botón regresar con el logo "D" */}
            <div className="relative">
               {!isOwnProfile && (
                  <button onClick={onRegresar} className="absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 hover:scale-110 transition-all">
                     <ArrowLeft size={16} />
                  </button>
               )}
               <div className={`w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-lg ${!isOwnProfile ? 'ml-6' : ''}`}>
                  <span className="font-black text-white text-xl italic">D</span>
               </div>
            </div>

            {/* Información del Usuario (Luis Hernández) */}
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">MODO CHOFER</p>
               <h1 className="text-base font-black text-slate-900 tracking-tighter mt-0.5">
                  {userData.nombre || 'CARGANDO...'}
               </h1>
            </div>
         </div>

         {/* Iconos de Navegación del Nuevo Header */}
         <div className="flex items-center gap-3">
            {/* Icono de Mapa (Botón Verde) */}
            <button className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-md active:scale-95 transition-all">
               <Map size={22} />
            </button>
            
            {/* Icono de Saldo (Botón Negro) */}
            <button className="w-24 h-11 bg-slate-950 rounded-full flex items-center gap-2.5 px-3.5 shadow-md active:scale-95 transition-all">
               <Wallet size={16} className="text-blue-500" />
               <p className="text-xs font-black text-white tracking-tighter">${userData.saldo?.toFixed(2) || "0.00"}</p>
            </button>
         </div>
      </div>
      {/* --------------------------------------------------------------------------------- */}

      {/* TARJETA PRINCIPAL DEL PERFIL (BLANCA Y REDONDEADA) */}
      <div className="p-4">
        <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm relative overflow-hidden">
          
          <div className="flex flex-col items-center text-center pb-6">
            <div className="relative mb-4 mt-2">
              {/* Foto de Perfil (o icono por defecto) */}
              <div className="w-28 h-28 bg-slate-100 rounded-full border-4 border-white overflow-hidden shadow-xl flex items-center justify-center">
                 <User size={60} className="text-slate-300 m-auto mt-3" />
              </div>
              {/* Badge de Super Driver: Pequeño y azul en la esquina */}
              <div className="absolute -bottom-1.5 -right-1.5 bg-blue-600 p-2 rounded-full shadow-lg text-white">
                 <Award size={18} fill="currentColor" />
              </div>
            </div>
            
            {/* Nombre Real y Grande */}
            <h1 className="text-2xl font-black text-slate-950 uppercase italic tracking-tight leading-tight mt-2">
               {userData.nombre || 'CARGANDO...'}
            </h1>
            
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
               {userData.edad || '29'} AÑOS
            </p>
          </div>

          <hr className="border-slate-100 mb-6" />

          {/* VALORACIÓN Y OPINIONES */}
          <button className="w-full flex items-center justify-between py- group">
             <div className="flex items-center gap-3">
                <Star size={24} className="text-blue-600" fill="currentColor" />
                <div className="text-left">
                   <p className="text-xl font-black text-slate-900 leading-none">
                      {userData.rating ? userData.rating.toFixed(1) : "5.0"} de 5
                   </p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Basado en sus últimos viajes
                   </p>
                </div>
             </div>
             <ChevronRight size={20} className="text-slate-300 group-active:translate-x-1 transition-transform" />
          </button>

          <hr className="border-slate-100 my-6" />

          {/* LISTA DE CONFIANZA */}
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

      {/* SECCIÓN ACERCA DE */}
      <div className="p-4 pt-6">
        <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm space-y-4">
           <h3 className="text-xl font-black text-slate-950 uppercase italic leading-none">
             Acerca de {userData.nombre?.split(' ')[0] || 'él'}
           </h3>
           <p className="text-slate-600 font-medium leading-relaxed italic border-l-4 border-blue-100 pl-4 leading-relaxed">
              "{userData.bio || 'Sin biografía disponible'}"
           </p>
           
           <div className="grid grid-cols-1 gap-4 pt-2">
              <PreferenciaMini icon={MessageSquare} text="¡Hablo por los codos!" active={true} />
              <PreferenciaMini icon={ShieldAlert} text="No quiere que se fume" active={true} />
           </div>
        </div>
      </div>

      {/* REPORTE */}
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
