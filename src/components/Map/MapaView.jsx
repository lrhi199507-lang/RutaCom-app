import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react'; // <-- Para el Pin fijo en el centro
import './mapStyles.css';

// Íconos clásicos para el modo "Ver Ruta"
const BlueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const GreenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Componente invisible que auto-ajusta el zoom del mapa para ver los dos puntos
const MapUpdater = ({ origen, destino }) => {
  const map = useMap();
  
  useEffect(() => {
    if (origen && destino) {
      const bounds = L.latLngBounds([origen.lat, origen.lon], [destino.lat, destino.lon]);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (destino) {
      map.setView([destino.lat, destino.lon], 14);
    } else if (origen) {
      map.setView([origen.lat, origen.lon], 14);
    }
  }, [origen, destino, map]);

  return null;
};

// NUEVO: Rastreador del centro del mapa (Modo "Yummy")
const CenterWatcher = ({ onMapMove }) => {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      if (onMapMove) {
        onMapMove({ lat: center.lat, lon: center.lng });
      }
    }
  });
  return null;
};

// COMPONENTE PRINCIPAL
const MapaView = ({ origen, destino, interactivo = false, onMarkerDragEnd }) => {
  // Centro por defecto (ej. Valencia) si no hay nada seleccionado
  const defaultCenter = { lat: 10.1620, lon: -67.9567 };
  const initialCoords = origen || destino || defaultCenter;

  return (
    <div className="map-wrapper relative w-full h-full min-h-[300px] border-2 border-slate-200 rounded-[25px] overflow-hidden shadow-sm">
      
      <MapContainer 
        center={[initialCoords.lat, initialCoords.lon]} 
        zoom={interactivo ? 16 : 13} // Más cerca si el usuario va a elegir la calle
        scrollWheelZoom={interactivo} // Bloqueado en vista estática, libre en interactivo
        className="w-full h-full z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OSM'
        />
        
        {/* LÓGICA DE ACTUALIZACIÓN SEGÚN EL MODO */}
        {!interactivo && <MapUpdater origen={origen} destino={destino} />}
        {interactivo && <CenterWatcher onMapMove={onMarkerDragEnd} />}

        {/* PINES CLÁSICOS Y RUTA (SOLO MODO ESTÁTICO) */}
        {!interactivo && origen && <Marker position={[origen.lat, origen.lon]} icon={BlueIcon} />}
        {!interactivo && destino && <Marker position={[destino.lat, destino.lon]} icon={GreenIcon} />}
        {!interactivo && origen && destino && (
          <Polyline 
            positions={[[origen.lat, origen.lon], [destino.lat, destino.lon]]} 
            color="#2563eb"
            weight={4}
            dashArray="10, 10" 
          />
        )}
      </MapContainer>

      {/* EL PIN CENTRAL FIJO (SOLO MODO INTERACTIVO) */}
      {interactivo && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none drop-shadow-2xl flex flex-col items-center">
          <div className="bg-slate-900 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full mb-1 shadow-lg">
            Mueve el mapa
          </div>
          <MapPin size={42} className="text-slate-800" fill="#2563eb" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
};

export default MapaView;
