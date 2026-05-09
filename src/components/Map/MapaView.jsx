import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

const MapaView = ({ origen, destino, interactivo = false, onMarkerDragEnd }) => {
  const mapRef = useRef(null);
  const googleMap = useRef(null);
  const markers = useRef([]);
  const directionsRenderer = useRef(null);

  useEffect(() => {
    if (!window.google || !mapRef.current || googleMap.current) return;

    // Si tenemos origen, iniciamos ahí. Si no, en Valencia.
    const centroInicial = origen ? { lat: origen.lat, lng: origen.lon } : { lat: 10.1620, lng: -67.9567 };

    googleMap.current = new window.google.maps.Map(mapRef.current, {
      center: centroInicial,
      zoom: 16,
      disableDefaultUI: true, 
      zoomControl: !interactivo, // Solo mostramos zoom si NO es interactivo
      gestureHandling: 'greedy', // Permite mover el mapa con un solo dedo sin que Google moleste
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
      ]
    });

    directionsRenderer.current = new window.google.maps.DirectionsRenderer({
      map: googleMap.current,
      suppressMarkers: true, // Nosotros pintamos nuestros propios marcadores
      polylineOptions: { strokeColor: "#2563eb", strokeWeight: 5 }
    });

    // LÓGICA PROFESIONAL: Escuchar cuando el usuario arrastra el mapa entero
    if (interactivo) {
      googleMap.current.addListener('dragend', () => {
        const center = googleMap.current.getCenter();
        if (onMarkerDragEnd) {
          onMarkerDragEnd({ lat: center.lat(), lon: center.lng() });
        }
      });
    }
  }, [interactivo, origen, onMarkerDragEnd]);

  // Lógica para pintar la ruta cuando NO es interactivo (ej: resumen del viaje)
  useEffect(() => {
    if (!googleMap.current || !window.google || interactivo) return;

    // Limpiar rastro viejo
    markers.current.forEach(m => m.setMap(null));
    markers.current = [];
    const bounds = new window.google.maps.LatLngBounds();

    if (origen) {
      const pos = { lat: origen.lat, lng: origen.lon };
      const markerO = new window.google.maps.Marker({
        position: pos,
        map: googleMap.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8
        }
      });
      markers.current.push(markerO);
      bounds.extend(pos);
    }

    if (destino) {
      const pos = { lat: destino.lat, lng: destino.lon };
      const markerD = new window.google.maps.Marker({
        position: pos,
        map: googleMap.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8
        }
      });
      markers.current.push(markerD);
      bounds.extend(pos);
    }

    if (origen && destino) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route({
        origin: { lat: origen.lat, lng: origen.lon },
        destination: { lat: destino.lat, lng: destino.lon },
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === 'OK') {
          directionsRenderer.current.setDirections(result);
        }
      });
    } else if (origen || destino) {
      googleMap.current.fitBounds(bounds);
      googleMap.current.setZoom(15);
    }
  }, [origen, destino, interactivo]);

  return (
    <div className="relative w-full h-full min-h-[300px] bg-slate-100 rounded-inherit">
      {/* Contenedor del mapa de Google */}
      <div ref={mapRef} className="absolute inset-0" style={{ borderRadius: 'inherit' }} />

      {/* PIN FIJO EN EL CENTRO (SOLO MODO INTERACTIVO) */}
      {interactivo && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center">
          <div className="bg-slate-900 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-full mb-1 shadow-lg tracking-widest">
            Mover Mapa
          </div>
          <MapPin size={36} className="text-blue-600 drop-shadow-md" fill="currentColor" />
          <div className="w-2 h-1 bg-black/30 rounded-full mt-[-4px] blur-[1px]" />
        </div>
      )}
    </div>
  );
};

export default MapaView;
