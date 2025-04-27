import React, { useEffect, useState } from "react";
import { FaExclamationTriangle, FaHistory, FaUserShield } from "react-icons/fa";
import { MdDirections, MdSafetyDivider } from "react-icons/md";
import alertSound from "../assets/alert.mp3";
import "../Alert.css";

interface AlertData {
  device_id: string;
  lat: number;
  lon: number;
  battery?: number;
  timestamp: string;
}

const Alert: React.FC<{ 
  onTrack: (lat: number, lon: number, deviceId?: string) => void;
  onViewHistory: (deviceId: string) => void;
  onCheckSafety: (deviceId: string) => void;
}> = ({ onTrack, onViewHistory, onCheckSafety }) => {
  const [alert, setAlert] = useState<AlertData | null>(null);
  const [visible, setVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAlert = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("https://realgbackend-production.up.railway.app/api/alert", {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      setConnectionError(false);

      if (data.alert) {
        const newAlert = {
          ...data.alert,
          lat: parseFloat(data.alert.lat),
          lon: parseFloat(data.alert.lon),
          timestamp: data.alert.timestamp || new Date().toISOString()
        };
        setAlert(newAlert);
        setVisible(true);

        if (!isMuted) {
          const audio = new Audio(alertSound);
          audio.play().catch((e) => console.error("Audio play failed:", e));
        }
      }
    } catch (error) {
      console.error("Error fetching alert:", error);
      setConnectionError(true);
      await new Promise(resolve => setTimeout(resolve, 5000));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const setupPolling = async () => {
      await fetchAlert();
      intervalId = setInterval(fetchAlert, 10000);
    };

    setupPolling();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isMuted]);

  const handleDismiss = async () => {
    try {
      await fetch("http://localhost:3000/api/alert/clear", {
        method: "POST",
      });
      setVisible(false);
      setAlert(null);
    } catch (error) {
      console.error("Error clearing alert:", error);
    }
  };

  const handleTrack = () => alert && onTrack(alert.lat, alert.lon, alert.device_id);
  const handleViewHistory = () => alert?.device_id && onViewHistory(alert.device_id);
  const handleCheckSafety = () => alert?.device_id && onCheckSafety(alert.device_id);

  if (connectionError) {
    return (
      <div className="connection-error">
        ⚠️ Unable to connect to safety monitoring server. Retrying...
      </div>
    );
  }

  return (
    /*
    visible && alert && (
      <div className="alert-popup">
        <div className="alert-header">
          <FaExclamationTriangle className="alert-icon" />
          <div className="alert-title">🚨 WORKER SOS ALERT</div>
          <button 
            className="mute-button"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute alerts" : "Mute alerts"}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
        </div>

        <div className="alert-content">
          <div className="alert-row">
            <span className="alert-label">Worker ID:</span>
            <span className="alert-value">{alert.device_id}</span>
          </div>
          <div className="alert-row">
            <span className="alert-label">Coordinates:</span>
            <span className="alert-value">{alert.lat.toFixed(6)}, {alert.lon.toFixed(6)}</span>
          </div>
          <div className="alert-row">
            <span className="alert-label">Time:</span>
            <span className="alert-value">{new Date(alert.timestamp).toLocaleTimeString()}</span>
          </div>
          {alert.battery !== undefined && (
            <div className="alert-row">
              <span className="alert-label">Battery:</span>
              <span className={`alert-value ${alert.battery < 20 ? 'low-battery' : ''}`}>
                {alert.battery}%
              </span>
            </div>
          )}
        </div>

        <div className="alert-buttons">
          <button className="track-button" onClick={handleTrack}>
            <MdDirections /> Track
          </button>
          <button className="safety-button" onClick={handleCheckSafety}>
            <MdSafetyDivider /> Safety Check
          </button>
          <button className="history-button" onClick={handleViewHistory}>
            <FaHistory /> History
          </button>
          <button className="dismiss-button" onClick={handleDismiss}>
            ❌ Dismiss
          </button>
        </div>
      </div>
    )
    */
   null
  );
};

export default Alert;