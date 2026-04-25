import React from 'react';
import { MapPin, Navigation, Users, DollarSign, Clock, ShieldCheck, Check, Briefcase, Zap } from 'lucide-react';

export const WizardPublicar = ({ 
  pasoWizard, setPasoWizard, viajeForm, setViajeForm, UBICACIONES, setVista, setModo, publicarRuta,
  viajeEditando, userData 
}) => {
  
  // FECHA MÍNIMA (Hoy)
  const hoy = new Date().toISOString().split('T')[0];

  // PASO 1: UBICACIONES (Se mantiene igual)
  if (pasoWizard === 1) {
    return (
      <div className="bg-white p-7 rounded-[40px] border shadow-sm space-y-5 animate-in slide-in-from-right">
        <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">
          {viajeEditando ? <>Edita tu<br/>Ruta Actual</> : <>¿Hacia dónde<br/>vas a manejar?</>}
        </h2>
        <div className="space-y-4">
          <div className="relative">
            <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-[25px] border border-slate-100 focus-within:border-blue-400">
              <MapPin size={22} className="text-blue-600"/>
              <input type="text" placeholder="Punto de salida (Ej. Valencia)" className="bg-transparent w-full text-sm font-bold outline-none text-slate-700" value={viajeForm.origen} onChange={(e) => setViajeForm({...viajeForm, origen: e.target.value})} />
            </div>
            {viajeForm.origen.length > 1 && !viajeForm.origen.includes(',') && (
              <div className="absolute z-[100] w-full bg-white border rounded-2xl mt-1 shadow-2xl max-h-48 overflow-y-auto">
                {Object.keys(UBICACIONES).flatMap(estado => UBICACIONES[estado].filter(ciudad => ciudad.toLowerCase().includes(viajeForm.origen.toLowerCase())).map(ciudad => (
                  <button key={`ori-${estado}-${ciudad}`} onClick={() => setViajeForm({...viajeForm, origen: `${ciudad}, ${estado}`})} className="w-full text-left p-4 hover:bg-blue-50 border-b last:border-0 text-[11px] font-black uppercase italic flex items-center gap-3"><MapPin size={14} className="text-blue-400"/> {ciudad}, {estado}</button>
                ))).slice(0, 5)}
              </div>
            )}
          </div>
          <div className="relative">
            <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-[25px] border border-slate-100 focus-within:border-green-400">
              <Navigation size={22} className="text-green-600"/>
              <input type="text" placeholder="Punto de llegada (Ej. Caracas)" className="bg-transparent w-full text-sm font-bold outline-none text-slate-700" value={viajeForm.destino} onChange={(e) => setViajeForm({...viajeForm, destino: e.target.value})} />
            </div>
            {viajeForm.destino.length > 1 && !viajeForm.destino.includes(',') && (
              <div className="absolute z-[100] w-full bg-white border rounded-2xl mt-1 shadow-2xl max-h-48 overflow-y-auto">
                {Object.keys(UBICACIONES).flatMap(estado => UBICACIONES[estado].filter(ciudad => ciudad.toLowerCase().includes(viajeForm.destino.toLowerCase())).map(ciudad => (
                  <button key={`dest-${estado}-${ciudad}`} onClick={() => setViajeForm({...viajeForm, destino: `${ciudad}, ${estado}`})} className="w-full text-left p-4 hover:bg-blue-50 border-b last:border-0 text-[11px] font-black uppercase italic flex items-center gap-3"><Navigation size={14} className="text-green-400"/> {ciudad}, {estado}</button>
                ))).slice(0, 5)}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setVista("inicio"); setModo("pasajero"); }} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase italic text-[9px]">Buscar</button>
          <button onClick={() => setPasoWizard(2)} disabled={!viajeForm.origen || !viajeForm.destino} className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase italic text-[9px] shadow-lg">Siguiente</button>
        </div>
      </div>
    );
  }

    if (pasoWizard === 2) {
    return (
      <div className="bg-white p-7 rounded-[40px] border shadow-sm space-y-5 animate-in slide-in-from-right">
        <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">Detalles del<br/>Viaje</h2>
        
        {/* SECCIÓN FECHA Y HORA */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100">
            <p className="text-[8px] font-black uppercase text-slate-400 mb-2">📅 Fecha Ida</p>
            <input 
              type="date" 
              min={hoy} 
              className="bg-transparent w-full text-[11px] font-black outline-none" 
              value={viajeForm.fechaSalida} 
              onChange={(e) => setViajeForm({...viajeForm, fechaSalida: e.target.value})} 
            />
          </div>
          <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100">
            <p className="text-[8px] font-black uppercase text-slate-400 mb-2">⏰ Hora</p>
            <input type="time" className="bg-transparent w-full text-[11px] font-black outline-none" value={viajeForm.horaSalida} onChange={(e) => setViajeForm({...viajeForm, horaSalida: e.target.value})} />
          </div>
        </div>

        {/* SECCIÓN PRECIO Y ASIENTOS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100">
            <p className="text-[8px] font-black uppercase text-slate-400 mb-2">💰 Precio $</p>
            <input type="number" className="bg-transparent w-full text-xl font-black italic outline-none text-blue-600" value={viajeForm.precio} onChange={(e) => setViajeForm({...viajeForm, precio: e.target.value})} />
          </div>
          <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100">
            <p className="text-[8px] font-black uppercase text-slate-400 mb-2">🪑 Asientos</p>
            <input type="number" className="bg-transparent w-full text-xl font-black italic outline-none text-slate-700" value={viajeForm.asientos} onChange={(e) => setViajeForm({...viajeForm, asientos: e.target.value})} />
          </div>
        </div>

        {/* PREFERENCIAS RÁPIDAS (Solo lo necesario) */}
        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">Comodidades</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'ac', icon: '❄️', label: 'Aire A.' },
              { id: 'noFumar', icon: '🚭', label: 'Sin Humo' },
              { id: 'mascotas', icon: '🐾', label: 'Mascotas' },
            ].map((pref) => (
              <button 
                key={pref.id}
                onClick={() => setViajeForm({
                  ...viajeForm, 
                  preferencias: {
                    ...viajeForm.preferencias, 
                    [pref.id]: !viajeForm.preferencias?.[pref.id]
                  }
                })}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${viajeForm.preferencias?.[pref.id] ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-50 opacity-60 text-slate-500'}`}
              >
                <span className="text-xl">{pref.icon}</span>
                <span className="text-[8px] font-black uppercase text-center leading-tight">{pref.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* INTERRUPTOR DE REGRESO */}
        <button 
          onClick={() => setViajeForm({...viajeForm, publicarRegreso: !viajeForm.publicarRegreso})}
          className={`w-full p-4 rounded-[25px] border-2 transition-all flex items-center justify-between ${viajeForm.publicarRegreso ? 'border-green-500 bg-green-50' : 'border-slate-100'}`}
        >
          <span className="text-[10px] font-black uppercase italic">¿Publicar viaje de regreso?</span>
          <div className={`w-10 h-5 rounded-full relative transition-colors ${viajeForm.publicarRegreso ? 'bg-green-500' : 'bg-slate-200'}`}>
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${viajeForm.publicarRegreso ? 'left-6' : 'left-1'}`} />
          </div>
        </button>

        {viajeForm.publicarRegreso && (
          <div className="p-5 bg-blue-600 rounded-[30px] space-y-3 animate-in slide-in-from-top">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-white">
                <p className="text-[7px] font-black uppercase mb-1">Fecha Regreso</p>
                <input type="date" min={viajeForm.fechaSalida || hoy} className="bg-transparent w-full text-[10px] font-bold outline-none" value={viajeForm.fechaRegreso} onChange={(e) => setViajeForm({...viajeForm, fechaRegreso: e.target.value})} />
              </div>
              <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-white">
                <p className="text-[7px] font-black uppercase mb-1">Hora Regreso</p>
                <input type="time" className="bg-transparent w-full text-[10px] font-bold outline-none" value={viajeForm.horaRegreso} onChange={(e) => setViajeForm({...viajeForm, horaRegreso: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => setPasoWizard(1)} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase italic text-[9px]">Atrás</button>
          <button onClick={() => setPasoWizard(3)} disabled={!viajeForm.precio || !viajeForm.fechaSalida} className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase italic text-[9px] shadow-lg active:scale-95">Siguiente</button>
        </div>
      </div>
    );
    }
  

  // PASO 3: PREFERENCIAS, EQUIPAJE Y REFERENCIA
  return (
    <div className="bg-white p-7 rounded-[40px] border shadow-sm space-y-6 animate-in slide-in-from-right">
      <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">Ajustes Finales</h2>
      
      {/* REFERENCIA */}
      <div className="space-y-1">
        <p className="text-[9px] font-black uppercase text-slate-400 ml-2">Punto de encuentro / Referencia</p>
        <textarea 
          rows={2}
          placeholder="Ej: Frente al Farmatodo de la redoma..." 
          className="bg-slate-50 w-full p-4 rounded-[25px] border border-slate-100 text-[11px] font-bold outline-none resize-none"
          value={viajeForm.referencia} 
          onChange={(e) => setViajeForm({...viajeForm, referencia: e.target.value})} 
        />
      </div>

      {/* EQUIPAJE */}
      <div className="space-y-1">
        <p className="text-[9px] font-black uppercase text-slate-400 ml-2">Equipaje permitido</p>
        <div className="grid grid-cols-3 gap-2">
          {[{id:'ligero', i:'🎒'}, {id:'medio', i:'🧳'}, {id:'pesado', i:'📦'}].map(eq => (
            <button 
              key={eq.id}
              onClick={() => setViajeForm({...viajeForm, equipaje: eq.id})}
              className={`p-3 rounded-2xl border-2 transition-all ${viajeForm.equipaje === eq.id ? 'border-blue-600 bg-blue-50' : 'border-slate-50'}`}
            >
              <span className="text-xl">{eq.i}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AUTO ACEPTAR */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[25px] border border-slate-100">
        <div>
          <p className="text-[10px] font-black uppercase text-slate-700">Reserva Automática</p>
          <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Aceptar cola sin preguntar</p>
        </div>
        <button 
          onClick={() => setViajeForm({...viajeForm, autoAceptar: !viajeForm.autoAceptar})}
          className={`w-10 h-5 rounded-full relative transition-colors ${viajeForm.autoAceptar ? 'bg-green-500' : 'bg-slate-300'}`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${viajeForm.autoAceptar ? 'left-6' : 'left-1'}`} />
        </button>
      </div>

<button 
  onClick={async () => {
    if (!userData?.id) return alert("Inicia sesión");
    
    const publicarViaje = async (obj) => { 
      try { await publicarRuta(obj); } catch(e) { console.error(e); } 
    };

    // 1. Limpiamos las ciudades para la base de datos
    const [ciudadOri] = viajeForm.origen.split(', ');
    const [ciudadDest] = viajeForm.destino.split(', ');

    // 2. Definimos el objeto base (Ida)
    const base = {
      ...viajeForm, // Aquí ya viaja 'referencia', 'equipaje', 'preferencias', etc.
      idCreador: userData.id,
      uidConductor: userData.id,
      fotoPerfil: userData?.fotoPerfil || "",
      conductor: userData?.nombre || "Usuario",
      bio: userData?.bio || "", 
      estado: "disponible",
      cO: ciudadOri || viajeForm.origen, 
      cD: ciudadDest || viajeForm.destino,
      fecha: viajeForm.fechaSalida,
      hora: viajeForm.horaSalida,
      // Si hay regreso, marcamos esta como 'ida_y_vuelta' para mostrar el aviso verde
      tipoRuta: viajeForm.publicarRegreso ? "ida_y_vuelta" : "solo_ida"
    };

    // 3. Publicamos el viaje de Ida
    await publicarViaje(base);

    // 4. Si el usuario marcó regreso, publicamos el segundo viaje (Vuelta)
    if (viajeForm.publicarRegreso) {
      await publicarViaje({
        ...base,
        cO: ciudadDest || viajeForm.destino, // Invertimos Origen
        cD: ciudadOri || viajeForm.origen,    // Invertimos Destino
        origen: viajeForm.destino,
        destino: viajeForm.origen,
        fecha: viajeForm.fechaRegreso,
        hora: viajeForm.horaRegreso,
        // Marcamos como 'vuelta_de_ruta' para que NO salga el aviso verde aquí
        tipoRuta: "vuelta_de_ruta" 
      });
    }

    alert("✅ ¡Viaje publicado con éxito!");
    setVista("inicio");
  }}
  className="w-full py-5 bg-green-500 text-white rounded-[25px] font-black uppercase italic text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95"
>
  <ShieldCheck size={20} /> ¡Publicar Ahora!
</button>
      
      
      <button onClick={() => setPasoWizard(2)} className="w-full text-[9px] font-black uppercase text-slate-400 italic">Atrás</button>
    </div>
  );
};
