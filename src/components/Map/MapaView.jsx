import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';

const MapaView = ({ 
  origen, 
  destino, 
  posicionChofer, 
  pasajeros = [], 
  estadoViaje, 
  interactivo = false,
  onMarkerDragEnd 
}) => {
  const mapRef = useRef(null);
  const googleMap = useRef(null);
  const markers = useRef({ chofer: null, pasajeros: [], origen: null, destino: null });
  const directionsRenderer = useRef(null);
  const [localizando, setLocalizando] = useState(false);

  // 1. INICIALIZAR MAPA
  useEffect(() => {
    if (!window.google || !mapRef.current || googleMap.current) return;

    const centroInicial = origen ? { lat: origen.lat, lng: origen.lon } : { lat: 10.1620, lng: -67.9567 };

    googleMap.current = new window.google.maps.Map(mapRef.current, {
      center: centroInicial,
      zoom: 17,
      disableDefaultUI: true,
      zoomControl: false,
      styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]
    });

    directionsRenderer.current = new window.google.maps.DirectionsRenderer({
      map: googleMap.current,
      suppressMarkers: true, 
      polylineOptions: { strokeColor: "#000000", strokeWeight: 5 }
    });

    if (interactivo) {
      googleMap.current.addListener('idle', () => {
        const centro = googleMap.current.getCenter();
        if (onMarkerDragEnd) {
          onMarkerDragEnd({ lat: centro.lat(), lon: centro.lng() });
        }
      });
    }
  }, [interactivo]);

  // 2. FUNCIÓN PARA DETECTAR UBICACIÓN ACTUAL GPS (USO MANUAL EN INTERFAZ)
  const obtenerUbicacionActual = async () => {
    setLocalizando(true);
    try {
      const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const miPos = { lat: coordinates.coords.latitude, lng: coordinates.coords.longitude };

      if (googleMap.current) {
        googleMap.current.panTo(miPos); 
        googleMap.current.setZoom(18); 
      }
    } catch (error) {
      console.error("Error obteniendo ubicación:", error);
      alert("Asegúrate de tener el GPS encendido y dar permisos a la app.");
    } finally {
      setLocalizando(false);
    }
  };

  // 3. ACTUALIZACIÓN DE MARCADORES (ORIGEN, DESTINO Y CHOFER)
  useEffect(() => {
    if (!googleMap.current || !window.google || interactivo) return;

    if (markers.current.origen) markers.current.origen.setMap(null);
    if (markers.current.destino) markers.current.destino.setMap(null);

    if (origen) {
      markers.current.origen = new window.google.maps.Marker({
        position: { lat: origen.lat, lng: origen.lon },
        map: googleMap.current,
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#2563eb", fillOpacity: 1, strokeWeight: 3, strokeColor: "white" }
      });
    }

    if (destino) {
      markers.current.destino = new window.google.maps.Marker({
        position: { lat: destino.lat, lng: destino.lon },
        map: googleMap.current,
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#22c55e", fillOpacity: 1, strokeWeight: 3, strokeColor: "white" }
      });
    }

    if (origen && destino) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route({
        origin: { lat: origen.lat, lng: origen.lon },
        destination: { lat: destino.lat, lng: destino.lon },
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === 'OK') directionsRenderer.current.setDirections(result);
      });
    }
  }, [origen, destino, interactivo]);

  // 4. ANIMACIÓN DEL CHOFER EN TIEMPO REAL
  useEffect(() => {
    if (!googleMap.current || !window.google || interactivo || !posicionChofer) return;

    if (!markers.current.chofer) {
      // Crear el marcador del carro si no existe
      markers.current.chofer = new window.google.maps.Marker({
        position: { lat: posicionChofer.lat, lng: posicionChofer.lon },
        map: googleMap.current,
        icon: { 
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, 
          scale: 6, 
          fillColor: "#0f172a", 
          fillOpacity: 1, 
          strokeWeight: 2, 
          strokeColor: "white",
          rotation: posicionChofer.heading || 0 
        }
      });
    } else {
      // Si ya existe, solo actualizamos su posición suavemente
      markers.current.chofer.setPosition({ lat: posicionChofer.lat, lng: posicionChofer.lon });
      if (posicionChofer.heading) {
        const icon = markers.current.chofer.getIcon();
        icon.rotation = posicionChofer.heading;
        markers.current.chofer.setIcon(icon);
      }
    }
  }, [posicionChofer, interactivo]);

    // 5. MARCADORES DE LOS PASAJEROS
  useEffect(() => {
    if (!googleMap.current || !window.google || interactivo || !pasajeros.length) return;

    // 1. Limpiar los marcadores viejos para que no se dupliquen al recargar
    markers.current.pasajeros.forEach(marker => marker.setMap(null));
    markers.current.pasajeros = [];

    // 2. Paleta de colores para diferenciar a múltiples pasajeros
    const colores = ["#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#ef4444"];

    pasajeros.forEach((pasajero, index) => {
      // Solo dibuja si el pasajero tiene coordenadas válidas
      if (pasajero && pasajero.lat && pasajero.lng) {
        const colorFondo = colores[index % colores.length];
        const inicial = pasajero.nombre ? pasajero.nombre.charAt(0).toUpperCase() : "P";

        const marker = new window.google.maps.Marker({
          position: { lat: pasajero.lat, lng: pasajero.lng },
          map: googleMap.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12, // Tamaño de la bolita
            fillColor: colorFondo,
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "white",
          },
          label: {
            text: inicial,
            color: "white",
            fontSize: "12px",
            fontWeight: "bold"
          }
        });

        markers.current.pasajeros.push(marker);
      }
    });
  }, [pasajeros, interactivo]);

  return (
    <div className="relative w-full h-full min-h-[300px] bg-slate-100 rounded-inherit overflow-hidden">
      <div ref={mapRef} className="absolute inset-0" style={{ borderRadius: 'inherit' }} />

      {interactivo && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="flex flex-col items-center mb-[35px]">
            <div className="bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-md mb-1 uppercase tracking-tighter shadow-xl">
              Fijar punto aquí
            </div>
            <MapPin size={35} className={origen ? "text-blue-600" : "text-green-600"} fill="currentColor" stroke="white" strokeWidth={2} />
            <div className="w-1.5 h-1.5 bg-black/30 rounded-full blur-[1px] mt-1" />
          </div>
        </div>
      )}

      {interactivo && (
        <button 
          onClick={obtenerUbicacionActual}
          disabled={localizando}
          className={`absolute bottom-6 right-6 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 ${localizando ? 'bg-slate-100 text-slate-300' : 'bg-white text-blue-600'}`}
        >
          <Navigation size={22} className={localizando ? 'animate-pulse' : ''} fill={localizando ? 'none' : 'currentColor'} />
        </button>
      )}
    </div>
  );
};

export default MapaView;
