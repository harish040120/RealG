
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Thermometer, Droplets, Wind, AlertTriangle } from 'lucide-react';

const mockSensorData = [
  { time: '00:00', temperature: 24, humidity: 45, airQuality: 85 },
  { time: '01:00', temperature: 23, humidity: 46, airQuality: 87 },
  { time: '02:00', temperature: 23, humidity: 48, airQuality: 86 },
  { time: '03:00', temperature: 22, humidity: 47, airQuality: 88 },
  { time: '04:00', temperature: 24, humidity: 45, airQuality: 84 },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Environmental Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Thermometer className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Temperature</p>
              <h3 className="text-2xl font-bold">24°C</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Droplets className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Humidity</p>
              <h3 className="text-2xl font-bold">45%</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Wind className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Air Quality</p>
              <h3 className="text-2xl font-bold">85</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Data Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Sensor Readings</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockSensorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="temperature" stroke="#3B82F6" name="Temperature (°C)" />
              <Line type="monotone" dataKey="humidity" stroke="#10B981" name="Humidity (%)" />
              <Line type="monotone" dataKey="airQuality" stroke="#8B5CF6" name="Air Quality" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Active Alerts</h2>
        <div className="space-y-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-red-800 font-medium">High Temperature Warning</p>
                <p className="text-red-600 text-sm">Zone B - Temperature exceeds 30°C</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-red-800 font-medium">Critical Air Quality Alert</p>
                <p className="text-red-600 text-sm">Zone C - AQI above threshold</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;