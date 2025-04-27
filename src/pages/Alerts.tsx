import { AlertTriangle, Bell, Shield } from 'lucide-react';

const alerts = [
  {
    id: 1,
    type: 'temperature',
    severity: 'critical',
    message: 'High Temperature Warning',
    details: 'Temperature exceeds 30°C in Zone B',
    timestamp: '2024-03-10T14:30:00',
  },
  {
    id: 2,
    type: 'airQuality',
    severity: 'critical',
    message: 'Critical Air Quality Alert',
    details: 'AQI above threshold in Zone C',
    timestamp: '2024-03-10T14:25:00',
  },
  {
    id: 3,
    type: 'safety',
    severity: 'warning',
    message: 'Safety Equipment Alert',
    details: 'Worker detected without helmet in Zone A',
    timestamp: '2024-03-10T14:20:00',
  }
];

const Alerts = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Active Alerts</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Filter by:</span>
            <select className="text-sm border rounded-lg px-3 py-2">
              <option value="all">All Alerts</option>
              <option value="critical">Critical Only</option>
              <option value="warning">Warnings Only</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 p-4 rounded ${
                alert.severity === 'critical'
                  ? 'bg-red-50 border-red-500'
                  : 'bg-yellow-50 border-yellow-500'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded ${
                  alert.severity === 'critical'
                    ? 'bg-red-100'
                    : 'bg-yellow-100'
                }`}>
                  {alert.type === 'temperature' && (
                    <AlertTriangle className={`h-5 w-5 ${
                      alert.severity === 'critical'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`} />
                  )}
                  {alert.type === 'airQuality' && (
                    <Bell className={`h-5 w-5 ${
                      alert.severity === 'critical'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`} />
                  )}
                  {alert.type === 'safety' && (
                    <Shield className={`h-5 w-5 ${
                      alert.severity === 'critical'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium ${
                      alert.severity === 'critical'
                        ? 'text-red-800'
                        : 'text-yellow-800'
                    }`}>
                      {alert.message}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${
                    alert.severity === 'critical'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}>
                    {alert.details}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Alerts;