import React from "react";
import { Search, PlusCircle, MessageSquare, User } from "lucide-react";

export const Navbar = ({ vista, modo, setVista, setModo, cambiarVista }) => {
  return (
    <nav className="p-3 bg-white border-t flex justify-between items-center pb-8 fixed bottom-0 w-full max-w-md shadow-2xl z-50 px-6 rounded-t-3xl left-1/2 -translate-x-1/2">
      <button 
        onClick={() => { setVista("inicio"); setModo("pasajero"); }} 
        className={`flex flex-col items-center gap-1 ${vista === "inicio" && modo === "pasajero" ? "text-blue-600" : "text-slate-300"}`}
      >
        <Search size={24} />
        <span className="text-[8px] font-black uppercase italic">Buscar</span>
      </button>

      <button 
        onClick={() => { setVista("inicio"); setModo("chofer"); }} 
        className={`flex flex-col items-center gap-1 ${vista === "inicio" && modo === "chofer" ? "text-blue-600" : "text-slate-300"}`}
      >
        <PlusCircle size={24} />
        <span className="text-[8px] font-black uppercase italic">Publicar</span>
      </button>

      <button 
        onClick={() => cambiarVista("inbox")} 
        className={`flex flex-col items-center gap-1 ${vista === "inbox" ? "text-blue-600" : "text-slate-300"}`}
      >
        <MessageSquare size={24} />
        <span className="text-[8px] font-black uppercase italic">Mensajes</span>
      </button>

      <button 
        onClick={() => cambiarVista("perfil")} 
        className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600" : "text-slate-300"}`}
      >
        <User size={24} />
        <span className="text-[8px] font-black uppercase italic">Perfil</span>
      </button>
    </nav>
  );
};