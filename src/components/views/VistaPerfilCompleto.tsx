import React from 'react';
import { 
  User, ShieldCheck, Car, Clock, Calendar, 
  ChevronRight, ArrowLeft, MessageSquare, 
  Star, ShieldAlert, Award, Map, Wallet
} from 'lucide-react';

// --- HELPER: FORMATO MIEMBRO DESDE (CON ABRIL 2026 POR DEFECTO) ---
const formatearMesAño = (isoString) => {
  // Si no tiene fecha guardada, por defecto es Abril 2026
  if (!isoString) return 'Abril 2026';
  
  const date = new Date(isoString);
  
  // Por si la fecha se guardó con un formato inválido
  if (isNaN(date.getTime())) return 'Abril 2026';

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${meses[date.getMonth()]} ${date.getFullYear()}`;
};

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
                  <button onClick={onRegresar} className="text-slate-400 hover:text-[#063971] pr-1 transition-colors">
                     <ArrowLeft size={20} />
                  </button>
               )}
               <div className="w-14 h-14 rounded-[20px] bg-[#063971] flex items-center justify-center shadow-md shadow-[#063971]/20">
                  <span className="font-black text-white text-2xl italic">D</span>
               </div>
            </div>

            {/* Texto Dinámico */}
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  MODO CHOFER
               </p>
               <h1 className="text-lg font-black text-[#1F2937] tracking-tighter mt-1">
                  {userData.nombre || 'Cargando...'}
               </h1>
            </div>
         </div>

         {/* Botones de Acción (Mapa y Wallet) */}
         <div className="flex items-center gap-2">
            <button className="w-12 h-12 bg-[#063971] rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#063971]/20 active:scale-95 transition-all hover:bg-blue-800">
               <Map size={22} />
            </button>
            
            <button className="h-12 bg-[#1F2937] rounded-full flex items-center gap-2.5 px-4 shadow-sm active:scale-95 transition-all border border-slate-800">
               <Wallet size={16} className="text-[#10B981]" />
               <p className="text-sm font-black text-[#10B981] tracking-tighter">
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
              <div className="w-28 h-28 bg-[#063971]/5 rounded-full border-4 border-white overflow-hidden shadow-xl flex items-center justify-center">
                 {userData.fotoPerfil ? (
                    <img src={userData.fotoPerfil} className="w-full h-full object-cover" alt="Perfil" />
                 ) : (
                    <User size={60} className="text-[#063971]/40 m-auto mt-3" />
                 )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#063971] p-2 rounded-full shadow-lg shadow-[#063971]/30 text-white border-2 border-white">
                 <Award size={18} fill="currentColor" />
              </div>
            </div>
            
            <h1 className="text-2xl font-black text-[#1F2937] uppercase italic tracking-tight">
               {userData.nombre || 'USUARIO'}
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
               {userData.edad ? `${userData.edad} AÑOS` : 'EDAD N/D'}
            </p>
          </div>

          <hr className="border-slate-50 mb-6" />

          {/* Valoración */}
          <button className="w-full flex items-center justify-between py-2 group">
             <div className="flex items-center gap-3">
                <Star size={24} className="text-amber-500" fill="currentColor" />
                <div className="text-left">
                   <p className="text-xl font-black text-[#1F2937] leading-none">
                      {userData.rating ? userData.rating.toFixed(1) : "5.0"} de 5
                   </p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Basado en sus últimos viajes
                   </p>
                </div>
             </div>
             <ChevronRight size={20} className="text-slate-300 group-hover:text-[#063971] transition-colors" />
          </button>

          <hr className="border-slate-50 my-6" />

          {/* Confianza */}
          <div className="space-y-6 pb-2">
             <ConfianzaItem icon={ShieldCheck} text="Perfil verificado con Cédula" verified={userData.kycVerificado} />
             <ConfianzaItem icon={Car} text="Publica viajes regularmente" verified={true} />
             <ConfianzaItem icon={Clock} text="Tiempo de respuesta rápido" verified={true} />
             <ConfianzaItem icon={Calendar} text={`Miembro desde ${formatearMesAño(userData.fechaRegistro || userData.fechaCreacion)}`} verified={true} />
          </div>
        </div>
      </div>

      {/* Acerca de */}
      <div className="px-4 pb-10">
        <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm space-y-4">
           <h3 className="text-xl font-black text-[#1F2937] uppercase italic leading-none">
             Acerca de {userData.nombre?.split(' ')[0] || 'él'}
           </h3>
           <p className="text-slate-600 font-medium italic border-l-4 border-[#063971] pl-4">
             "{userData.bio || 'Sin biografía disponible'}"
           </p>
           
           <div className="grid grid-cols-1 gap-4 pt-2">
              <PreferenciaMini icon={MessageSquare} text={userData.hablador === 'hablador' ? "¡Hablo por los codos!" : "Prefiero ir en silencio"} active={true} />
              <PreferenciaMini icon={ShieldAlert} text={userData.musica === 'con_musica' ? "Escucho música en el camino" : "Prefiero el viaje sin música"} active={true} />
           </div>
        </div>
      </div>
    </div>
  );
};

const ConfianzaItem = ({ icon: Icon, text, verified }) => (
  <div className="flex items-center gap-4">
    <div className={`w-6 h-6 flex items-center justify-center ${verified ? 'text-[#063971]' : 'text-slate-300'}`}>
       <Icon size={20} />
    </div>
    <span className={`text-[13px] font-semibold ${verified ? 'text-[#1F2937]' : 'text-slate-400'}`}>
       {text}
    </span>
  </div>
);

const PreferenciaMini = ({ icon: Icon, text, active }) => (
  <div className="flex items-center gap-3 text-slate-600">
     <div className="bg-slate-50 p-2 rounded-xl border border-slate-100"><Icon size={18} className="text-[#063971]" /></div>
     <span className="text-sm font-semibold text-[#1F2937]">{text}</span>
  </div>
);
