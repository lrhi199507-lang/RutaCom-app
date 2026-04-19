import React from 'react';
// IMPORTANTE: Aquí están todos los iconos que usas abajo
import { User, Award, Star, ChevronRight, ShieldCheck, Car, Calendar } from 'lucide-react';

// Definimos ConfianzaItem aquí mismo para que React sepa qué es
const ConfianzaItem = ({ icon: Icon, text, verified }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-xl ${verified ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
        <Icon size={18} />
      </div>
      <p className="text-xs font-bold text-slate-700">{text}</p>
    </div>
    {verified && <ShieldCheck size={16} className="text-green-500" fill="currentColor" />}
  </div>
);

export const VistaPerfilCompleto = ({ userData, isOwnProfile = false, onRegresar }) => {
  if (!userData) return <div className="p-10 text-center font-black animate-pulse text-slate-400 italic uppercase text-xs">Cargando perfil...</div>;

  return (
    <div className="bg-slate-50 min-h-full pb-28 animate-in fade-in duration-300">
      <div className="p-4">
        <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm relative overflow-hidden">
          
          <div className="flex flex-col items-center text-center pb-6">
            <div className="relative mb-4">
              <div className="w-28 h-28 bg-slate-50 rounded-full border-4 border-white overflow-hidden shadow-xl flex items-center justify-center">
                 {userData.fotoPerfil ? (
                    <img src={userData.fotoPerfil} className="w-full h-full object-cover" alt="Perfil" />
                 ) : (
                    <User size={60} className="text-slate-300 m-auto mt-3" />
                 )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-blue-600 p-2 rounded-full shadow-lg text-white">
                 <Award size={18} fill="currentColor" />
              </div>
            </div>
            
            <h1 className="text-2xl font-black text-slate-950 uppercase italic tracking-tight">
               {userData.nombre || 'USUARIO'}
            </h1>
            
            <div className="flex items-center gap-2 mt-1">
               <span className="bg-blue-50 text-blue-600 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                  {userData.viajesRealizados > 50 ? "Embajador" : userData.viajesRealizados > 10 ? "Experto" : "Novato"}
               </span>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  • {userData.edad || '29'} Años
               </span>
            </div>
          </div>

          <hr className="border-slate-50 mb-6" />

          {/* Valoración - Blindado con Number() para evitar fallos si es string */}
          <button className="w-full flex items-center justify-between py-2 group active:scale-95 transition-all">
             <div className="flex items-center gap-3">
                <Star size={24} className="text-blue-600" fill="currentColor" />
                <div className="text-left">
                   <p className="text-xl font-black text-slate-900 leading-none">
                      {Number(userData.rating || 5).toFixed(1)} de 5
                   </p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Reputación en Dame la cola
                   </p>
                </div>
             </div>
             <ChevronRight size={20} className="text-slate-300" />
          </button>

          <hr className="border-slate-50 my-6" />

          <div className="space-y-6 pb-2">
             <ConfianzaItem icon={ShieldCheck} text="Identidad Verificada (KYC)" verified={userData.kycVerificado} />
             <ConfianzaItem icon={Car} text="Vehículo Validado" verified={!!userData.vehiculo} />
             <ConfianzaItem icon={Calendar} text={`Miembro desde ${userData.miembroDesde || 'Abril 2026'}`} verified={true} />
          </div>
        </div>
      </div>
    </div>
  );
};
