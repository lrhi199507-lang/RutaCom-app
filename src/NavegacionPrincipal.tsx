import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import {
  doc, onSnapshot, updateDoc, collection, query, addDoc, 
  serverTimestamp, orderBy, where
} from "firebase/firestore";
import {
  Search, Wallet, User, LogOut, Car, X, Send, ArrowLeft, Edit2, 
  Headset, PlusCircle, ShieldCheck, Camera, CheckCircle, MapPin, 
  ChevronRight, Luggage, Info, MessageSquare
} from "lucide-react";

const ESTADOS = ["Caracas", "Valencia", "Barquisimeto", "Maracay", "Puerto La Cruz", "Mérida"];

export default function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [editando, setEditando] = useState(false);
  const [busqueda, setBusqueda] = useState({ origen: "", destino: "" });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [verificandoKYC, setVerificandoKYC] = useState(false);

  const [inputSoporte, setInputSoporte] = useState("");
  const [inputConductor, setInputConductor] = useState("");
  const [mensajesSoporte, setMensajesSoporte] = useState<any[]>([]);
  const [mensajesConductor, setMensajesConductor] = useState<any[]>([]);

  const [viajesReales, setViajesReales] = useState<any[]>([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [viajeActivo, setViajeActivo] = useState<any>(null);
  
  const [userData, setUserData] = useState<any>({ 
    nombre: "", saldo: 0, telefono: "", calle: "", kycVerificado: false,
    vehiculo: { marca: "", modelo: "", placa: "", color: "" }
  });
  
  const [formPerfil, setFormPerfil] = useState({ nombre: "", telefono: "", calle: "" });
  const [formVehiculo, setFormVehiculo] = useState({ marca: "", modelo: "", placa: "", color: "" });
  
  // FORMULARIO DE VIAJE COMPLETO (Captura 162529)
  const [formViaje, setFormViaje] = useState({
    origen: "", destino: "", precio: "", puestos: "4", 
    kilosMaleta: "20", aceptaMaleta: true, detallesExtras: ""
  });

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        if (!editando) {
          setFormPerfil({ nombre: data.nombre || "", telefono: data.telefono || "", calle: data.calle || "" });
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
    if (!formViaje.origen || !formViaje.destino || !formViaje.precio) return alert("⚠️ Origen, Destino y Precio son obligatorios");
    if (!userData.vehiculo?.placa) return alert("⚠️ Primero registra tu vehículo en el Perfil");
    
    try {
      await addDoc(collection(db, "Viajes"), {
        conductor: userData.nombre,
        origen: formViaje.origen,
        destino: formViaje.destino,
        precio: Number(formViaje.precio),
        vehiculo: `${userData.vehiculo.marca} ${userData.vehiculo.modelo} (${userData.vehiculo.placa})`,
        puestos: Number(formViaje.puestos),
        kilosMaleta: Number(formViaje.kilosMaleta),
        aceptaMaleta: formViaje.aceptaMaleta,
        detallesExtras: formViaje.detallesExtras,
        idCreador: user.uid,
        fecha: serverTimestamp(),
        estado: "buscando"
      });
      alert("✅ Ruta publicada");
      setModo("pasajero");
    } catch (e) { alert("❌ Error al publicar"); }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      
      {/* BURBUJA DE CHAT ACTIVO (NUEVA FUNCIÓN) */}
      {viajeActivo && vista !== "chat_conductor" && (
        <button onClick={() => setVista("chat_conductor")} className="absolute top-32 right-4 z-[100] bg-blue-600 text-white p-4 rounded-full shadow-2xl animate-bounce border-4 border-white">
          <MessageSquare size={24} />
          <div className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full border-2 border-white"></div>
        </button>
      )}

      {/* HEADER */}
      {!["chat_conductor", "chat_soporte"].includes(vista) && (
        <header className="p-6 pt-12 bg-white border-b shrink-0 z-20 shadow-sm text-left">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg">R</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">RutaCom {modo}</p>
                <p className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1">
                  {userData.nombre || "Usuario"} {userData.kycVerificado && <CheckCircle size={10} className="text-blue-500 fill-blue-500"/>}
                </p>
              </div>
            </div>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2">
              <Wallet size={12} className="text-blue-400" />
              <span className="text-[11px] font-black">${Number(userData.saldo).toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all ${modo === "pasajero" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>
            Cambiar a Modo {modo === "pasajero" ? "Chófer" : "Pasajero"}
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto pb-32">
        {/* INICIO PASAJERO: RECUPERADO ORIGEN Y DESTINO */}
        {vista === "inicio" && modo === "pasajero" && (
          <div className="p-6 space-y-4">
            <div className="bg-white p-5 rounded-[25px] border shadow-sm space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase ml-2">Filtros de Búsqueda</p>
              <div className="grid grid-cols-2 gap-2">
                <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" onChange={(e) => setBusqueda({...busqueda, origen: e.target.value})}>
                  <option value="">Desde...</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" onChange={(e) => setBusqueda({...busqueda, destino: e.target.value})}>
                  <option value="">Hacia...</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>

            {viajesReales.filter(v => (!busqueda.origen || v.origen === busqueda.origen) && (!busqueda.destino || v.destino === busqueda.destino)).map((v) => (
              <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-5 rounded-[30px] border flex justify-between items-center shadow-sm cursor-pointer active:scale-95 transition-transform text-left">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100"><Car size={22} /></div>
                  <div>
                    <div className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase italic">
                      {v.origen} <ChevronRight size={8}/> {v.destino}
                    </div>
                    <p className="font-black uppercase text-sm text-slate-800">{v.conductor}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{v.vehiculo}</p>
                  </div>
                </div>
                <p className="text-lg font-black text-blue-600 italic">${v.precio}</p>
              </div>
            ))}
          </div>
        )}

        {/* INICIO CHÓFER: RECUPERADO FORMULARIO COMPLETO */}
        {vista === "inicio" && modo === "chofer" && (
          <div className="p-6 space-y-4 text-left">
            <h2 className="text-lg font-black uppercase italic flex items-center gap-2 text-slate-800"><PlusCircle size={20} className="text-green-600" /> Publicar Mi Ruta</h2>
            <div className="bg-white p-6 rounded-[35px] border space-y-4 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                <select className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm" value={formViaje.origen} onChange={(e) => setFormViaje({ ...formViaje, origen: e.target.value })}>
                  <option value="">Desde (Origen)</option>
                  {ESTADOS.map((e) => (<option key={e} value={e}>{e}</option>))}
                </select>
                <select className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm" value={formViaje.destino} onChange={(e) => setFormViaje({ ...formViaje, destino: e.target.value })}>
                  <option value="">Hacia (Destino)</option>
                  {ESTADOS.map((e) => (<option key={e} value={e}>{e}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm" placeholder="Precio $" value={formViaje.precio} onChange={(e) => setFormViaje({ ...formViaje, precio: e.target.value })} />
                <input type="number" className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm" placeholder="Puestos Libres" value={formViaje.puestos} onChange={(e) => setFormViaje({ ...formViaje, puestos: e.target.value })} />
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2"><Luggage size={18} className="text-slate-400"/><p className="text-xs font-bold text-slate-600">Acepta Maleta</p></div>
                <input type="checkbox" checked={formViaje.aceptaMaleta} onChange={(e) => setFormViaje({...formViaje, aceptaMaleta: e.target.checked})} className="w-5 h-5 accent-blue-600" />
              </div>
              {formViaje.aceptaMaleta && (
                <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm" placeholder="Kilos permitidos (Ej: 20)" value={formViaje.kilosMaleta} onChange={(e) => setFormViaje({ ...formViaje, kilosMaleta: e.target.value })} />
              )}
              <textarea className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm h-24 outline-none resize-none" placeholder="Extras (No mascotas, aire full, etc...)" value={formViaje.detallesExtras} onChange={(e) => setFormViaje({ ...formViaje, detallesExtras: e.target.value })} />
              <button onClick={publicarViaje} className="w-full py-4 bg-green-600 text-white rounded-[20px] font-black uppercase italic shadow-lg">Publicar Ahora</button>
            </div>
          </div>
        )}

        {/* PERFIL: RECUPERADO REGISTRO DE VEHÍCULO */}
        {vista === "perfil" && (
          <div className="p-6 space-y-6 text-left pb-32">
            <div className="bg-white rounded-[35px] border p-6 flex flex-col items-center shadow-sm">
              <div className="w-20 h-20 bg-blue-600 rounded-[30px] flex items-center justify-center text-white shadow-xl relative mb-3">
                <User size={40} />
                <button onClick={() => setEditando(!editando)} className={`absolute -bottom-2 -right-2 p-2 rounded-xl text-white border-2 border-white ${editando ? "bg-green-500" : "bg-slate-900"}`}><Edit2 size={14} /></button>
              </div>
              <p className="font-black uppercase text-sm italic">{userData.nombre}</p>
            </div>

            <div className="bg-white p-6 rounded-[35px] border space-y-4 shadow-sm">
              <h3 className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2"><ShieldCheck size={14}/> Mis Datos y Vehículo</h3>
              <input disabled={!editando} className="w-full p-4 rounded-xl font-bold text-sm border bg-slate-50" placeholder="Nombre" value={formPerfil.nombre} onChange={(e) => setFormPerfil({ ...formPerfil, nombre: e.target.value })} />
              
              <div className="grid grid-cols-2 gap-2">
                <input disabled={!editando} className="p-4 rounded-xl font-bold text-sm border bg-slate-50" placeholder="Marca Auto" value={formVehiculo.marca} onChange={(e) => setFormVehiculo({ ...formVehiculo, marca: e.target.value })} />
                <input disabled={!editando} className="p-4 rounded-xl font-bold text-sm border bg-slate-50" placeholder="Modelo" value={formVehiculo.modelo} onChange={(e) => setFormVehiculo({ ...formVehiculo, modelo: e.target.value })} />
              </div>
              <input disabled={!editando} className="w-full p-4 rounded-xl font-bold text-sm border bg-slate-50" placeholder="Placa (Necesaria para publicar)" value={formVehiculo.placa} onChange={(e) => setFormVehiculo({ ...formVehiculo, placa: e.target.value })} />
              
              {editando && (
                <button onClick={async () => { 
                  await updateDoc(doc(db, "usuarios", user.uid), { ...formPerfil, vehiculo: formVehiculo }); 
                  setEditando(false); alert("✅ Perfil y Vehículo actualizados"); 
                }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-lg">Guardar Todo</button>
              )}
            </div>
            <button onClick={() => auth.signOut()} className="w-full py-4 bg-red-50 text-red-500 font-black uppercase rounded-2xl border border-red-100 italic text-xs">Cerrar Sesión</button>
          </div>
        )}
      </main>

      {/* MODAL DE DETALLES: RECUPERADO MALETAS Y EXTRAS (Captura 162529) */}
      {viajeSeleccionado && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-[50px] p-8 space-y-6 shadow-2xl text-left">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-[20px] flex items-center justify-center text-white text-2xl font-black italic shadow-lg">R</div>
                <div>
                  <p className="text-blue-600 font-black uppercase italic text-xs">• {viajeSeleccionado.origen} a {viajeSeleccionado.destino}</p>
                  <p className="text-xl font-black uppercase text-slate-800">{viajeSeleccionado.conductor}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viajeSeleccionado.vehiculo}</p>
                </div>
              </div>
              <button onClick={() => setViajeSeleccionado(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase">Precio</p>
                <p className="text-sm font-black text-blue-600 italic">${viajeSeleccionado.precio}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase">Maleta</p>
                <p className="text-sm font-black text-slate-800 italic">{viajeSeleccionado.aceptaMaleta ? `${viajeSeleccionado.kilosMaleta}kg` : 'No'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase">Puestos</p>
                <p className="text-sm font-black text-slate-800 italic">{viajeSeleccionado.puestos}</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
               <p className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2 mb-1"><Info size={12}/> Detalles Extras</p>
               <p className="text-xs font-bold text-slate-600 leading-relaxed">{viajeSeleccionado.detallesExtras || "Sin detalles adicionales."}</p>
            </div>

            <button onClick={() => manejarReserva(viajeSeleccionado)} className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic shadow-xl">Reservar Cupo Ahora</button>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="p-6 bg-white border-t flex justify-around items-center shrink-0 z-20 pb-10">
        <button onClick={() => setVista("inicio")} className={`flex flex-col items-center gap-1 ${vista === "inicio" ? "text-blue-600" : "text-slate-400"}`}>
          <Car size={24} /><span className="text-[9px] font-black uppercase tracking-tighter">Rutas</span>
        </button>
        <button onClick={() => setVista("chat_soporte")} className={`flex flex-col items-center gap-1 ${vista === "chat_soporte" ? "text-blue-600" : "text-slate-400"}`}>
          <Headset size={24} /><span className="text-[9px] font-black uppercase tracking-tighter">Soporte</span>
        </button>
        <button onClick={() => setVista("perfil")} className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600" : "text-slate-400"}`}>
          <User size={24} /><span className="text-[9px] font-black uppercase tracking-tighter">Perfil</span>
        </button>
      </nav>
    </div>
  );
      }
                                                                                                                                                                                                                                                                     
