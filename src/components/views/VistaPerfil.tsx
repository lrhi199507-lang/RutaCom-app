import React from 'react';
import { VistaPerfilCompleto } from './VistaPerfilCompleto'; // Importamos el diseño que ya arreglamos
import { Settings, User, LogOut, ShieldCheck, Info } from 'lucide-react';

const VistaPerfil = ({ userData, pestañaActiva, setPestañaActiva, handleLogout }) => {
  
  // Lógica del Módulo 13: Barra de progreso
  const pasosCompletados = userData?.pasosCompletados || 3; // Esto vendría de Firebase
  const porcentaje = Math.round((pasosCompletados / 6) * 100);

  return (
    <div className="bg-slate-50 min-h-screen animate-in fade-in duration-500">
      
      {/* BOTONES DE NAVEGACIÓN (Módulo 16: Pestañas de Cuenta vs Perfil) */}
      <div className="bg-white p-4 sticky top-0 z-10 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1 rounded-[20px]">
          <button 
            onClick={() => setPestañaActiva('publico')}
            className={`flex-1 py-3 rounded-[15px] text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              pestañaActiva === 'publico' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'
            }`}
          >
            <User size={16} /> Mi Perfil
          </button>
          <button 
            onClick={() => setPestañaActiva('cuenta')}
            className={`flex-1 py-3 rounded-[15px] text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              pestañaActiva === 'cuenta' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'
            }`}
          >
            <Settings size={16} /> Cuenta
          </button>
        </div>
      </div>

      {/* CONTENIDO DINÁMICO */}
      <div className="p-0">
        {pestañaActiva === 'publico' ? (
          /* VISTA PÚBLICA (El diseño que ya arreglamos) */
          <>
            {/* Barra de Progreso (Módulo 13) insertada aquí */}
            <div className="px-4 pt-4">
               <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm mb-2">
                <div className="flex justify-between items-end mb-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    Seguridad del Perfil
                  </h3>
                  <span className="text-xl font-black text-blue-600 italic">{porcentaje}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-1000"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-3 flex items-center gap-1 uppercase">
                  <ShieldCheck size={12} className="text-blue-500" /> {pasosCompletados} de 6 pasos de confianza
                </p>
              </div>
            </div>

            <VistaPerfilCompleto userData={userData} isOwnProfile={true} />
          </>
        ) : (
          /* VISTA ADMINISTRATIVA (Módulo 16: Datos Privados) */
          <div className="p-4 space-y-4">
            <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase italic">Datos Privados</h3>
              
              <div className="space-y-3">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Documento de Identidad</p>
                  <p className="text-sm font-bold text-slate-700">{userData?.cedula || 'V-00.000.000'}</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Correo Electrónico</p>
                  <p className="text-sm font-bold text-slate-700">{userData?.email || 'usuario@correo.com'}</p>
                </div>
              </div>
            </div>

            {/* BOTÓN CERRAR SESIÓN */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-500 rounded-[25px] font-black uppercase text-xs tracking-widest active:scale-95 transition-all border border-red-100"
            >
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { VistaPerfil };
