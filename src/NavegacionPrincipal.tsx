import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, updateDoc, deleteDoc
} from "firebase/firestore";
import {
  Wallet, User, LogOut, Car, X, Send, ShieldCheck, 
  Camera, CheckCircle, Navigation, Search, 
  Star, Settings, Trash2, MessageCircle
} from "lucide-react";

const UBICACIONES: Record<string, string[]> = {
  "Amazonas": ["Puerto Ayacucho"], "Anzoátegui": ["Barcelona", "Puerto La Cruz"],
  "Apure": ["San Fernando"], "Aragua": ["Maracay", "Turmero", "La Victoria"],
  "Barinas": ["Barinas"], "Bolívar": ["Ciudad Guayana", "Ciudad Bolívar"],
  "Carabobo": ["Valencia", "Naguanagua", "Guacara", "San Diego"],
  "Cojedes": ["San Carlos", "Tinaquillo"], "Distrito Capital": ["Caracas"],
  "Falcón": ["Coro", "Punto Fijo"], "Lara": ["Barquisimeto", "Cabudare"],
  "Mérida": ["Mérida", "El Vigía"], "Miranda": ["Los Teques", "Chacao", "Baruta"],
  "Monagas": ["Maturín"], "Nueva Esparta": ["Porlamar"], "Portuguesa": ["Guanare"],
  "Táchira": ["San Cristóbal"], "Trujillo": ["Valera"], "Yaracuy": ["San Felipe"],
  "Zulia": ["Maracaibo", "San Francisco"]
};
const ESTADOS = Object.keys(UBICACIONES);

export default function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState<"pasajero" | "chofer">("pasajero");
  const [userData, setUserData] = useState<any>(null);
  const [viajes, setViajes] = useState<any[]>([]);
  const [configOpen, setConfigOpen] = useState(false);
  const [form, setForm] = useState({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4" });
  const [fEO, setFEO] = useState(""); const [fCO, setFCO] = useState("");
  const [fED, setFED] = useState(""); const [fCD, setFCD] = useState("");
  const [editandoVehiculo, setEditandoVehiculo] = useState(false);
  const [vehiculoForm, setVehiculoForm] = useState({ marca: "", modelo: "", placa: "" });
  const [mensajeSoporte, setMensajeSoporte] = useState("");
  const [chatSoporte, setChatSoporte] = useState<{texto: string, mio: boolean}[]>([]);
  useEffect(() => {
    if (!user) return;
    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        if (data.vehiculo) setVehiculoForm(data.vehiculo);
      }
    });
    const q = query(collection(db, "Viajes"), orderBy("fecha", "desc"));
    const unsubViajes = onSnapshot(q, (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubUser(); unsubViajes(); };
  }, [user]);

  const publicarRuta = async () => {
    // 1. Validación de Seguridad Local (KYC)
    if (userData?.kycVerificado !== true) {
      return alert("⚠️ Bloqueado: Debes estar verificado (KYC) para publicar como chófer.");
    }
    if (!form.cO || !form.cD || !form.precio) return alert("Completa los datos del viaje.");

    try {
      // 2. Construcción del objeto (IMPORTANTE: idCreador debe coincidir con la Regla)
      const dataViaje = {
        eO: form.eO, cO: form.cO, eD: form.eD, cD: form.cD,
        precio: Number(form.precio), puestos: Number(form.puestos),
        conductor: userData.nombre,
        idCreador: user.uid, // Campo clave para las reglas de Firebase
        fecha: serverTimestamp(),
        verificado: true
      };

      await addDoc(collection(db, "Viajes"), dataViaje);
      alert("🚀 ¡Viaje publicado!");
      setForm({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4" });
    } catch (e) {
      console.error(e);
      alert("Error: Firebase rechazó la publicación. Verifica que tu usuario tenga 'kycVerificado: true' en Firestore.");
    }
  };

  const eliminarViaje = async (id: string) => {
    if (confirm("¿Eliminar viaje?")) await deleteDoc(doc(db, "Viajes", id));
  };

  const guardarDatosVehiculo = async () => {
    if (!vehiculoForm.marca || !vehiculoForm.placa) return alert("Llena los campos.");
    await updateDoc(doc(db, "usuarios", user.uid), { vehiculo: vehiculoForm });
    alert("Vehículo guardado.");
    setEditandoVehiculo(false);
  };

  const enviarMensajeSoporte = () => {
    if (!mensajeSoporte.trim()) return;
    setChatSoporte([...chatSoporte, { texto: mensajeSoporte, mio: true }]);
    setMensajeSoporte("");
    setTimeout(() => setChatSoporte(p => [...p, { texto: "Un asesor te atenderá pronto.", mio: false }]), 1000);
  };
  const viajesFiltrados = viajes.filter(v => (fCO === "" || v.cO === fCO) && (fCD === "" || v.cD === fCD));

  if (!userData) return <div className="h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black italic">CARGANDO...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      <header className="p-6 pt-12 bg-white border-b flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl transform -skew-x-6">D</div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase">Modo {modo}</p><p className="text-sm font-black text-slate-800 italic">{userData.nombre}</p></div>
        </div>
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl flex items-center gap-2 font-black italic text-xs">
          <Wallet size={14} className="text-blue-400" /> ${userData.saldo?.toFixed(2)}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 pb-32">
        {vista === "inicio" && (
          <div className="space-y-6">
            <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-3 rounded-2xl text-[10px] font-black uppercase border-2 border-blue-600 text-blue-600 bg-white">
              CAMBIAR A MODO {modo === "pasajero" ? "CHÓFER" : "PASAJERO"}
            </button>
            {modo === "chofer" ? (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-[35px] border shadow-xl space-y-3">
                  <h3 className="text-xs font-black uppercase text-blue-600 italic flex items-center gap-2"><Navigation size={16}/> Nueva Ruta</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.eO} onChange={(e)=>setForm({...form, eO: e.target.value, cO: ""})}><option value="">Origen</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                    <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" disabled={!form.eO} value={form.cO} onChange={(e)=>setForm({...form, cO: e.target.value})}><option value="">Ciudad</option>{form.eO && UBICACIONES[form.eO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.eD} onChange={(e)=>setForm({...form, eD: e.target.value, cD: ""})}><option value="">Destino</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                    <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" disabled={!form.eD} value={form.cD} onChange={(e)=>setForm({...form, cD: e.target.value})}><option value="">Ciudad</option>{form.eD && UBICACIONES[form.eD].map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                  <input type="number" placeholder="Precio $" className="w-full bg-slate-50 p-3 rounded-xl border text-xs font-bold" value={form.precio} onChange={(e)=>setForm({...form, precio: e.target.value})} />
                  <button onClick={publicarRuta} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-lg active:scale-95 transition-all">Publicar Ahora</button>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase italic">Mis Publicaciones</p>
                  {viajes.filter(v => v.idCreador === user.uid).map(v => (
                    <div key={v.id} className="bg-white p-4 rounded-[25px] border flex justify-between items-center shadow-sm">
                      <div><p className="text-xs font-black uppercase">{v.cO} → {v.cD}</p><p className="text-[10px] text-blue-600 font-bold italic">${v.precio}</p></div>
                      <button onClick={()=>eliminarViaje(v.id)} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-[30px] shadow-sm border space-y-3">
                  <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Search size={14}/> ¿A dónde vamos?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <select className="bg-slate-50 p-2 rounded-xl border text-[9px] font-black" value={fEO} onChange={(e)=>{setFEO(e.target.value); setFCO("");}}><option value="">DE: ESTADO</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                    <select className="bg-slate-50 p-2 rounded-xl border text-[9px] font-black" disabled={!fEO} value={fCO} onChange={(e)=>setFCO(e.target.value)}><option value="">DE: CIUDAD</option>{fEO && UBICACIONES[fEO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                </div>
                {viajesFiltrados.map(v => (
                  <div key={v.id} className="bg-white p-5 rounded-[30px] border flex justify-between items-center shadow-sm">
                    <div className="flex-1"><div className="flex items-center gap-1 mb-1">{v.verificado && <ShieldCheck size={12} className="text-blue-500" />}<p className="text-[9px] font-black text-slate-400 uppercase italic">{v.conductor}</p></div><p className="font-black uppercase text-xs text-slate-800">{v.cO} → {v.cD}</p></div>
                    <div className="text-right"><p className="text-xl font-black text-blue-600 italic leading-none">${v.precio}</p><button className="mt-2 text-[9px] bg-slate-900 text-white px-5 py-2 rounded-full font-black uppercase">Ver</button></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {vista === "soporte" && (
          <div className="flex flex-col h-[65vh] bg-white rounded-[35px] border shadow-lg overflow-hidden">
             <div className="bg-blue-600 p-4 text-white text-center font-black italic text-xs uppercase">Chat de Soporte</div>
             <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50 flex flex-col">
                {chatSoporte.map((m, i) => (
                  <div key={i} className={`p-4 rounded-2xl max-w-[85%] text-[11px] font-bold ${m.mio ? 'bg-blue-600 text-white self-end' : 'bg-white border text-slate-700 self-start'}`}>{m.texto}</div>
                ))}
             </div>
             <div className="p-4 bg-white border-t flex gap-2"><input type="text" value={mensajeSoporte} onChange={(e)=>setMensajeSoporte(e.target.value)} className="flex-1 bg-slate-100 p-4 rounded-2xl text-[11px] font-bold outline-none" placeholder="Escribe..." /><button onClick={enviarMensajeSoporte} className="bg-blue-600 w-12 h-12 rounded-2xl text-white flex items-center justify-center shrink-0"><Send size={18}/></button></div>
          </div>
        )}
        {vista === "perfil" && (
          <div className="space-y-4">
             <div className="bg-white p-6 rounded-[35px] shadow-sm border flex flex-col items-center relative">
                <button onClick={()=>setConfigOpen(!configOpen)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-xl text-blue-600 border border-blue-100"><Settings size={20}/></button>
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md relative">
                  <User size={40} className="text-slate-400" />
                  {userData.kycVerificado && <div className="absolute bottom-0 right-0 bg-blue-600 p-1 rounded-full border-2 border-white"><CheckCircle size={12} className="text-white"/></div>}
                </div>
                <h2 className="font-black italic text-slate-800 uppercase tracking-tighter">{userData.nombre}</h2>
             </div>
             {configOpen && (
               <div className="bg-white p-6 rounded-[35px] border-2 border-blue-600 space-y-4 animate-in zoom-in-95">
                  <div className="flex justify-between items-center"><h3 className="text-xs font-black uppercase italic text-blue-600">Configuración</h3><button onClick={()=>setConfigOpen(false)}><X size={18}/></button></div>
                  <div className="p-4 bg-slate-50 rounded-2xl border space-y-3">
                     <button onClick={()=>setEditandoVehiculo(!editandoVehiculo)} className="w-full text-[9px] bg-slate-200 py-2 rounded-full font-black uppercase">{editandoVehiculo ? "Cancelar" : "Editar Vehículo"}</button>
                     {editandoVehiculo && (
                       <div className="space-y-2">
                         <input type="text" placeholder="Marca" value={vehiculoForm.marca} onChange={e=>setVehiculoForm({...vehiculoForm, marca: e.target.value})} className="w-full p-3 rounded-xl border text-[10px] font-bold" />
                         <input type="text" placeholder="Placa" value={vehiculoForm.placa} onChange={e=>setVehiculoForm({...vehiculoForm, placa: e.target.value})} className="w-full p-3 rounded-xl border text-[10px] font-bold uppercase" />
                         <button onClick={guardarDatosVehiculo} className="w-full p-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase">Guardar</button>
                       </div>
                     )}
                  </div>
                  <div className="space-y-2"><button className="w-full p-4 bg-slate-50 rounded-2xl flex justify-between items-center text-[10px] font-black uppercase italic"><span>Cédula</span><Camera size={16}/></button><button className="w-full p-4 bg-slate-50 rounded-2xl flex justify-between items-center text-[10px] font-black uppercase italic border-2 border-blue-100"><span>Licencia</span><ShieldCheck size={16}/></button></div>
               </div>
             )}
             <button onClick={() => signOut(auth)} className="w-full p-4 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-2 italic"><LogOut size={16} /> Cerrar Sesión</button>
          </div>
        )}
      </main>

      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 fixed bottom-0 w-full max-w-md shadow-2xl z-50">
        <button onClick={() => setVista("inicio")} className={`flex flex-col items-center gap-1 ${vista === "inicio" ? "text-blue-600" : "text-slate-300"}`}><Car size={24} /><span className="text-[9px] font-black uppercase italic">Viajes</span></button>
        <button onClick={() => setVista("soporte")} className={`flex flex-col items-center gap-1 ${vista === "soporte" ? "text-blue-600" : "text-slate-300"}`}><MessageCircle size={24} /><span className="text-[9px] font-black uppercase italic">Soporte</span></button>
        <button onClick={() => setVista("perfil")} className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600" : "text-slate-300"}`}><User size={24} /><span className="text-[9px] font-black uppercase italic">Perfil</span></button>
      </nav>
    </div>
  );
}
