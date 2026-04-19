import React from 'react';
import { 
  User, ShieldCheck, Car, Clock, Calendar, 
  ChevronRight, ArrowLeft, MessageSquare, 
  Star, ShieldAlert, Award, Map, Wallet
} from 'lucide-react';

export const VistaPerfilCompleto = ({ userData, isOwnProfile = false, onRegresar }) => {
  if (!userData) return <div className="p-10 text-center font-black animate-pulse text-slate-400 italic">CARGANDO...</div>;

  return (
    <div className="bg-white min-h-full pb-28 animate-in fade-in duration-300">
      
      {/* CABECERA ESTILO MINIMALISTA (FONDO BLANCO) */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-50">
         <div className="flex items-center gap-3">
            {/* Botón Regresar + Logo D */}
            <div className="flex items-center gap-2">
               {!isOwnProfile && (
                  <button onClick={onRegresar} className="text-slate-400 pr-1">
                     <ArrowLeft size={20} />
                  </button>
               )}
               <div className="w-14 h-14 rounded-[20px] bg-blue-600 flex items-center justify-center shadow-sm">
                  <span className="font-black text-white text-2xl italic">D</span>
               </div>
            </div>

            {/* Texto Dinámico */}
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  MODO CHOFER
               </p>
               <h1 className="text-lg font-black text-slate-900 tracking-tighter mt-1">
                  {userData.nombre || 'Cargando...'}
               </h1>
            </div>
         </div>

         {/* Botones de Acción (Mapa y Wallet) */}
         <div className="flex items-center gap-2">
            <button className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-sm active:scale-95 transition-all">
               <Map size={22} />
            </button>
            
            <button className="h-12 bg-slate-950 rounded-full flex items-center gap-2.5 px-4 shadow-sm active:scale-95 transition-all">
               <Wallet size={16} className="text-blue-500" />
               <p className="text-sm font-black text-white tracking-tighter">
                  ${userData.saldo?.toFixed(2) || "0.00"}
               </p>
            </button>
         </div>
      </div>

      {/* CUERPO DEL PERFIL */}
      <div className="p-4">
        <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm relative overflow-hidden">
          
          <div className="flex flex-col items-center text-center pb-6">
            <div className="relative mb-4">
              <div className="w-28 h-28 bg-slate-50 rounded-full border-4 border-white overflow-hidden shadow-xl flex items-center justify-center">
                 <User size={60} className="text-slate-300 m-auto mt-3" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-blue-600 p-2 rounded-full shadow-lg text-white">
                 <Award size={18} fill="currentColor" />
              </div>
            </div>
            
            <h1 className="text-2xl font-black text-slate-950 uppercase italic tracking-tight">
               {userData.nombre || 'USUARIO'}
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
               {userData.edad || '29'} AÑOS
            </p>
          </div>

          <hr className="border-slate-50 mb-6" />

          {/* Valoración */}
          <button className="w-full flex items-center justify-between py-2">
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
             <ChevronRight size={20} className="text-slate-300" />
          </button>

          <hr className="border-slate-50 my-6" />

          {/* Confianza */}
          <div className="space-y-6 pb-2">
             <ConfianzaItem icon={ShieldCheck} text="Perfil verificado con Cédula" verified={userData.kycVerificado} />
             <ConfianzaItem icon={Car} text="Publica viajes regularmente" verified={true} />
             <ConfianzaItem icon={Clock} text="Tiempo de respuesta rápido" verified={true} />
             <ConfianzaItem icon={Calendar} text={`Usuario desde ${userData.fechaCreacion || 'Abril 2026'}`} verified={true} />
          </div>
        </div>
      </div>

      {/* Acerca de */}
      <div className="px-4 pb-10">
        <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm space-y-4">
           <h3 className="text-xl font-black text-slate-950 uppercase italic leading-none">
             Acerca de {userData.nombre?.split(' ')[0] || 'él'}
           </h3>
           <p className="text-slate-600 font-medium italic border-l-4 border-blue-100 pl-4">
              "{userData.bio || 'Sin biografía disponible'}"
           </p>
           
           <div className="grid grid-cols-1 gap-4 pt-2">
              <PreferenciaMini icon={MessageSquare} text="¡Hablo por los codos!" active={true} />
              <PreferenciaMini icon={ShieldAlert} text="No quiere que se fume" active={true} />
           </div>
        </div>
      </div>
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
