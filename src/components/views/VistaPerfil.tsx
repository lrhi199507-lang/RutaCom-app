import React from 'react';
import { VistaPerfilCompleto } from './VistaPerfilCompleto';
import { Settings, User, LogOut, ShieldCheck } from 'lucide-react';

const VistaPerfil = ({ userData, handleLogout, pestañaActiva, setPestañaActiva }) => {
  
  // Forzamos un valor por defecto si las props no llegan
  const view = pestañaActiva || 'publico';
  const safeSetPestaña = setPestañaActiva || (() => {});

  const pasos = userData?.pasosCompletados || 3;
  const porcentaje = Math.round((pasos / 6) * 100);

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      
      {/* SELECTOR DE PESTAÑAS (Módulo 16) */}
      <div className="bg-white p-1 rounded-2xl flex border border-slate-100 mb-6 shadow-sm">
        <button 
          onClick={() => safeSetPestaña('publico')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            view === 'publico' ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400'
          }`}
        >
          <User size={14} /> Mi Perfil
        </button>
        <button 
          onClick={() => safeSetPestaña('cuenta')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            view === 'cuenta' ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400'
          }`}
        >
          <Settings size={14} /> Cuenta
        </button>
      </div>

      {/* CONTENIDO */}
      {view === 'publico' ? (
        <div className="space-y-4">
          {/* Barra de Progreso (Módulo 13) */}
          <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-end mb-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seguridad</h3>
              <span className="text-xl font-black text-blue-600 italic">{porcentaje}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                style={{ width: `${porcentaje}%` }} 
              />
            </div>
          </div>

          <VistaPerfilCompleto userData={userData} isOwnProfile={true} />
        </div>
      ) : (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
          <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase italic mb-4">Configuración Privada</h3>
            <div className="space-y-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase">Cédula de Identidad</p>
                <p className="text-sm font-bold text-slate-800">{userData?.cedula || 'V-00.000.000'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-500 rounded-[25px] font-black uppercase text-xs tracking-widest active:scale-95 transition-all border border-red-100"
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
};

// EXPORTACIÓN IMPORTANTE
export { VistaPerfil };
