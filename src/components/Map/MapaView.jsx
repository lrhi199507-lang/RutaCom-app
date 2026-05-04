import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import './mapStyles.css';

// Fix para que el icono del marcador aparezca en el celular
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Componente invisible que auto-ajusta el zoom del mapa para ver los dos puntos
const MapUpdater = ({ origen, destino }) => {
  const map = useMap();
  
  useEffect(() => {
    if (origen && destino) {
      // Si hay ambos, encuadra los dos
      const bounds = L.latLngBounds([origen.lat, origen.lon], [destino.lat, destino.lon]);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (destino) {
      // Si solo hay destino, centra allí
      map.setView([destino.lat, destino.lon], 13);
    } else if (origen) {
      // Si solo hay origen, centra allí
      map.setView([origen.lat, origen.lon], 13);
    }
  }, [origen, destino, map]);

  return null;
};

const MapaView = ({ origen, destino }) => {
  if (!origen && !destino) return null;

  // Centro inicial para que el mapa no cargue en el océano
  const centerLat = destino ? destino.lat : origen.lat;
  const centerLon = destino ? destino.lon : origen.lon;

  return (
    <div className="map-wrapper border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <MapContainer center={[centerLat, centerLon]} zoom={13} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OSM'
        />
        
        <MapUpdater origen={origen} destino={destino} />

        {/* Pines condicionales */}
        {origen && <Marker position={[origen.lat, origen.lon]} icon={DefaultIcon} />}
        {destino && <Marker position={[destino.lat, destino.lon]} icon={DefaultIcon} />}
        
        {/* La línea de la ruta (Solo aparece si están ambos puntos) */}
        {origen && destino && (
          <Polyline 
            positions={[[origen.lat, origen.lon], [destino.lat, destino.lon]]} 
            color="#2563eb" // Azul que hace juego con tu UI
            weight={4}
            dashArray="10, 10" // Crea el efecto de línea punteada
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapaView;
