export interface SensorData {
  temperature: number;
  humidity: number;
  airQuality: number;
  timestamp: string;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
  location: {
    lat: number;
    lng: number;
  };
  lastSeen: string;
}

export interface Alert {
  id: string;
  type: 'temperature' | 'airQuality' | 'safety';
  message: string;
  severity: 'warning' | 'critical';
  zone: string;
  timestamp: string;
}

export interface AttendanceRecord {
  workerId: string;
  workerName: string;
  checkIn: string;
  checkOut: string | null;
  status: 'present' | 'absent';
}