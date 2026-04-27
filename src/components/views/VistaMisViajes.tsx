import React, { useState } from 'react';
import { 
  Trash2, Edit3, CheckCircle2, XCircle, 
  Clock, Users, ChevronRight, AlertCircle, 
  History, Car, User, X, Calendar 
} from 'lucide-react';

export const VistaMisViajes = ({ 
  viajes = [], 
  userData, 
  onEditarViaje, 
  onEliminarViaje, 
  onAceptarPasajero,
  onRechazarPasajero 
}) => {
  const [subVista, setSubVista] = useState("pasajero");
const [viajeAEditarRapido, setViajeAEditarRapido] = useState(null);
const [showModalEdicion, setShowModalEdicion] = useState(false);

  const actualizarDetallesViaje = async (idViaje, nuevosDatos) => {
  try {
    const viajeRef = doc(db, "rutas", idViaje); // Ajusta según tu colección
    await updateDoc(viajeRef, {
      precio: nuevosDatos.precio,
      fecha: nuevosDatos.fecha,
      hora: nuevosDatos.hora,
      puestos: nuevosDatos.puestos,
      // No incluimos ni origen ni destino aquí para proteger la ruta
    });
    setToastMessage("¡Cambios guardados!");
    setShowModalEdicion(false);
  } catch (error) {
    console.error("Error actualizando:", error);
  }
};
  

  // 1. FILTRADO CON NOMBRES EXACTOS DE TU FIREBASE
  // Como pasajero: Buscamos tu ID en los arrays de pasajeros o reservas
  const viajesComoPasajero = viajes.filter(v => 
    v.pasajeros?.some(p => p.id === userData?.id) || 
    v.reservasPendientes?.some(p => p.id === userData?.id)
  );

  // Como chofer: Usamos 'uidConductor' que vimos en tu captura
  const misPublicaciones = viajes.filter(v => v.uidConductor === userData?.id);

  // Historial: Viajes con fecha anterior a hoy
  const hoy = new Date().toISOString().split('T')[0];
  const historial = viajes.filter(v => {
    const fechaV = v.fecha ? v.fecha.split('T')[0] : "";
    return fechaV < hoy && (v.uidConductor === userData?.id || v.pasajeros?.some(p => p.id === userData?.id));
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* HEADER TABS (ESTILO PERFIL) */}
      <div className="bg-white p-6 rounded-b-[40px] shadow-sm mb-4">
        <h1 className="text-2xl font-black italic uppercase text-slate-800 mb-5 tracking-tighter">
          Mis Trayectos
        </h1>
        
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] gap-1">
          <button 
            onClick={() => setSubVista("pasajero")}
            className={`flex-1 py-3.5 rounded-[18px] flex items-center justify-center gap-2 text-[10px] font-black uppercase italic transition-all ${
              subVista === "pasajero" ? "bg-white text-blue-600 shadow-md scale-[1.02]" : "text-slate-400"
            }`}
          >
            <User size={14} /> Soy Pasajero
          </button>
          <button 
            onClick={() => setSubVista("chofer")}
            className={`flex-1 py-3.5 rounded-[18px] flex items-center justify-center gap-2 text-[10px] font-black uppercase italic transition-all ${
              subVista === "chofer" ? "bg-white text-blue-600 shadow-md scale-[1.02]" : "text-slate-400"
            }`}
          >
            <Car size={14} /> Soy Chofer
          </button>
        </div>
      </div>

      <div className="px-4 space-y-6">
        <div className="space-y-4">
          {subVista === "chofer" ? (
            misPublicaciones.length > 0 ? (
              misPublicaciones.map(viaje => (
                <CardChofer 
                  key={viaje.id} 
                  viaje={viaje} 
                  onEdit={onEditarViaje} 
                  onDelete={onEliminarViaje}
                  onAceptar={onAceptarPasajero}
                  onRechazar={onRechazarPasajero}
                />
              ))
            ) : <EmptyState msg="No has publicado rutas" />
          ) : (
            viajesComoPasajero.length > 0 ? (
              viajesComoPasajero.map(viaje => (
                <CardPasajero key={viaje.id} viaje={viaje} myId={userData?.id} />
              ))
            ) : <EmptyState msg="No has pedido colas aún" />
          )}
        </div>

        {showModalEdicion && (
  <div className="fixed inset-0 bg-black/50 flex items-end z-50">
    <div className="bg-white w-full rounded-t-3xl p-6 animate-slide-up">
      <h3 className="text-xl font-bold mb-4">Editar Detalles</h3>
      
      <p className="text-sm text-slate-500 mb-4">
        Editando: {viajeAEditarRapido.origen} → {viajeAEditarRapido.destino}
      </p>

      <div className="space-y-4">
        {/* Input de Precio */}
        <div>
          <label className="text-xs font-bold text-slate-400">PRECIO ($)</label>
          <input 
            type="number" 
            className="w-full border-b-2 py-2 text-lg outline-none"
            defaultValue={viajeAEditarRapido.precio}
            onChange={(e) => setViajeAEditarRapido({...viajeAEditarRapido, precio: e.target.value})}
          />
        </div>

        {/* Inputs de Fecha y Hora (puedes reusar tus DatePickers) */}
        {/* ... */}

        <button 
          onClick={() => actualizarDetallesViaje(viajeAEditarRapido.id, viajeAEditarRapido)}
          className="w-full bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg mt-4"
        >
          Guardar Cambios
        </button>
        
        <button 
          onClick={() => setShowModalEdicion(false)}
          className="w-full text-slate-400 font-bold py-2 mt-2"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}
        

        {/* SECCIÓN DE HISTORIAL */}
        {historial.length > 0 && (
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 px-2 mb-4">
              <History size={14} className="text-slate-400" />
              <h3 className="text-[10px] font-black uppercase text-slate-400 italic tracking-widest">Historial Reciente</h3>
            </div>
            <div className="space-y-3 opacity-60">
              {historial.map(v => (
                <div key={v.id} className="bg-white/50 p-4 rounded-[25px] border border-dashed border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="text-[11px] font-black italic text-slate-600 uppercase">{v.origen?.split(',')[0]} → {v.destino?.split(',')[0]}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{v.fecha?.split('T')[0]}</p>
                  </div>
                  <span className="flex items-center gap-1 text-[8px] font-black text-green-500 uppercase italic">
                    <CheckCircle2 size={12}/> Finalizado
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// --- CARDS INTERNAS ---

const CardChofer = ({ viaje, onEdit, onDelete, onAceptar, onRechazar }) => (
  <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
    <div className="flex justify-between items-start">
      <div className="flex-1 pr-2">
        <span className="bg-blue-50 text-blue-600 text-[8px] font-black px-2 py-1 rounded-lg uppercase italic mb-2 inline-block tracking-widest">Publicación Activa</span>
        <h4 className="text-sm font-black italic text-slate-800 uppercase leading-tight">
          {viaje.origen?.split(',')[0]} → {viaje.destino?.split(',')[0]}
        </h4>
        <div className="flex items-center gap-3 mt-1.5">
          <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
            <Calendar size={10}/> {viaje.fecha?.split('T')[0]}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
            <Clock size={10}/> {viaje.hora}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setViajeAEditarRapido(viaje); setShowModalEdicion(true); }}
        <button onClick={() => onDelete(viaje.id)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl active:text-red-600 active:bg-red-50 transition-all"><Trash2 size={16}/></button>
      </div>
    </div>

    {/* GESTIÓN DE PASAJEROS PENDIENTES */}
    {viaje.reservasPendientes?.length > 0 && (
      <div className="bg-amber-50 p-4 rounded-[24px] border border-amber-100 space-y-3">
        <p className="text-[9px] font-black text-amber-600 uppercase flex items-center gap-2 italic">
          <AlertCircle size={12} /> Solicitudes por aprobar
        </p>
        {viaje.reservasPendientes.map(p => (
          <div key={p.id} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-amber-50">
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                {p.nombre?.[0]}
              </div>
              <span className="text-[10px] font-black italic text-slate-700">{p.nombre}</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onAceptar(viaje.id, p)} className="p-2 bg-green-500 text-white rounded-lg shadow-sm active:scale-90 transition-all"><CheckCircle2 size={14}/></button>
              <button onClick={() => onRechazar(viaje.id, p)} className="p-2 bg-slate-100 text-slate-400 rounded-lg active:scale-90 transition-all"><X size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const CardPasajero = ({ viaje, myId }) => {
  const isConfirmado = viaje.pasajeros?.some(p => p.id === myId);
  return (
    <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm transition-all hover:border-blue-100">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xs font-black italic text-slate-800 uppercase">{viaje.origen?.split(',')[0]} → {viaje.destino?.split(',')[0]}</h4>
        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg italic ${isConfirmado ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
          {isConfirmado ? 'Confirmado' : 'En Espera'}
        </span>
      </div>
      <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase italic">
        <span className="flex items-center gap-1"><Calendar size={12} className="text-blue-400"/> {viaje.fecha?.split('T')[0]}</span>
        <span className="flex items-center gap-1"><User size={12} className="text-blue-400"/> {viaje.conductor}</span>
      </div>
    </div>
  );
};

const EmptyState = ({ msg }) => (
  <div className="text-center py-16 bg-white rounded-[40px] border border-dashed border-slate-200">
    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
        <History size={20} />
    </div>
    <p className="text-slate-400 font-black italic uppercase text-[10px] tracking-widest leading-none">{msg}</p>
  </div>
);
