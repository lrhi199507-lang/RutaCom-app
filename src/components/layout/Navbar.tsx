import React from "react";
import { Search, PlusCircle, MessageSquare, User, Map } from "lucide-react";

export const Navbar = ({ vista, modo, setVista, setModo, setPasoWizard }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 pb-8 flex justify-between items-center z-50 rounded-t-[35px] shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)]">
      
      {/* BOTÓN 1: BUSCAR */}
      <button 
        onClick={() => { setVista("inicio"); setModo("pasajero"); }} 
        className={`flex flex-col items-center gap-1 transition-all flex-1 ${vista === "inicio" && modo === "pasajero" ? "text-blue-600" : "text-slate-300 hover:text-blue-600"}`}
      >
        <Search size={20} strokeWidth={3} />
        <span className="text-[9px] font-black uppercase italic tracking-tighter">Buscar</span>
      </button>

      {/* BOTÓN 2: TUS VIAJES */}
      <button 
        onClick={() => setVista("mis_viajes")} 
        className={`flex flex-col items-center gap-1 transition-all flex-1 ${vista === "mis_viajes" ? "text-blue-600" : "text-slate-300 hover:text-blue-600"}`}
      >
        <Map size={20} strokeWidth={3} />
        <span className="text-[9px] font-black uppercase italic tracking-tighter">Viajes</span>
      </button>

      {/* BOTÓN 3: PUBLICAR (CORREGIDO Y CON COLOR DORADO) */}
      <button 
        onClick={() => {
          setVista("publicar"); // <--- CAMBIADO: Ahora sí abre el Wizard
          setModo("conductor");  // Cambiamos a modo conductor
          setPasoWizard(1);     // Reiniciamos al paso 1
        }} 
        className={`flex flex-col items-center gap-1 flex-1 transition-all active:scale-90 ${
          vista === "publicar" 
            ? "text-blue-600 scale-110" // Azul cuando estás publicando
            : "text-amber-500 hover:text-amber-600" // DORADO cuando estás en otra pestaña
        }`}
      >
        <PlusCircle size={26} strokeWidth={3} /> {/* Un poco más grande para que destaque */}
        <span className="text-[9px] font-black uppercase italic tracking-tighter">Publicar</span>
      </button>

      {/* BOTÓN 4: MENSAJES */}
      <button 
        onClick={() => setVista("inbox")} 
        className={`flex flex-col items-center gap-1 transition-all flex-1 ${vista === "inbox" ? "text-blue-600" : "text-slate-300 hover:text-blue-600"}`}
      >
        <MessageSquare size={20} strokeWidth={3} />
        <span className="text-[9px] font-black uppercase italic tracking-tighter">Mensajes</span>
      </button>

      {/* BOTÓN 5: PERFIL */}
      <button 
        onClick={() => setVista("perfil")} 
        className={`flex flex-col items-center gap-1 transition-all flex-1 ${vista === "perfil" ? "text-blue-600" : "text-slate-300 hover:text-blue-600"}`}
      >
        <User size={20} strokeWidth={3} />
        <span className="text-[9px] font-black uppercase italic tracking-tighter">Perfil</span>
      </button>
      
    </nav>
  );
};
