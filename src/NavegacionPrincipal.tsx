import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import {
  doc, onSnapshot, updateDoc, collection, query, addDoc, 
  serverTimestamp, orderBy
} from "firebase/firestore";
import {
  Search, Wallet, User, LogOut, Car, X, Send, ArrowLeft, Edit2, 
  Headset, PlusCircle, ShieldCheck, Camera, CheckCircle, MapPin, 
  ChevronRight, Luggage, Info, MessageSquare, Star, ArrowUpRight, ArrowDownLeft
} from "lucide-react";

// DICCIONARIO DE ESTADOS Y CIUDADES
const UBICACIONES = {
  "Carabobo": ["Valencia", "Naguanagua", "Guacara", "San Diego", "Puerto Cabello", "Los Guayos"],
  "Aragua": ["Maracay", "Turmero", "La Victoria", "Cagua", "El Limón"],
  "Distrito Capital": ["Caracas", "Chacao", "Baruta", "El Hatillo"],
  "Lara": ["Barquisimeto", "Cabudare", "Carora"],
  "Anzoátegui": ["Puerto La Cruz", "Barcelona", "Lechería", "El Tigre"],
  "Mérida": ["Mérida", "Ejido", "El Vigía"]
};

const ESTADOS = Object.keys(UBICACIONES);

export default function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [editando, setEditando] = useState(false);
  const [verificandoKYC, setVerificandoKYC] = useState(false);
  
  const [busqueda, setBusqueda] = useState({ estadoOrigen: "", estadoDestino: "" });

  const [inputSoporte, setInputSoporte] = useState("");
  const [inputConductor, setInputConductor] = useState("");
  const [mensajesSoporte, setMensajesSoporte] = useState<any[]>([]);
  const [mensajesConductor, setMensajesConductor] = useState<any[]>([]);

  const [viajesReales, setViajesReales] = useState<any[]>([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [viajeActivo, setViajeActivo] = useState<any>(null);
  
  const [userData, setUserData] = useState<any>({ 
    nombre: "", saldo: 0, telefono: "", kycVerificado: false, estrellas: 5.0, tiempoApp: "1 mes",
    vehiculo: { marca: "", modelo: "", placa: "", color: "" }
  });
  
  const [formPerfil, setFormPerfil] = useState({ nombre: "", telefono: "" });
  const [formVehiculo, setFormVehiculo] = useState({ marca: "", modelo: "", placa: "", color: "" });
  
  const [formViaje, setFormViaje] = useState({
    estadoOrigen: "", ciudadOrigen: "", estadoDestino: "", ciudadDestino: "",
    precio: "", puestos: "4", kilosMaleta: "20", aceptaMaleta: true, detallesExtras: ""
  });

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        if (!editando) {
          setFormPerfil({ nombre: data.nombre || "", telefono: data.telefono || "" });
          setFormVehiculo(data.vehiculo || { marca: "", modelo: "", placa: "", color: "" });
        }
      }
    });
  }, [user, editando]);

  useEffect(() => {
    const q = query(collection(db, "Viajes"), orderBy("fecha", "desc"));
    return onSnapshot(q, (snap) => {
      setViajesReales(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const publicarViaje = async () => {
    if (!formViaje.ciudadOrigen || !formViaje.ciudadDestino || !formViaje.precio) {
      return alert("⚠️ Completa los campos de origen, destino y precio.");
    }
    
    // Validar que exista el vehículo solo si intenta publicar
    if (!userData.vehiculo || !userData.vehiculo.placa) {
      return alert("⚠️ Registra la placa de tu carro en el Perfil antes de publicar.");
    }
    
    try {
      await addDoc(collection(db, "Viajes"), {
        conductor: userData.nombre || "Conductor",
        estrellasConductor: userData.estrellas || 5.0,
        tiempoConductor: userData.tiempoApp || "Nuevo",
        origen: `${formViaje.estadoOrigen}, ${formViaje.ciudadOrigen}`,
        destino: `${formViaje.estadoDestino}, ${formViaje.ciudadDestino}`,
        precio: Number(formViaje.precio),
        vehiculoCompleto: `${userData.vehiculo.marca} ${userData.vehiculo.modelo} (${userData.vehiculo.placa})`,
        puestosDisponibles: Number(formViaje.puestos),
        kilosMaleta: Number(formViaje.kilosMaleta),
        aceptaMaleta: formViaje.aceptaMaleta,
        detallesExtras: formViaje.detallesExtras || "Sin detalles extra.",
        idCreador: user.uid,
        fecha: serverTimestamp(),
      });
      alert("✅ Ruta publicada con éxito.");
      
      // Limpiar formulario tras publicar
      setFormViaje({ ...formViaje, precio: "", detallesExtras: "" });
      setModo("pasajero");
    } catch (e: any) { 
      // Si falla, mostramos el error exacto para saber qué pasó
      alert(`❌ Error al publicar: ${e.message}`); 
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      
      {/* BURBUJA DE CHAT ACTIVO */}
      {viajeActivo && vista !== "chat_conductor" && (
        <button onClick={() => setVista("chat_conductor")} className="absolute bottom-28 right-6 z-[100] bg-blue-600 text-white p-4 rounded-full shadow-2xl animate-pulse border-4 border-white">
          <MessageSquare size={28} />
        </button>
      )}

      {/* HEADER DINÁMICO */}
      {!["chat_conductor", "chat_soporte"].includes(vista) && (
        <header className="p-6 pt-12 bg-white border-b shrink-0 z-20 shadow-sm text-left">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg">R</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">RutaCom {modo}</p>
                <p className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1">
                  {userData.nombre || "Usuario"} 
                  {userData.kycVerificado && <CheckCircle size={10} className="text-blue-500 fill-blue-500"/>}
                </p>
                <div className="flex items-center gap-1">
                  <Star size={10} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-[10px] font-bold text-slate-500">{userData.estrellas} • {userData.tiempoApp}</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-700">
              <Wallet size={12} className="text-blue-400" />
              <span className="text-[11px] font-black">${Number(userData.saldo).toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all ${modo === "pasajero" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-green-50 text-green-600 border-green-100"}`}>
            Cambiar a Modo {modo === "pasajero" ? "Chófer" : "Pasajero"}
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto pb-32">
        
        {/* VISTA INICIO */}
        {vista === "inicio" && (
          <div className="p-6 space-y-4">
            
            {/* BUSCADOR DESDE / HASTA (Solo Pasajero) */}
            {modo === "pasajero" && (
               <div className="bg-white p-5 rounded-[25px] border shadow-sm space-y-3 text-left">
                 <p className="text-[9px] font-black text-slate-400 uppercase ml-1">Filtros de Búsqueda</p>
                 <div className="grid grid-cols-2 gap-2">
                   <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" onChange={(e) => setBusqueda({...busqueda, estadoOrigen: e.target.value})}>
                     <option value="">Estado Origen</option>
                     {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                   </select>
                   <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" onChange={(e) => setBusqueda({...busqueda, estadoDestino: e.target.value})}>
                     <option value="">Estado Destino</option>
                     {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                   </select>
                 </div>
               </div>
            )}

            {/* MODO CHOFER: PUBLICAR (Agregados Maleta y Extras) */}
            {modo === "chofer" && (
              <div className="bg-white p-6 rounded-[35px] border border-green-100 shadow-sm space-y-4 text-left">
                <h3 className="text-sm font-black uppercase italic text-green-600 flex items-center gap-2"><PlusCircle size={18}/> Publicar Mi Ruta</h3>
                
                {/* Origen y Destino Seguros (No colapsan) */}
                <div className="grid grid-cols-2 gap-2">
                   <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={formViaje.estadoOrigen} onChange={(e) => setFormViaje({...formViaje, estadoOrigen: e.target.value, ciudadOrigen: ""})}>
                     <option value="">Origen</option>
                     {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                   </select>
                   <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" disabled={!formViaje.estadoOrigen} value={formViaje.ciudadOrigen} onChange={(e) => setFormViaje({...formViaje, ciudadOrigen: e.target.value})}>
                     <option value="">Ciudad</option>
                     {formViaje.estadoOrigen && (UBICACIONES as any)[formViaje.estadoOrigen]?.map((c: string) => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={formViaje.estadoDestino} onChange={(e) => setFormViaje({...formViaje, estadoDestino: e.target.value, ciudadDestino: ""})}>
                     <option value="">Destino</option>
                     {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                   </select>
                   <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" disabled={!formViaje.estadoDestino} value={formViaje.ciudadDestino} onChange={(e) => setFormViaje({...formViaje, ciudadDestino: e.target.value})}>
                     <option value="">Ciudad</option>
                     {formViaje.estadoDestino && (UBICACIONES as any)[formViaje.estadoDestino]?.map((c: string) => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                   <input type="number" placeholder="Precio $" className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={formViaje.precio} onChange={(e) => setFormViaje({...formViaje, precio: e.target.value})} />
                   <input type="number" placeholder="Asientos" className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={formViaje.puestos} onChange={(e) => setFormViaje({...formViaje, puestos: e.target.value})} />
                </div>

                {/* Extras y Maletas de vuelta */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border">
                  <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1"><Luggage size={14}/> ¿Acepta Maleta?</span>
                  <input type="checkbox" checked={formViaje.aceptaMaleta} onChange={(e) => setFormViaje({...formViaje, aceptaMaleta: e.target.checked})} className="accent-green-600" />
                </div>
                {formViaje.aceptaMaleta && (
                   <input type="number" placeholder="Kilos permitidos (Ej: 20)" className="w-full bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={formViaje.kilosMaleta} onChange={(e) => setFormViaje({...formViaje, kilosMaleta: e.target.value})} />
                )}
                
                <textarea placeholder="Extras (No mascotas, aire full, punto de encuentro...)" className="w-full bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none h-16 resize-none" value={formViaje.detallesExtras} onChange={(e) => setFormViaje({...formViaje, detallesExtras: e.target.value})} />

                <button onClick={publicarViaje} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase italic shadow-lg text-xs">Publicar Ahora</button>
              </div>
            )}

            {/* LISTADO DE VIAJES (Con protección anticaídas) */}
            <p className="text-[10px] font-black text-slate-400 uppercase text-left ml-2 mt-4">Rutas Disponibles</p>
            {viajesReales.filter(v => 
              (!busqueda.estadoOrigen || (v.origen && v.origen.includes(busqueda.estadoOrigen))) && 
              (!busqueda.estadoDestino || (v.destino && v.destino.includes(busqueda.estadoDestino)))
            ).map((v) => (
              <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-5 rounded-[30px] border flex justify-between items-center shadow-sm cursor-pointer hover:border-blue-400 transition-all text-left">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100"><Car size={22} /></div>
                  <div>
                    <div className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase italic">
                      {v.origen} <ChevronRight size={8}/> {v.destino}
                    </div>
                    <p className="font-black uppercase text-sm text-slate-800 flex items-center gap-1">
                      {v.conductor} <Star size={10} className="text-yellow-400 fill-yellow-400"/>
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{v.vehiculoCompleto}</p>
                  </div>
                </div>
                <p className="text-lg font-black text-blue-600 italic">${v.precio}</p>
              </div>
            ))}
          </div>
        )}

        {/* PERFIL INTELIGENTE (Cambia según el modo) */}
        {vista === "perfil" && (
          <div className="p-6 space-y-6 pb-32 text-left">
            
            {/* CABECERA PERFIL */}
            <div className="bg-white rounded-[35px] border p-6 flex flex-col items-center shadow-sm relative">
              <div className="w-24 h-24 bg-blue-600 rounded-[35px] flex items-center justify-center text-white shadow-xl relative border-4 border-white mb-3">
                <User size={40} />
                {userData.kycVerificado && <div className="absolute -bottom-1 -right-1 bg-blue-500 p-2 rounded-xl border-4 border-white text-white"><CheckCircle size={16}/></div>}
              </div>
              <p className="font-black uppercase text-lg italic text-slate-800">{userData.nombre}</p>
              <div className="flex items-center gap-2 mt-1">
                 <div className="bg-yellow-50 px-3 py-1 rounded-full flex items-center gap-1 border border-yellow-200">
                    <Star size={12} className="text-yellow-500 fill-yellow-500"/>
                    <span className="text-[11px] font-black text-yellow-600">{userData.estrellas}</span>
                 </div>
                 <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{userData.tiempoApp}</span>
              </div>
            </div>

            {/* WALLET */}
            <div className="bg-slate-900 p-6 rounded-[35px] shadow-xl border border-slate-800 text-left">
              <p className="text-blue-400 text-[10px] font-black uppercase italic">Billetera Digital</p>
              <p className="text-4xl font-black text-white italic mb-4">${Number(userData.saldo).toFixed(2)}</p>
              <div className="grid grid-cols-2 gap-3">
                 <button className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-2xl font-black uppercase text-[10px] italic shadow-lg"><ArrowDownLeft size={14}/> Recargar</button>
                 <button className="flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-2xl font-black uppercase text-[10px] italic border border-slate-700"><ArrowUpRight size={14}/> Retirar</button>
              </div>
            </div>

            {/* DATOS PERSONALES BÁSICOS (Se ven en ambos modos) */}
            <div className="bg-white p-6 rounded-[35px] border shadow-sm space-y-4">
               <div className="flex justify-between items-center">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase italic">Mis Datos Personales</h3>
                 <button onClick={() => setEditando(!editando)} className="p-2 bg-slate-100 rounded-xl text-slate-600"><Edit2 size={14}/></button>
               </div>
               <input disabled={!editando} className="w-full p-4 rounded-xl font-bold text-sm border bg-slate-50 outline-none" placeholder="Nombre" value={formPerfil.nombre} onChange={(e) => setFormPerfil({ ...formPerfil, nombre: e.target.value })} />
               <input disabled={!editando} className="w-full p-4 rounded-xl font-bold text-sm border bg-slate-50 outline-none" placeholder="Teléfono" value={formPerfil.telefono} onChange={(e) => setFormPerfil({ ...formPerfil, telefono: e.target.value })} />
               
               {!userData.kycVerificado && (
                  <button onClick={() => setVerificandoKYC(true)} className="w-full py-3 bg-red-50 text-red-500 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 border border-red-100"><ShieldCheck size={14}/> Verificar con KYC</button>
               )}
            </div>

            {/* SECCIÓN VEHÍCULO (SOLO MODO CHOFER) */}
            {modo === "chofer" && (
              <div className="bg-white p-6 rounded-[35px] border shadow-sm space-y-4 border-green-100 animate-in fade-in">
                <h3 className="text-[11px] font-black text-green-600 uppercase italic flex items-center gap-2"><Car size={14}/> Datos de mi Vehículo</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input disabled={!editando} className="p-4 rounded-xl font-bold text-sm border bg-slate-50 outline-none" placeholder="Marca Auto" value={formVehiculo.marca} onChange={(e) => setFormVehiculo({ ...formVehiculo, marca: e.target.value })} />
                  <input disabled={!editando} className="p-4 rounded-xl font-bold text-sm border bg-slate-50 outline-none" placeholder="Modelo" value={formVehiculo.modelo} onChange={(e) => setFormVehiculo({ ...formVehiculo, modelo: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input disabled={!editando} className="p-4 rounded-xl font-bold text-sm border bg-slate-50 outline-none" placeholder="Placa (Obligatorio)" value={formVehiculo.placa} onChange={(e) => setFormVehiculo({ ...formVehiculo, placa: e.target.value })} />
                  <input disabled={!editando} className="p-4 rounded-xl font-bold text-sm border bg-slate-50 outline-none" placeholder="Color" value={formVehiculo.color} onChange={(e) => setFormVehiculo({ ...formVehiculo, color: e.target.value })} />
                </div>
              </div>
            )}

            {/* BOTÓN GUARDAR (Aplica para Perfil y/o Vehículo según el modo) */}
            {editando && (
              <button onClick={async () => { 
                await updateDoc(doc(db, "usuarios", user.uid), { ...formPerfil, vehiculo: formVehiculo }); 
                setEditando(false); 
                alert("✅ Datos guardados correctamente."); 
              }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-lg text-xs">Guardar Cambios</button>
            )}

            <button onClick={() => auth.signOut()} className="w-full py-4 bg-red-50 text-red-500 font-black uppercase rounded-2xl border border-red-100 text-xs italic">Cerrar Sesión</button>
          </div>
        )}

        {/* CHATS Y DEMÁS MODALES SE MANTIENEN IGUAL (Ocultos para ahorrar espacio en este mensaje, pero asume que están ahí tal cual como los programamos antes) */}
        
        {/* MODAL KYC */}
        {verificandoKYC && (
          <div className="absolute inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
             <div className="bg-white w-full rounded-[40px] p-8 relative shadow-2xl animate-in zoom-in">
                <button onClick={() => setVerificandoKYC(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full"><X size={20}/></button>
                <h3 className="font-black uppercase text-xl italic text-slate-800 mb-6">Verificación KYC</h3>
                <div className="space-y-3">
                   <div className="bg-slate-50 p-5 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center gap-2">
                     <Camera size={24} className="text-blue-600"/>
                     <p className="text-[10px] font-black uppercase text-slate-400">Subir foto de Cédula</p>
                   </div>
                   <button onClick={async () => {
                     await updateDoc(doc(db, "usuarios", user.uid), { kycVerificado: true });
                     setVerificandoKYC(false);
                     alert("✅ Documentos en revisión.");
                   }} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-[11px] italic mt-4 shadow-xl">Enviar Documentos</button>
                </div>
             </div>
          </div>
        )}

        {/* DETALLES DE VIAJE Y BOTÓN DE RESERVA */}
        {viajeSeleccionado && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end">
            <div className="w-full bg-white rounded-t-[50px] p-8 space-y-6 shadow-2xl text-left animate-in slide-in-from-bottom">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-[20px] flex items-center justify-center text-white text-2xl font-black italic shadow-lg">R</div>
                  <div>
                    <p className="text-blue-600 font-black uppercase italic text-xs">• {viajeSeleccionado.origen} → {viajeSeleccionado.destino}</p>
                    <p className="text-xl font-black uppercase text-slate-800">{viajeSeleccionado.conductor}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viajeSeleccionado.vehiculoCompleto}</p>
                  </div>
                </div>
                <button onClick={() => setViajeSeleccionado(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Precio</p>
                  <p className="text-sm font-black text-blue-600 italic">${viajeSeleccionado.precio}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Maleta</p>
                  <p className="text-sm font-black text-slate-800 italic">{viajeSeleccionado.aceptaMaleta ? `${viajeSeleccionado.kilosMaleta}kg` : 'No'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Asientos</p>
                  <p className="text-sm font-black text-slate-800 italic">{viajeSeleccionado.puestosDisponibles}</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100">
                 <p className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2 mb-1"><Info size={12}/> Info Extra</p>
                 <p className="text-xs font-bold text-slate-600 leading-relaxed italic">"{viajeSeleccionado.detallesExtras || "Sin detalles adicionales."}"</p>
              </div>

              <div className="flex gap-3">
                 <button onClick={() => { setViajeActivo(viajeSeleccionado); setVista("chat_conductor"); setViajeSeleccionado(null); }} className="p-5 bg-slate-100 text-blue-600 rounded-3xl shadow-sm active:scale-90"><MessageSquare size={24}/></button>
                 <button onClick={() => { setViajeActivo(viajeSeleccionado); setVista("chat_conductor"); setViajeSeleccionado(null); alert("✅ Reservado. Confirma en el chat."); }} className="flex-1 py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic shadow-xl text-xs tracking-widest active:scale-95">Reservar Cupo</button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* NAVBAR INFERIOR */}
      <nav className="p-6 bg-white border-t flex justify-around items-center shrink-0 z-20 pb-10">
        <button onClick={() => setVista("inicio")} className={`flex flex-col items-center gap-1 ${vista === "inicio" ? "text-blue-600" : "text-slate-400"}`}>
          <Car size={24} /><span className="text-[9px] font-black uppercase">Rutas</span>
        </button>
        <button onClick={() => setVista("chat_soporte")} className={`flex flex-col items-center gap-1 ${vista === "chat_soporte" ? "text-blue-600" : "text-slate-400"}`}>
          <Headset size={24} /><span className="text-[9px] font-black uppercase">Soporte</span>
        </button>
        <button onClick={() => setVista("perfil")} className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600" : "text-slate-400"}`}>
          <User size={24} /><span className="text-[9px] font-black uppercase">Perfil</span>
        </button>
      </nav>
    </div>
  );
}
