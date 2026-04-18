import React from 'react';
import { Settings, User, LogOut } from 'lucide-react';
import { VistaPerfilCompleto } from './VistaPerfilCompleto';

export const VistaPerfil = ({ userData, handleLogout, pestañaActiva, setPestañaActiva }) => {
  // BLINDAJE TOTAL: Si no hay datos, mostramos un aviso en lugar de romper la app
  if (!userData) return <div className="p-20 text-center font-black">ERROR: SIN DATOS</div>;

  const view = pestañaActiva || 'publico';

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* SELECTOR DE PESTAÑAS */}
      <div className="p-4 bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => setPestañaActiva('publico')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
              view === 'publico' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            Mi Perfil
          </button>
          <button 
            onClick={() => setPestañaActiva('cuenta')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
              view === 'cuenta' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            Cuenta
          </button>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="animate-in fade-in duration-300">
        {view === 'publico' ? (
          <VistaPerfilCompleto userData={userData} isOwnProfile={true} />
        ) : (
          <div className="p-4">
             <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase">Cédula</p>
                <p className="font-bold text-slate-800 mb-4">{userData.cedula || "No registrada"}</p>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-500 rounded-[25px] font-black uppercase text-xs border border-red-100"
                >
                  <LogOut size={18} /> Cerrar Sesión
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
