import React from 'react';
import { MapPin, Navigation, Users, DollarSign, Clock, ShieldCheck, Check } from 'lucide-react';

export const WizardPublicar = ({ 
  pasoWizard, setPasoWizard, viajeForm, setViajeForm, UBICACIONES, setVista, setModo, publicarRuta,
  viajeEditando // <--- TIENE QUE ESTAR AQUÍ
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

  // PASO 2: PRECIO Y ASIENTOS
  if (pasoWizard === 2) {
    return (
      <div className="bg-white p-7 rounded-[40px] border shadow-sm space-y-6 animate-in slide-in-from-right">
        <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">Detalles del<br/>Viaje</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100">
            <p className="text-[8px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1"><DollarSign size={10}/> Precio</p>
            <input type="number" className="bg-transparent w-full text-xl font-black italic outline-none text-blue-600" value={viajeForm.precio} onChange={(e) => setViajeForm({...viajeForm, precio: e.target.value})} />
          </div>
          <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100">
            <p className="text-[8px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1"><Users size={10}/> Asientos</p>
            <input type="number" className="bg-transparent w-full text-xl font-black italic outline-none text-slate-700" value={viajeForm.asientos} onChange={(e) => setViajeForm({...viajeForm, asientos: e.target.value})} />
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100">
          <p className="text-[8px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1"><Clock size={10}/> Hora de salida</p>
          <input type="time" className="bg-transparent w-full text-sm font-bold outline-none text-slate-700" value={viajeForm.horaSalida} onChange={(e) => setViajeForm({...viajeForm, horaSalida: e.target.value})} />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setPasoWizard(1)} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase italic text-[9px]">Atrás</button>
          <button onClick={() => setPasoWizard(3)} disabled={!viajeForm.precio || !viajeForm.horaSalida} className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase italic text-[9px] shadow-lg">Siguiente</button>
        </div>
      </div>
    );
  }

   // PASO 3: PREFERENCIAS Y PUBLICAR
  return (
    <div className="bg-white p-7 rounded-[40px] border shadow-sm space-y-6 animate-in slide-in-from-right">
      <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">Preferencias</h2>
      
      <div className="grid grid-cols-2 gap-3">
        {/* AGREGAMOS EL ?. PARA QUE NO EXPLOTE SI PREFERENCIAS ES NULL */}
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
            {/* TRADUCCIÓN SIMPLE PARA QUE NO SE VEA EL NOMBRE TÉCNICO */}
            {pref === 'ac' ? 'Aire Acond.' : 
             pref === 'noFumar' ? 'No Fumar' : 
             pref === 'mascotas' ? 'Mascotas' : 
             pref === 'maxDosAtras' ? 'Máx. 2 Atrás' : pref} 
            
            {viajeForm.preferencias[pref] && <Check size={12}/>}
          </button>
        ))}
      </div>

      <button 
  onClick={() => {
    // 1. Inyectamos la foto y datos del usuario al formulario antes de enviar
    setViajeForm({
      ...viajeForm,
      fotoPerfil: userData?.fotoPerfil || "", 
      conductor: userData?.nombre || "Conductor",
      uidConductor: userData?.id || ""
    });
    
    // 2. Ejecutamos la función de publicar que ya tenías
    publicarRuta();
  }} 
  disabled={!viajeForm.origen || !viajeForm.destino}
  className={`w-full py-5 ${viajeEditando ? 'bg-blue-600' : 'bg-green-500'} text-white rounded-[25px] font-black uppercase italic text-xs shadow-xl flex items-center justify-center gap-2`}
>
  {viajeEditando ? (
    <><Check size={18}/> Guardar Cambios</>
  ) : (
    <><ShieldCheck size={18}/> ¡Publicar Ruta Ahora!</>
  )}
</button>
      
      <button onClick={() => setPasoWizard(2)} className="w-full text-[9px] font-black uppercase text-slate-400 italic">Revisar detalles</button>
    </div>
  );
};
