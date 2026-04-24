import React from 'react';
import PerfilPublico from './PerfilPublico';
import { 
  ArrowLeft, MapPin, Car, User, ShieldCheck, 
  MessageCircle, Snowflake, CigaretteOff, 
  PawPrint, MessageSquare, Briefcase,
  ChevronRight // <--- AGREGA ESTE AQUÍ
} from 'lucide-react';


export const VistaDetalleViaje = ({ viaje, onRegresar }) => {
  if (!viaje) return null;

  const preferencias = [
    { icono: Snowflake, texto: "A/C" },
    { icono: CigaretteOff, texto: "NO FUMAR" },
    { icono: PawPrint, texto: "MASCOTAS" },
    { icono: MessageSquare, texto: "CONVERSACIÓN" },
    { icono: Briefcase, texto: "EQUIPAJE" },
  ];

  const [verPerfil, setVerPerfil] = React.useState(false);
  

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      {/* AREA DE SCROLL - pb-60 para asegurar que el contenido suba por encima de los botones */}
      <div className="flex-1 overflow-y-auto pb-60">
        
        {/* BOTÓN VOLVER */}
        <div className="p-4 pt-6">
          <button onClick={onRegresar} className="flex items-center gap-2 text-slate-400 active:scale-95 transition-all">
            <ArrowLeft size={16} strokeWidth={3} />
            <span className="text-[9px] font-black uppercase tracking-[2px]">Volver</span>
          </button>
        </div>

        <div className="px-5 space-y-4">
          
          {/* TARJETA DE PRECIO Y RUTA DINÁMICA */}
          <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Total</p>
                <div className="flex items-start">
                  <span className="text-xl font-black italic text-blue-600 mt-1">$</span>
                  <span className="text-5xl font-black italic text-blue-600 leading-none">
                    {viaje.precio || "10"}
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase italic text-blue-600">Novato</span>
              </div>
            </div>

            {/* RUTA DINÁMICA */}
            <div className="flex items-center justify-between px-2">
              <div className="flex flex-col items-center flex-1 text-center">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-600 shadow-sm shadow-blue-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                </div>
                <p className="text-[10px] font-black text-slate-800 mt-2 uppercase italic leading-none">{viaje.cO || "ORIGEN"}</p>
                <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">Carabobo</p>
              </div>

              <div className="flex-1 flex flex-col items-center px-2">
                <div className="w-full h-[2px] bg-slate-100 rounded-full relative flex items-center">
                  <div className="absolute left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[60%]" />
                  <div className="absolute left-[60%] w-2 h-2 bg-blue-400 rounded-full border border-white shadow-sm" />
                </div>
                <div className="mt-2 bg-blue-50/50 px-2 py-0.5 rounded-md">
                  <span className="text-[6px] font-black text-blue-500 uppercase italic">En ruta</span>
                </div>
              </div>

              <div className="flex flex-col items-center flex-1 text-center">
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center border-2 border-slate-200">
                  <MapPin size={16} className="text-slate-300" />
                </div>
                <p className="text-[10px] font-black text-slate-800 mt-2 uppercase italic leading-none">{viaje.cD || "DESTINO"}</p>
                <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">Distrito Cap.</p>
              </div>
            </div>
          </div>

          {/* VEHÍCULO COMPACTO */}
          <div className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50/30 border border-blue-100 flex items-center justify-center text-blue-500">
              <Car size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Vehículo</p>
              <p className="text-base font-black italic text-slate-700 leading-none uppercase">
                {viaje.vM || "TOYOTA"} {viaje.vMo || "HILUX"}
              </p>
              <div className="flex gap-1.5 mt-2">
                <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded-md text-[8px] font-black border border-slate-100 uppercase">
                  {viaje.vP || "1234"}
                </span>
                <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded-md text-[8px] font-black border border-slate-100 uppercase">
                  {viaje.vC || "NEGRO"}
                </span>
              </div>
            </div>
          </div>

          {/* CONDUCTOR (ACTUALIZADO CON CLIC) */}
<div 
  onClick={() => setVerPerfil(true)} 
  className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-100 flex items-center gap-4 active:bg-slate-50 cursor-pointer transition-all"
>
  <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 overflow-hidden shadow-inner">
    {/* Si el objeto viaje ya trae la foto, se verá aquí */}
    {viaje.fotoPerfil ? (
      <img src={viaje.fotoPerfil} className="w-full h-full object-cover" alt="Perfil" />
    ) : (
      <User size={20} />
    )}
  </div>
  <div className="flex-1">
    <p className="text-base font-black italic text-slate-700 leading-none uppercase underline decoration-blue-100 decoration-2 underline-offset-2">
      {viaje.cN || "CONDUCTOR"}
    </p>
    <div className="flex items-center gap-1 mt-1.5">
      <ShieldCheck size={12} className="text-blue-500 fill-blue-50" />
      <p className="text-[8px] font-black text-blue-600 uppercase tracking-tighter">Ver Perfil Verificado</p>
    </div>
  </div>
  {/* Una pequeña flechita para indicar que se puede entrar */}
  <ChevronRight size={14} className="text-slate-200" />
</div>
          

          {/* PASAJEROS */}
          <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 space-y-4">
            <p className="text-[9px] font-black italic text-slate-400 uppercase tracking-widest text-center">Puestos Confirmados (0/1)</p>
            <div className="border border-dashed border-slate-100 rounded-2xl p-4 flex items-center gap-3 bg-slate-50/50">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-200">
                <User size={14} />
              </div>
              <p className="text-[9px] font-black italic text-slate-300 uppercase">Asiento Disponible</p>
            </div>
          </div>

          {/* PREFERENCIAS */}
          <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 space-y-4">
            <p className="text-[9px] font-black italic text-slate-800 uppercase tracking-widest">Preferencias del viaje</p>
            <div className="grid grid-cols-2 gap-2">
              {preferencias.map((pref, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl flex items-center gap-2 border border-slate-50 active:scale-95 transition-all">
                  <pref.icono size={14} className="text-blue-500" />
                  <span className="text-[8px] font-black italic text-blue-900 uppercase">{pref.texto}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* BOTONES FIJOS - Ajustados para estar ARRIBA de la barra de navegación (bottom-20) */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 z-[60] max-w-md mx-auto">
        <div className="flex gap-3 h-14">
          <button className="flex-1 bg-slate-900 text-white rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
            <MessageCircle size={16} />
            Chat
          </button>
          <button className="flex-[2] bg-blue-600 text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
            Pedir esta Cola
          </button>
        </div>
      </div>
      {/* CAPA ENCIMA PARA EL PERFIL PÚBLICO */}
{verPerfil && (
  <PerfilPublico 
    conductor={{
      nombre: viaje.cN || viaje.conductor,
      fotoPerfil: viaje.fotoPerfil, // <--- REVISA QUE ESTO DIGA fotoPerfil
      bio: viaje.bioConductor,
      hablador: viaje.prefHablador,
      musica: viaje.prefMusica
    }} 
    onClose={() => setVerPerfil(false)} 
  />
)}
    </div>
  );
};
