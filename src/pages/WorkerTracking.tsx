import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Alert from "../components/Alert";

// Constants
const ADMIN_LOCATION = {
  lat: 11.0658,
  lng: 77.0922,
  address: "Site Office, Construction Site"
};

const SAFETY_ZONE_RADIUS = 500; // meters
const DANGER_ZONE_RADIUS = 50; // meters

// Custom icons
const createIcon = (iconUrl: string, size: number, className?: string) => {
  return new L.Icon({
    iconUrl,
    iconSize: [size, size],
    iconAnchor: [size/2, size],
    popupAnchor: [0, -size],
    className
  });
};

const icons = {
  admin: createIcon('https://cdn-icons-png.flaticon.com/512/447/447031.png', 32),
  worker: createIcon('https://cdn-icons-png.flaticon.com/512/8069/8069529.png', 32),
  alert: createIcon('https://cdn-icons-png.flaticon.com/512/3527/3527548.png', 40, 'pulsing-marker'),
  danger: createIcon('https://cdn-icons-png.flaticon.com/512/2785/2785513.png', 28)
};

const GPSMap: React.FC<{
  alertLocation?: { lat: number; lng: number; deviceId?: string };
  workerHistory?: Array<{ lat: number; lng: number; timestamp: string }>;
}> = ({ alertLocation, workerHistory }) => {
  const [workerAddress, setWorkerAddress] = useState<string>("");

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      setWorkerAddress(data.display_name || "Location address not available");
    } catch (error) {
      console.error("Error fetching address:", error);
      setWorkerAddress("Address lookup failed");
    }
  };

  return (
    <div className="h-[500px] w-full relative">
      <MapContainer
        center={[ADMIN_LOCATION.lat, ADMIN_LOCATION.lng]}
        zoom={15}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Admin Marker */}
        <Marker position={[ADMIN_LOCATION.lat, ADMIN_LOCATION.lng]} icon={icons.admin}>
          <Popup>
            <strong>🏢 {ADMIN_LOCATION.address}</strong><br />
            <em>Site Control Center</em>
          </Popup>
        </Marker>

        {/* Safety Zone */}
        <Circle
          center={[ADMIN_LOCATION.lat, ADMIN_LOCATION.lng]}
          radius={SAFETY_ZONE_RADIUS}
          color="green"
          fillColor="green"
          fillOpacity={0.1}
        >
          <Tooltip permanent>Safe Work Zone</Tooltip>
        </Circle>

        {/* Worker Marker */}
        {alertLocation && (
          <>
            <Marker position={[alertLocation.lat, alertLocation.lng]} icon={icons.alert}>
              <Popup>
                <strong>🚧 Worker in Distress</strong><br />
                ID: {alertLocation.deviceId || 'Unknown'}<br />
                Coordinates: {alertLocation.lat.toFixed(6)}, {alertLocation.lng.toFixed(6)}<br />
                {workerAddress && <span>Approx: {workerAddress}</span>}
              </Popup>
            </Marker>
            
            {/* Route from admin to worker */}
            <Polyline
              positions={[
                [ADMIN_LOCATION.lat, ADMIN_LOCATION.lng],
                [alertLocation.lat, alertLocation.lng]
              ]}
              color="blue"
              weight={3}
              dashArray="5, 5"
            >
              <Tooltip>Direct path to worker</Tooltip>
            </Polyline>
          </>
        )}
      </MapContainer>
    </div>
  );
};

const WorkerTracking = () => {
  const [alertLocation, setAlertLocation] = useState<{ lat: number; lng: number; deviceId?: string } | undefined>(undefined);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [currentWorker, setCurrentWorker] = useState<string | null>(null);

  const handleTrack = (lat: number, lon: number, deviceId?: string) => {
    setAlertLocation({ lat, lng: lon, deviceId });
  };

  const handleViewHistory = (deviceId: string) => {
    setCurrentWorker(deviceId);
    setShowHistoryModal(true);
  };

  const handleCheckSafety = (deviceId: string) => {
    setCurrentWorker(deviceId);
    setShowSafetyModal(true);
  };

  return (
    <div className="p-4 relative">
      <h2 className="text-2xl font-bold mb-4">🏗️ Construction Worker Safety System</h2>
      
      <GPSMap alertLocation={alertLocation} />
      
      <Alert 
        onTrack={(lat, lon) => handleTrack(lat, lon, "worker-" + Math.floor(Math.random()*1000))}
        onViewHistory={handleViewHistory}
        onCheckSafety={handleCheckSafety}
      />

      {showHistoryModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>History for Worker {currentWorker}</h3>
            <p>Historical tracking data would appear here</p>
            <button onClick={() => setShowHistoryModal(false)}>Close</button>
          </div>
        </div>
      )}

      {showSafetyModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Safety Check for Worker {currentWorker}</h3>
            <p>Safety protocols would be initiated here</p>
            <button onClick={() => setShowSafetyModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerTracking;