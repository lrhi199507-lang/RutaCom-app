import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import './mapStyles.css';

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

const MapaView = ({ origen, destino, interactivo = false, onMarkerDragEnd }) => {
  const defaultCenter = { lat: 10.1620, lon: -67.9567 };
  const initialCoords = origen || destino || defaultCenter;
  
  // ESTADO PARA GUARDAR LA RUTA CALLE POR CALLE
  const [rutaCalles, setRutaCalles] = useState([]);

  useEffect(() => {
    // Solo busca la ruta si tenemos ambos puntos y NO estamos en modo mover mapa
    if (origen && destino && !interactivo) {
      const trazarRuta = async () => {
        try {
          // OSRM API (Gratuita y sin API Key). Ojo: OSRM usa longitud,latitud
          const url = `https://router.project-osrm.org/route/v1/driving/${origen.lon},${origen.lat};${destino.lon},${destino.lat}?overview=full&geometries=geojson`;
          const respuesta = await fetch(url);
          const data = await respuesta.json();
          
          if (data.routes && data.routes.length > 0) {
            // GeoJSON trae [lon, lat], lo invertimos para Leaflet [lat, lon]
            const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            setRutaCalles(coords);
          }
        } catch (error) {
          console.error("Error trazando calles:", error);
          // Si el servidor gratis falla, fallback a la línea recta
          setRutaCalles([[origen.lat, origen.lon], [destino.lat, destino.lon]]);
        }
      };
      trazarRuta();
    } else {
      setRutaCalles([]);
    }
  }, [origen, destino, interactivo]);

  return (
    <div className="map-wrapper relative w-full h-full min-h-[300px] border-2 border-slate-200 rounded-[25px] overflow-hidden shadow-sm">
      
      <MapContainer 
        center={[initialCoords.lat, initialCoords.lon]} 
        zoom={interactivo ? 16 : 13} 
        scrollWheelZoom={interactivo} 
        className="w-full h-full z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OSM'
        />
        
        {!interactivo && <MapUpdater origen={origen} destino={destino} />}
        {interactivo && <CenterWatcher onMapMove={onMarkerDragEnd} />}

        {!interactivo && origen && <Marker position={[origen.lat, origen.lon]} icon={BlueIcon} />}
        {!interactivo && destino && <Marker position={[destino.lat, destino.lon]} icon={GreenIcon} />}
        
        {/* DIBUJO DE LA RUTA INTELIGENTE */}
        {!interactivo && rutaCalles.length > 0 && (
          <Polyline 
            positions={rutaCalles} 
            color="#2563eb"
            weight={5}
            opacity={0.8}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapContainer>

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
