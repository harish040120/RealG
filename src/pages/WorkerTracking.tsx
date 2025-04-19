import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const workers = [
  { id: 1, name: 'John Doe', role: 'Engineer', status: 'active', lat: 51.505, lng: -0.09 },
  { id: 2, name: 'Jane Smith', role: 'Technician', status: 'active', lat: 51.51, lng: -0.1 },
  { id: 3, name: 'Mike Johnson', role: 'Inspector', status: 'inactive', lat: 51.515, lng: -0.09 },
];

const WorkerTracking = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Worker Locations</h2>
        <div className="h-[500px] rounded-lg overflow-hidden">
          <MapContainer
            center={[51.505, -0.09]}
            zoom={13}
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {workers.map((worker) => (
              <Marker key={worker.id} position={[worker.lat, worker.lng]}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-medium">{worker.name}</h3>
                    <p className="text-sm text-gray-600">{worker.role}</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      worker.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {worker.status}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Worker Status</h2>
        <div className="divide-y">
          {workers.map((worker) => (
            <div key={worker.id} className="py-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium">{worker.name}</h3>
                <p className="text-sm text-gray-600">{worker.role}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                  worker.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {worker.status}
                </span>
                <span className="text-sm text-gray-500">2 mins ago</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkerTracking;