import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

// Fix Leaflet icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const GPSMap = () => {
  const [position, setPosition] = useState<[number, number]>([12.9716, 77.5946]); // default: Bangalore

  const fetchGPS = async () => {
    const res = await fetch("/api/gps");
    const data = await res.json();
    if (data.gps) {
      const [lat, lon] = data.gps.split(",").map(Number);
      setPosition([lat, lon]);
    }
  };

  useEffect(() => {
    fetchGPS(); // fetch once

    const interval = setInterval(fetchGPS, 5000); // auto-update every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <MapContainer center={position} zoom={16} style={{ height: "400px", borderRadius: "12px" }}>
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>Worker's Latest Location</Popup>
      </Marker>
    </MapContainer>
  );
};

export default GPSMap;
