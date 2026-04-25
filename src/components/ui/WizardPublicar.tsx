import React from 'react';
import { MapPin, Navigation, Users, DollarSign, Clock, ShieldCheck, Check } from 'lucide-react';

export const WizardPublicar = ({ 
  pasoWizard, setPasoWizard, viajeForm, setViajeForm, UBICACIONES, setVista, setModo, publicarRuta,
  viajeEditando, userData // <--- AGREGAMOS userData AQUÍ
}) => {
  
  // PASO 1: UBICACIONES
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

// PASO 2: FECHA, HORA, PRECIO Y ASIENTOS (CON OPCIÓN DE REGRESO)
if (pasoWizard === 2) {
  return (
    <div className="bg-white p-7 rounded-[40px] border shadow-sm space-y-6 animate-in slide-in-from-right">
      <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">Detalles del<br/>Viaje</h2>
      
      {/* SECCIÓN FECHA Y HORA */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100 focus-within:border-blue-400 transition-colors">
          <p className="text-[8px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1"><Clock size={10}/> Fecha de Ida</p>
          <input 
            type="date" 
            className="bg-transparent w-full text-[11px] font-black outline-none text-slate-700" 
            value={viajeForm.fechaSalida} 
            onChange={(e) => setViajeForm({...viajeForm, fechaSalida: e.target.value})} 
          />
        </div>
        <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100 focus-within:border-blue-400 transition-colors">
          <p className="text-[8px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1"><Clock size={10}/> Hora</p>
          <input 
            type="time" 
            className="bg-transparent w-full text-[11px] font-black outline-none text-slate-700" 
            value={viajeForm.horaSalida} 
            onChange={(e) => setViajeForm({...viajeForm, horaSalida: e.target.value})} 
          />
        </div>
      </div>

      {/* SECCIÓN PRECIO Y ASIENTOS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100">
          <p className="text-[8px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1"><DollarSign size={10}/> Precio $</p>
          <input type="number" className="bg-transparent w-full text-xl font-black italic outline-none text-blue-600" value={viajeForm.precio} onChange={(e) => setViajeForm({...viajeForm, precio: e.target.value})} />
        </div>
        <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100">
          <p className="text-[8px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1"><Users size={10}/> Asientos</p>
          <input type="number" className="bg-transparent w-full text-xl font-black italic outline-none text-slate-700" value={viajeForm.asientos} onChange={(e) => setViajeForm({...viajeForm, asientos: e.target.value})} />
        </div>
      </div>

      {/* INTERRUPTOR DE REGRESO (ESTILO DAME LA COLA) */}
      <button 
        onClick={() => setViajeForm({...viajeForm, publicarRegreso: !viajeForm.publicarRegreso})}
        className={`w-full p-4 rounded-[25px] border-2 transition-all flex items-center justify-between ${viajeForm.publicarRegreso ? 'border-green-500 bg-green-50 shadow-lg shadow-green-50' : 'border-slate-100 bg-white'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-5 rounded-full relative transition-colors ${viajeForm.publicarRegreso ? 'bg-green-500' : 'bg-slate-200'}`}>
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${viajeForm.publicarRegreso ? 'left-6' : 'left-1'}`} />
          </div>
          <span className="text-[10px] font-black uppercase italic text-slate-700">¿Publicar viaje de regreso?</span>
        </div>
        {viajeForm.publicarRegreso && <Check size={16} className="text-green-600"/>}
      </button>

      {/* FORMULARIO DE REGRESO (Aparece con animación) */}
      {viajeForm.publicarRegreso && (
        <div className="p-5 bg-blue-600 rounded-[30px] space-y-3 animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[9px] font-black uppercase text-white italic tracking-widest">Planifica tu Vuelta</p>
            <span className="text-[8px] font-bold text-blue-200 uppercase bg-blue-700 px-2 py-1 rounded-lg">
              {viajeForm.destino?.split(',')[0] || "Destino"} ➔ {viajeForm.origen?.split(',')[0] || "Origen"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/20">
              <p className="text-[7px] font-black uppercase text-blue-100 mb-1">Fecha Regreso</p>
              <input 
                type="date" 
                className="bg-transparent w-full text-[10px] font-bold text-white outline-none" 
                value={viajeForm.fechaRegreso} 
                onChange={(e) => setViajeForm({...viajeForm, fechaRegreso: e.target.value})} 
              />
            </div>
            <div className="bg-white/10 p-3 rounded-2xl border border-white/20">
              <p className="text-[7px] font-black uppercase text-blue-100 mb-1">Hora Regreso</p>
              <input 
                type="time" 
                className="bg-transparent w-full text-[10px] font-bold text-white outline-none" 
                value={viajeForm.horaRegreso} 
                onChange={(e) => setViajeForm({...viajeForm, horaRegreso: e.target.value})} 
              />
            </div>
          </div>
        </div>
      )}

      {/* BOTONES DE NAVEGACIÓN */}
      <div className="flex gap-3">
        <button onClick={() => setPasoWizard(1)} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase italic text-[9px]">Atrás</button>
        <button 
          onClick={() => setPasoWizard(3)} 
          disabled={!viajeForm.precio || !viajeForm.fechaSalida || !viajeForm.horaSalida} 
          className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase italic text-[9px] shadow-lg active:scale-95 transition-transform"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
  

   // PASO 3: PREFERENCIAS Y PUBLICAR
  return (
    <div className="bg-white p-7 rounded-[40px] border shadow-sm space-y-6 animate-in slide-in-from-right">
      <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">Preferencias</h2>
      
      <div className="grid grid-cols-2 gap-3">
        {viajeForm?.preferencias && Object.keys(viajeForm.preferencias).map((pref) => (
          <button 
            key={pref}
            onClick={() => setViajeForm({
              ...viajeForm, 
              preferencias: {
                ...viajeForm.preferencias, 
                [pref]: !viajeForm.preferencias[pref]
              }
            })}
            className={`p-3 rounded-2xl border-2 text-[9px] font-black uppercase italic flex items-center justify-between ${viajeForm.preferencias[pref] ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'}`}
          >
            {pref === 'ac' ? 'Aire Acond.' : 
             pref === 'noFumar' ? 'No Fumar' : 
             pref === 'mascotas' ? 'Mascotas' : 
             pref === 'maxDosAtras' ? 'Máx. 2 Atrás' : pref} 
            
            {viajeForm.preferencias[pref] && <Check size={12}/>}
          </button>
        ))}
      </div>

      <button 
  onClick={async () => {
    // 1. Verificación de seguridad
    if (!userData?.id) {
      alert("Error: Inicia sesión para publicar");
      return;
    }

    // Función auxiliar para no repetir código al publicar
    const enviarAFirebase = async (objetoViaje) => {
      try {
        await publicarRuta(objetoViaje);
      } catch (error) {
        console.error("Error publicando:", error);
      }
    };

    // 2. PREPARAR VIAJE DE IDA
    const viajeIda = {
      ...viajeForm,
      idCreador: userData.id,
      uidConductor: userData.id,
      fotoPerfil: userData?.fotoPerfil || "", 
      conductor: userData?.nombre || "Luis Raúl",
      bioConductor: userData?.bio || "",
      prefHablador: userData?.prefHablador ?? true,
      prefMusica: userData?.prefMusica ?? true,
      estado: "disponible",
      // Datos específicos de la IDA
      fecha: viajeForm.fechaSalida, 
      hora: viajeForm.horaSalida,
      tipoRuta: viajeForm.publicarRegreso ? "ida_y_vuelta" : "solo_ida"
    };

    // PUBLICAMOS LA IDA
    await enviarAFirebase(viajeIda);

    // 3. PREPARAR VIAJE DE VUELTA (Si activó el switch)
    if (viajeForm.publicarRegreso && viajeForm.fechaRegreso && viajeForm.horaRegreso) {
      const viajeVuelta = {
        ...viajeIda, // Copiamos preferencias, fotos y conductor
        origen: viajeForm.destino, // INVERTIMOS: El destino ahora es el origen
        destino: viajeForm.origen, // INVERTIMOS: El origen ahora es el destino
        fecha: viajeForm.fechaRegreso, // Fecha de vuelta
        hora: viajeForm.horaRegreso,   // Hora de vuelta
        tipoRuta: "vuelta_de_ruta"
      };

      // PUBLICAMOS LA VUELTA
      await enviarAFirebase(viajeVuelta);
    }

    // 4. FEEDBACK FINAL
    alert(viajeForm.publicarRegreso 
      ? "✅ ¡Se han publicado tus rutas de ida y vuelta con éxito!" 
      : "✅ ¡Ruta de ida publicada con éxito!"
    );
  }}
  disabled={!viajeForm.origen || !viajeForm.destino || !viajeForm.fechaSalida}
  className="w-full mt-6 py-5 bg-green-500 text-white rounded-[25px] font-black uppercase italic text-sm shadow-xl shadow-green-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
>
  <ShieldCheck size={20} />
  ¡Publicar Ruta Ahora!
</button>
        
      

      <button onClick={() => setPasoWizard(2)} className="w-full text-[9px] font-black uppercase text-slate-400 italic">
        Revisar detalles
      </button>
    </div>
  );
};
