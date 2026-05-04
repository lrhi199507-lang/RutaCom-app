import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import './mapStyles.css';

// Fix obligatorio para que los iconos carguen correctamente en móviles
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const MapaView = ({ lat, lng, zoom = 13 }) => {
  if (!lat || !lng) return null;

  return (
    <div className="map-wrapper border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <MapContainer center={[lat, lng]} zoom={zoom} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OSM'
        />
        <Marker position={[lat, lng]} icon={DefaultIcon} />
      </MapContainer>
    </div>
  );
};

export default MapaView;

