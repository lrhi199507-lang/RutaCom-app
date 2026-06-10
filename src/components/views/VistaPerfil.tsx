import React, { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { db, storage } from '../../firebaseConfig';
import { doc, updateDoc, getDoc, getDocs, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { getAuth, signOut } from 'firebase/auth';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { 
  User, Edit2, ShieldCheck, LogOut, Camera, ChevronRight, 
  RefreshCw, Settings, AlertTriangle, UserCog, Car 
} from 'lucide-react';

const auth = getAuth();
const ADMIN_EMAIL = "damelacola2026@gmail.com";

export const VistaPerfil = ({ userData, setUserData, handleLogout, pestañaActiva, setPestañaActiva }) => {
  const [cargando, setCargando] = useState(false);
  const [toast, setToast] = useState(null);
  const [editando, setEditando] = useState(false);
  const [nombreLocal, setNombreLocal] = useState(userData?.nombre || "");
  const [telefonoLocal, setTelefonoLocal] = useState(userData?.telefono || "");
  
  // Estado para Admin
  const [datosAdmin, setDatosAdmin] = useState({ usuarios: [], reportes: [], pagos: [] });
  const esAdmin = auth.currentUser?.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  useEffect(() => {
    if (pestañaActiva === 'admin' && esAdmin) {
      cargarDatosAdmin();
    }
  }, [pestañaActiva]);

  const cargarDatosAdmin = async () => {
    setCargando(true);
    try {
      const snapUsers = await getDocs(query(collection(db, "usuarios"), limit(20)));
      const snapPagos = await getDocs(query(collection(db, "PagosPendientes"), where("estado", "==", "pendiente")));
      
      setDatosAdmin({
        usuarios: snapUsers.docs.map(d => ({ id: d.id, ...d.data() })),
        pagos: snapPagos.docs.map(d => ({ id: d.id, ...d.data() }))
      });
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const subirFoto = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt
      });
      
      setCargando(true);
      const storageRef = ref(storage, `usuarios/${auth.currentUser.uid}/perfil`);
      await uploadString(storageRef, image.base64String, 'base64');
      const url = await getDownloadURL(storageRef);
      
      await updateDoc(doc(db, "usuarios", auth.currentUser.uid), { fotoUrl: url });
      setUserData({...userData, fotoUrl: url});
      setToast({texto: "Foto actualizada"});
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
      setTimeout(() => setToast(null), 2000);
    }
  };

  const guardarCambios = async () => {
    setCargando(true);
    try {
      await updateDoc(doc(db, "usuarios", auth.currentUser.uid), { 
        nombre: nombreLocal, 
        telefono: telefonoLocal 
      });
      setUserData({...userData, nombre: nombreLocal, telefono: telefonoLocal});
      setEditando(false);
      setToast({texto: "Perfil guardado"});
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
      setTimeout(() => setToast(null), 2000);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Toast */}
      {toast && (
        <div className="fixed top-10 left-4 right-4 z-50 p-4 bg-slate-900 text-white rounded-xl shadow-lg animate-fade-in">
          {toast.texto}
        </div>
      )}

      {/* Header */}
      <div className="p-6 bg-white border-b flex items-center justify-between">
        <h1 className="font-bold text-xl">Mi Perfil</h1>
        {esAdmin && (
          <button 
            onClick={() => setPestañaActiva(pestañaActiva === 'admin' ? 'cuenta' : 'admin')}
            className="p-2 bg-blue-50 text-blue-600 rounded-lg"
          >
            {pestañaActiva === 'admin' ? <User size={20}/> : <ShieldCheck size={20}/>}
          </button>
        )}
      </div>

      {pestañaActiva === 'admin' && esAdmin ? (
        /* VISTA ADMINISTRADOR */
        <div className="p-4 space-y-4">
          <h2 className="font-bold">Panel de Control</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-xs text-slate-500">Usuarios</p>
              <p className="text-2xl font-bold">{datosAdmin.usuarios.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-xs text-slate-500">Pagos</p>
              <p className="text-2xl font-bold">{datosAdmin.pagos.length}</p>
            </div>
          </div>
          <button onClick={cargarDatosAdmin} className="w-full py-3 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2">
            <RefreshCw size={18} className={cargando ? 'animate-spin' : ''}/> Actualizar Datos
          </button>
        </div>
      ) : (
        /* VISTA USUARIO */
        <div className="p-4 space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              <img 
                src={userData?.fotoUrl || "https://via.placeholder.com/150"} 
                className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                alt="Perfil"
              />
              <button onClick={subirFoto} className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg">
                <Camera size={18} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Nombre</label>
                <input 
                  value={nombreLocal} 
                  onChange={(e) => setNombreLocal(e.target.value)}
                  disabled={!editando}
                  className="w-full bg-transparent border-b border-slate-200 py-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Teléfono</label>
                <input 
                  value={telefonoLocal} 
                  onChange={(e) => setTelefonoLocal(e.target.value)}
                  disabled={!editando}
                  className="w-full bg-transparent border-b border-slate-200 py-2 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              {editando ? (
                <button onClick={guardarCambios} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Guardar</button>
              ) : (
                <button onClick={() => setEditando(true)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Editar</button>
              )}
            </div>
          </div>

          <button onClick={handleLogout} className="w-full py-4 text-red-500 font-bold flex items-center justify-center gap-2">
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
};
