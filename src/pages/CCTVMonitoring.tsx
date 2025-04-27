import React from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';

const CCTVMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const cameras = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">CCTV Monitoring Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cameras.map((cameraId) => (
          <div key={cameraId} className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
            <div className="relative aspect-video bg-black">
              <Webcam
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">Camera {cameraId}</h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate(`/history/${cameraId}`)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
                >
                  History
                </button>
                <button
                  onClick={() => navigate(`/camera/${cameraId}`)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
                >
                  Explore
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CCTVMonitoring;