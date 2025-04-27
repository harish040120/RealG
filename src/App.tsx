import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Alert from './components/Alert'; // Import Alert component
import Dashboard from './pages/Dashboard';
import CCTVMonitoring from './pages/CCTVMonitoring';
import WorkerTracking from './pages/WorkerTracking';
import Attendance from './pages/Attendance';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Camera from './pages/camera'; // Assuming Camera component is in pages directory
import History from './pages/History'; // Import the History component

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Define handler functions for the Alert component props
  const handleTrack = (lat: number, lon: number, deviceId?: string) => {
    console.log(`Tracking device ${deviceId} at Lat: ${lat}, Lon: ${lon}`);
    // Implement actual tracking logic here
  };

  const handleViewHistory = (deviceId: string) => {
    console.log(`Viewing history for device ${deviceId}`);
    // Implement logic to view history here
  };

  const handleCheckSafety = (deviceId: string) => {
    console.log(`Checking safety for device ${deviceId}`);
    // Implement safety check logic here
  };


  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 lg:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 lg:static lg:inset-auto transition duration-300 ease-in-out z-30 w-64 bg-gray-800 text-white flex-shrink-0`}
        >
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm z-10">
            <div className="flex items-center justify-between p-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>
              {/* Header Component */}
              <div className="flex-1"> {/* Adjust alignment if needed */}
                 <Header />
              </div>
            </div>
          </header>

          {/* Alert Component */}
          <Alert
            onTrack={handleTrack}
            onViewHistory={handleViewHistory}
            onCheckSafety={handleCheckSafety}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/cctv" element={<CCTVMonitoring />} />
              <Route path="/camera/:cameraId" element={<Camera />} />
              <Route path="/history/:cameraId" element={<History />} />
              <Route path="/tracking" element={<WorkerTracking />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/settings" element={<Settings />} />
              {/* Consider adding Home route if needed */}
              {/* <Route path="/home" element={<Home />} /> */}
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
