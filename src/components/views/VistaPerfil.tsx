import React from 'react';
import { 
  LogOut, ShieldCheck, CheckCircle2, UserCog, ChevronRight,
  Camera, Phone, Mail, FileText, Car, User, Trophy, Flame,
  UserCheck, Calendar, ShieldAlert // <-- Añadidos para KYC y Seguridad
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
        {/* A. CABECERA DE IDENTIDAD (RANGO EN LA ESQUINA) */}
<div className="bg-white p-8 rounded-[45px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 text-center relative overflow-hidden group">
  
  {/* ÚNICO INDICADOR DE RANGO: Arriba a la derecha */}
  <div className="absolute top-5 right-5">
    <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest shadow-lg">
      Rango: {rango}
    </div>
  </div>

  <div className="relative w-28 h-28 mx-auto mb-5">
    <div className={`w-full h-full rounded-full bg-gradient-to-tr from-orange-500 via-slate-200 to-slate-200 p-1 shadow-xl`}>
      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white shadow-inner">
        {userData.fotoPerfil ? (
            <img src={userData.fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
        ) : (
            <User size={50} className="text-slate-200 mt-4" />
        )}
      </div>
    </div>
    {userData.kycVerificado && (
      <div className="absolute -bottom-1 -right-1 bg-blue-600 p-2 rounded-full border-4 border-white shadow-lg">
        <ShieldCheck size={16} className="text-white" />
      </div>
    )}
  </div>

  <h2 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">
    {userData.nombre || "Usuario"}, <span className="text-blue-600">{userData.edad || "30"}</span>
  </h2>
  
  <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-100 to-transparent w-full my-6" />
  
  <p className="text-xs font-medium italic text-slate-500 leading-relaxed px-2">
    "{userData.bio || "Pide tu cola seguro con DameLaCola"}"
  </p>
</div>

{/* B. LA BARRA DE PROGRESO DE CONFIANZA (LA QUE MANTENEMOS) */}
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
  <div className="p-5 space-y-7 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
    
    {/* 1. PERFIL PERSONAL */}
    <div className="space-y-3">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4">Perfil Personal</p>
        <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
            
            {/* Foto de Perfil */}
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all border-b border-slate-50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                        {userData.fotoPerfil ? (
                            <img src={userData.fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
                        ) : (
                            <Camera size={18} className="text-slate-300"/>
                        )}
                    </div>
                    <div className="text-left">
                        <span className="text-[11px] font-black italic text-slate-700 uppercase block leading-none">Foto de Perfil</span>
                        <span className="text-[9px] font-bold text-blue-500 mt-1 block">Cambiar imagen</span>
                    </div>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
            </button>

            <MenuButtonCuenta icon={UserCog} label="Nombre Completo" value={userData.nombre} />
            <MenuButtonCuenta icon={Mail} label="Correo Electrónico" value={userData.email} />
            <MenuButtonCuenta icon={Phone} label="Número de Teléfono" value={userData.telefono || "No asignado"} />
            <MenuButtonCuenta icon={Calendar} label="Fecha de Nacimiento" value={userData.fechaNacimiento || "00/00/0000"} />
        </div>
    </div>

    {/* 2. SEGURIDAD Y VERIFICACIÓN (KYC) */}
    <div className="space-y-3">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] ml-4">Seguridad y Verificación</p>
        <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-3 space-y-2">
            
            <ItemDocumento 
                icon={FileText} 
                label="Cédula de Identidad" 
                desc="Foto frontal y posterior" 
                estado={userData.kycVerificado} 
            />

            <ItemDocumento 
                icon={UserCheck} 
                label="Verificación Facial" 
                desc="Selfie de seguridad" 
                estado={userData.fotoVerificada} 
            />
        </div>
    </div>

    {/* 3. DATOS DEL VEHÍCULO */}
    <div className="space-y-3">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4">Mi Vehículo</p>
        <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
            <MenuButtonCuenta icon={Car} label="Datos del Carro" value={userData.vehiculo?.placa ? `${userData.vehiculo.marca} (${userData.vehiculo.placa})` : "Registrar vehículo"} />
            <MenuButtonCuenta icon={ShieldCheck} label="Licencia de Conducir" value={userData.licenciaVerificada ? "Verificada" : "Pendiente de subir"} />
        </div>
    </div>

       {/* BOTÓN DE CIERRE */}
    <div className="pt-4">
      <button 
        onClick={handleLogout} 
        className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-500 rounded-[30px] font-black uppercase text-[10px] border border-red-100 active:scale-95 transition-all"
      >
        <LogOut size={16} /> Cerrar Sesión
      </button>
    </div>
  </div>
)}
      </div>
    </div>
  );
};


const MenuButtonCuenta = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
    <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                <Icon size={18}/>
            </div>
            <div className="text-left">
                <span className="text-[10px] font-black italic text-slate-700 uppercase block leading-none">{label}</span>
                <span className="text-[9px] font-bold text-slate-400 mt-1 block tracking-wider truncate max-w-[180px]">
                    {value || "No registrado"}
                </span>
            </div>
        </div>
        <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
    </button>
);

/**
 * Item especializado para documentos de identidad (KYC)
 * Cambia de color y muestra un badge de "LISTO" si el campo está en true en Firebase
 */
const ItemDocumento = ({ icon: Icon, label, desc, estado }: { icon: any, label: string, desc: string, estado: boolean }) => (
    <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
            estado ? 'bg-green-100 text-green-600' : 'bg-orange-50 text-orange-500'
        }`}>
            <Icon size={22}/>
        </div>
        <div className="flex-1 text-left">
            <p className="text-[11px] font-black italic text-slate-800 uppercase leading-tight">{label}</p>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5">{desc}</p>
        </div>
        <button className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase shadow-sm transition-all active:scale-90 ${
            estado 
                ? 'bg-green-500 text-white' 
                : 'bg-white text-orange-500 border border-orange-100'
        }`}>
            {estado ? (
                <span className="flex items-center gap-1"><CheckCircle2 size={10}/> LISTO</span>
            ) : (
                'SUBIR'
            )}
        </button>
    </div>
);

