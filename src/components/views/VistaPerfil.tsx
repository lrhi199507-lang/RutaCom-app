import React from 'react';
import { 
  LogOut, ShieldCheck, CheckCircle2, 
  CreditCard, DollarSign, UserCog, HelpCircle, ChevronRight,
  Camera, Phone, Mail, FileText, Car, Pencil, User, Trophy, Flame
} from 'lucide-react';

export const VistaPerfil = ({ userData, handleLogout, pestañaActiva, setPestañaActiva }) => {
  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400">CARGANDO PERFIL...</div>;

  const view = pestañaActiva || 'publico';

  // --- LÓGICA DE NIVELES Y CONFIANZA ---
  
  // 1. Rango de Usuario (Basado en viajes)
  const totalViajes = userData.viajesRealizados || 0;
  let rango = "Novato";
  let metaViajes = 10;
  let colorFondoRango = "bg-orange-100";
  let colorTextoRango = "text-orange-600";

  if (totalViajes >= 10) {
    rango = "Plata";
    metaViajes = 50;
    colorFondoRango = "bg-slate-100";
    colorTextoRango = "text-slate-500";
  }

  const progresoRango = Math.min((totalViajes / metaViajes) * 100, 100);

  // 2. Estado de Confianza (Basado en documentos)
  const puntosControl = [
    { id: 'email', label: 'Email/Tel', verificado: !!userData.email, icono: Mail },
    { id: 'cedula', label: 'Cédula', verificado: !!userData.kycVerificado, icono: FileText },
    { id: 'licencia', label: 'Licencia', verificado: !!userData.licenciaVerificada, icono: ShieldCheck },
    { id: 'matricula', label: 'Matrícula', verificado: !!userData.matriculaVerificada, icono: FileText },
  ];

  const totalVerificados = puntosControl.filter(p => p.verificado).length;
  const porcentajeConfianza = (totalVerificados / puntosControl.length) * 100;

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      {/* NAVEGACIÓN SUPERIOR */}
      <div className="p-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] max-w-md mx-auto shadow-inner">
          <button 
            onClick={() => setPestañaActiva('publico')}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${
              view === 'publico' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
            }`}
          >
            Mi Perfil
          </button>
          <button 
            onClick={() => setPestañaActiva('cuenta')}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${
              view === 'cuenta' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
            }`}
          >
            Cuenta
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {view === 'publico' ? (
          <div className="p-5 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* A. CABECERA DE RANGO Y EXPERIENCIA (UNIFICADA) */}
            <div className="bg-white p-8 rounded-[45px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 text-center relative overflow-hidden group">
              <div className="absolute top-5 right-5">
                <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest shadow-lg">
                  Rango: {rango}
                </div>
              </div>
              
              <div className="relative w-28 h-28 mx-auto mb-5">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 via-slate-200 to-slate-200 p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white shadow-inner">
                    <User size={50} className="text-slate-200 mt-4" />
                  </div>
                </div>
                {userData.kycVerificado && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 p-2 rounded-full border-4 border-white shadow-lg animate-pulse">
                    <ShieldCheck size={16} className="text-white" />
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">
                {userData.nombre || "Usuario"}, <span className="text-blue-600">{userData.edad || "30"}</span>
              </h2>
              
              {/* BARRA DE PROGRESO DE RANGO */}
              <div className="mt-5 px-4">
                <div className="flex justify-between text-[7px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">
                  <span>{rango}</span>
                  <span className={`${colorTextoRango} italic font-black`}>
                    Faltan {metaViajes - totalViajes} viajes para nivel {rango === "Novato" ? "Plata" : "Oro"}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-1000" 
                    style={{ width: `${progresoRango}%` }}
                  />
                </div>
              </div>

              <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-100 to-transparent w-full my-6" />
              <p className="text-xs font-medium italic text-slate-500 leading-relaxed px-2">
                "{userData.bio || "Sin biografía"}"
              </p>
            </div>

            {/* B. ESTADO DE CONFIANZA (TERMÓMETRO) */}
            <div className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] mb-1">Estado de Confianza</p>
                  <p className="text-lg font-black italic text-slate-800 uppercase leading-none">
                    {totalVerificados} de {puntosControl.length} Verificados
                  </p>
                </div>
                <div className="bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
                  <p className="text-2xl font-black italic text-orange-500 leading-none">
                    {porcentajeConfianza.toFixed(0)}%
                  </p>
                </div>
              </div>
              
              <div className="w-full h-4 bg-slate-100 rounded-full p-1 border border-slate-50 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all duration-1000"
                  style={{ width: `${porcentajeConfianza}%` }}
                />
              </div>
            </div>

          </div>
        ) : (
          <div className="p-5 animate-in slide-in-from-right-4 duration-500">
             {/* PESTAÑA CUENTA (BOTONES) */}
             <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-500 rounded-[30px] font-black uppercase text-[10px]">
                  Cerrar Sesión
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
            
