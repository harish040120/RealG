import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const maxVertices = 4;
const serverUrl = 'http://localhost:5000';
 // Target 30 FPS for drawing
 // Send frame for detection every 1000ms (1 FPS)

type Detection = {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
};

type DetectionSummary = {
  persons: number;
  noHardhats: number;
  noMasks: number;
  noVests: number;
  hasMask: number;
  violations: number;
};

type ViolationHistory = {
  timestamp: string;
  violations: Detection[];
  image?: string;
};

const FRAME_INTERVAL = 1000 / 30; // Target 30 FPS
const DETECTION_INTERVAL = 1000;
const VIOLATION_HISTORY_LIMIT = 20;

const CCTVMonitoring: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastSentTime = useRef<number>(0);

  const [isPaused, setIsPaused] = useState(false);
  const [screenshot, setScreenshot] = useState<string>("");
  const [vertices, setVertices] = useState<[number, number][]>([]);
  const [tempVertices, setTempVertices] = useState<[number, number][]>([]);
  const [redZoneDefined, setRedZoneDefined] = useState(false);

  const [detections, setDetections] = useState<Detection[]>([]);
  const [detectionSummary, setDetectionSummary] = useState<DetectionSummary>({
    persons: 0,
    noHardhats: 0,
    noMasks: 0,
    noVests: 0,
    hasMask: 0,
    violations: 0
  });
  const [violationHistory, setViolationHistory] = useState<ViolationHistory[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [personAlert, setPersonAlert] = useState<{ count: number, visible: boolean }>({ count: 0, visible: false });
  const [violationAlert, setViolationAlert] = useState<{ count: number, visible: boolean }>({ count: 0, visible: false });
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const violationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Utility: Draw Red Zone Overlay ---
  const drawRedZone = (
    ctx: CanvasRenderingContext2D,
    vertices: [number, number][],
    tempVertices: [number, number][],
    isDefined: boolean
  ) => {
    ctx.save();
    if (isDefined && vertices.length === maxVertices) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.moveTo(vertices[0][0], vertices[0][1]);
      for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i][0], vertices[i][1]);
      ctx.closePath();
      ctx.fill();
      vertices.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      });
    } else if (tempVertices.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.moveTo(tempVertices[0][0], tempVertices[0][1]);
      for (let i = 1; i < tempVertices.length; i++) ctx.lineTo(tempVertices[i][0], tempVertices[i][1]);
      ctx.stroke();
      tempVertices.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      });
    }
    ctx.restore();
  };

  // --- Utility: Draw Detections ---
  const drawDetections = (ctx: CanvasRenderingContext2D, detections: Detection[]) => {
    ctx.save();
    detections.forEach(det => {
      const [x1, y1, x2, y2] = det.bbox;
      const width = x2 - x1;
      const height = y2 - y1;
      
      let color = '#00FF00';
      if (det.class === 'NO-Hardhat') color = '#FFA500';
      if (det.class === 'NO-Mask') color = '#FFFF00';
      if (det.class === 'NO-Safety Vest') color = '#FF0000';
      if (det.class === 'Mask') color = '#00FFFF';
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, width, height);
      
      ctx.fillStyle = color;
      const text = `${det.class} ${(det.confidence * 100).toFixed(0)}%`;
      const textWidth = ctx.measureText(text).width;
      ctx.fillRect(x1, y1 - 20, textWidth + 10, 20);
      
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.fillText(text, x1 + 5, y1 - 5);
    });
    ctx.restore();
  };

  // --- Utility: Crop to Red Zone Polygon (bounding box) ---
  const cropToRedZone = (imageData: ImageData, vertices: [number, number][]) => {
    if (vertices.length !== 4) return null;
    let minX = Math.min(...vertices.map(v => v[0]));
    let minY = Math.min(...vertices.map(v => v[1]));
    let maxX = Math.max(...vertices.map(v => v[0]));
    let maxY = Math.max(...vertices.map(v => v[1]));
    minX = Math.max(0, Math.floor(minX));
    minY = Math.max(0, Math.floor(minY));
    maxX = Math.min(imageData.width, Math.ceil(maxX));
    maxY = Math.min(imageData.height, Math.ceil(maxY));
    const width = maxX - minX;
    const height = maxY - minY;
    if (width <= 0 || height <= 0) return null;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return null;
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = imageData.width;
    srcCanvas.height = imageData.height;
    const srcCtx = srcCanvas.getContext('2d');
    if (!srcCtx) return null;
    srcCtx.putImageData(imageData, 0, 0);
    offCtx.drawImage(srcCanvas, minX, minY, width, height, 0, 0, width, height);
    return { canvas: offCanvas, offset: { x: minX, y: minY }, width, height };
  };

  // Update detection summary whenever detections change
  useEffect(() => {
    const summary = {
      persons: detections.filter(d => d.class === "Person").length,
      noHardhats: detections.filter(d => d.class === "NO-Hardhat").length,
      noMasks: detections.filter(d => d.class === "NO-Mask").length,
      noVests: detections.filter(d => d.class === "NO-Safety Vest").length,
      hasMask: detections.filter(d => d.class === "Mask").length,
      violations: detections.filter(d => 
        ["NO-Hardhat", "NO-Mask", "NO-Safety Vest"].includes(d.class)
      ).length
    };
    setDetectionSummary(summary);
  }, [detections]);

  // Fetch violation history
  useEffect(() => {
    const fetchViolations = async () => {
      try {
        const response = await fetch(`${serverUrl}/violations`);
        if (response.ok) {
          const data = await response.json();
          setViolationHistory(data.violations.slice(-VIOLATION_HISTORY_LIMIT));
        }
      } catch (err) {
        console.error("Failed to fetch violations:", err);
      }
    };
    
    fetchViolations();
    const interval = setInterval(fetchViolations, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // --- Main Detection Loop (Optimized) ---
  useEffect(() => {
    if (!hasPermission || isPaused) return;

    const processFrame = async (timestamp: number) => {
      if (!canvasRef.current || !webcamRef.current?.video) {
        animationRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx || !video || !video.videoWidth || !video.videoHeight || video.readyState < 2) {
        animationRef.current = requestAnimationFrame(processFrame);
        return;
      }
      
      // Set canvas dimensions once
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Draw overlays
      drawRedZone(ctx, vertices, tempVertices, redZoneDefined);
      drawDetections(ctx, detections);

      // Throttle frame sending
      const now = Date.now();
      if (now - lastSentTime.current >= DETECTION_INTERVAL) {
        lastSentTime.current = now;
        
        let sendCanvas = canvas;
        let roiInfo: any = undefined;
        
        if (redZoneDefined && vertices.length === 4) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const cropped = cropToRedZone(imageData, vertices);
          if (cropped) {
            sendCanvas = cropped.canvas;
            roiInfo = {
              originalSize: { width: canvas.width, height: canvas.height },
              roi: vertices,
              offset: cropped.offset,
              width: cropped.width,
              height: cropped.height
            };
          }
        }

        sendCanvas.toBlob(async (blob) => {
          if (!blob) return;
          
          const formData = new FormData();
          formData.append('image', blob, 'frame.jpg');
          if (roiInfo) formData.append('roi', JSON.stringify(roiInfo));
          
          try {
            const response = await fetch(`${serverUrl}/detect`, { 
              method: 'POST', 
              body: formData 
            });
            
            if (!response.ok) {
              setErrorMsg("Detection server error.");
              return;
            }
            
            const result = await response.json();
            if (result.error) {
              setErrorMsg(result.error);
              return;
            }
            
            setErrorMsg("");
            setDetections(result.detections || []);
            
            if (result.violation_count > 0) {
              setViolationAlert({ count: result.violation_count, visible: true });
              if (violationTimeoutRef.current) clearTimeout(violationTimeoutRef.current);
              violationTimeoutRef.current = setTimeout(() => {
                setViolationAlert({ count: 0, visible: false });
              }, 5000);
            }
          } catch (err) {
            setErrorMsg("Failed to fetch detection results.");
          }
        }, 'image/jpeg', 0.7);
      }

      animationRef.current = requestAnimationFrame(processFrame);
    };

    animationRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hasPermission, isPaused, vertices, redZoneDefined]);

  // --- Camera Access ---
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setHasPermission(true))
      .catch(() => alert("Unable to access the camera. Please check your permissions."));
  }, []);

  // --- Red Zone Drawing ---
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPaused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (redZoneDefined && tempVertices.length === 0) {
      setRedZoneDefined(false);
      setVertices([]);
    }
    if (tempVertices.length < maxVertices) setTempVertices(prev => [...prev, [x, y]]);
    if (tempVertices.length === maxVertices - 1) {
      setVertices([...tempVertices, [x, y]]);
      setRedZoneDefined(true);
      setTempVertices([]);
    }
  };

  // --- Pause/Resume ---
  const togglePause = () => {
    if (!isPaused) {
      if (webcamRef.current) {
        const shot = webcamRef.current.getScreenshot();
        if (shot) setScreenshot(shot);
      }
      setIsPaused(true);
    } else {
      setIsPaused(false);
      setScreenshot("");
      setTempVertices([]);
    }
  };

  // --- Person Alert Logic ---
  useEffect(() => {
    if (!redZoneDefined) {
      setPersonAlert({ count: 0, visible: false });
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
      return;
    }
    const personCount = detections.filter(d => d.class === "Person").length;
    if (personCount > 0) {
      setPersonAlert({ count: personCount, visible: true });
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = setTimeout(() => {
        setPersonAlert({ count: 0, visible: false });
      }, 5000);
    } else {
      if (personAlert.visible && alertTimeoutRef.current == null) {
        alertTimeoutRef.current = setTimeout(() => {
          setPersonAlert({ count: 0, visible: false });
        }, 5000);
      }
    }
    return () => {
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, [detections, redZoneDefined]);

  // Prepare data for violation trend chart
  const violationTrendData = {
    labels: violationHistory.map((_, i) => i + 1),
    datasets: [
      {
        label: 'Safety Violations',
        data: violationHistory.map(v => v.violations.length),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1
      }
    ]
  };

  return (
    <>
      {/* Global Alerts */}
      {personAlert.visible && (
        <div style={{
          position: 'fixed',
          top: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: '#ff3333',
          color: '#fff',
          padding: '18px 36px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 22,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          textAlign: 'center',
          letterSpacing: 1.5,
          animation: 'fadeIn 0.4s'
        }}>
          {`Person detected in red zone (${personAlert.count})`}
        </div>
      )}

      {violationAlert.visible && (
        <div style={{
          position: 'fixed',
          top: 90,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9998,
          background: '#ff8c00',
          color: '#fff',
          padding: '18px 36px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 22,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          textAlign: 'center',
          letterSpacing: 1.5,
          animation: 'fadeIn 0.4s'
        }}>
          {`Safety violation detected! (${violationAlert.count} issues)`}
        </div>
      )}

      <div style={{
        background: '#10141a',
        minHeight: '100vh',
        padding: 0,
        margin: 0,
        fontFamily: 'Segoe UI, Arial, sans-serif'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '40px auto',
          background: '#181c23',
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          padding: 24,
          border: '2px solid #232b39'
        }}>
          <h2 style={{
            color: '#fff',
            textAlign: 'center',
            letterSpacing: 2,
            fontWeight: 700,
            marginBottom: 24,
            textShadow: '0 2px 8px #000'
          }}>Construction Site Safety Monitoring</h2>
          
          <div style={{ display: 'flex', gap: 24 }}>
            {/* Left Column - Camera Feed */}
            <div style={{ flex: 2 }}>
              <div style={{
                position: 'relative',
                borderRadius: 12,
                overflow: 'hidden',
                border: '4px solid #222',
                boxShadow: '0 2px 16px #000a'
              }}>
                {isPaused && screenshot ? (
                  <img src={screenshot} alt="Paused frame"
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 400,
                      objectFit: 'cover',
                      background: '#000'
                    }} />
                ) : (
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 400,
                      objectFit: 'cover',
                      background: '#000'
                    }}
                    videoConstraints={{ width: 720, height: 400, facingMode: "user" }}
                  />
                )}
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: isPaused ? 'auto' : 'none'
                  }}
                />
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 18
              }}>
                <div>
                  <button
                    onClick={() => { setRedZoneDefined(false); setVertices([]); setTempVertices([]); }}
                    style={{
                      background: 'linear-gradient(90deg,#1e90ff,#00bfff)',
                      color: '#fff',
                      padding: '10px 22px',
                      border: 'none',
                      borderRadius: 6,
                      fontWeight: 600,
                      marginRight: 12,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px #0003'
                    }}>
                    Reset Zone
                  </button>
                  <button
                    onClick={togglePause}
                    style={{
                      background: isPaused
                        ? 'linear-gradient(90deg,#28a745,#218838)'
                        : 'linear-gradient(90deg,#e74c3c,#c0392b)',
                      color: '#fff',
                      padding: '10px 22px',
                      border: 'none',
                      borderRadius: 6,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px #0003'
                    }}>
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                </div>
                <div style={{ color: '#fff', fontWeight: 500, fontSize: 16 }}>
                  {redZoneDefined
                    ? `Active monitoring (${detectionSummary.persons} person(s)`
                    : `Draw a Red Zone and Resume to begin monitoring`}
                </div>
              </div>

              {errorMsg && (
                <div style={{
                  marginTop: 14,
                  color: '#ff4d4f',
                  background: '#2c1a1a',
                  padding: 10,
                  borderRadius: 6,
                  fontWeight: 600
                }}>
                  {errorMsg}
                </div>
              )}
              
              {isPaused && (
                <div style={{
                  marginTop: 18,
                  background: '#1a232e',
                  padding: '14px 18px',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 500,
                  fontSize: 15,
                  boxShadow: '0 2px 8px #0002'
                }}>
                  <p style={{ margin: 0 }}>Click 4 points to define a Red Zone. Detection will happen only inside this zone after resume.</p>
                  <p style={{ margin: 0 }}>Current points: {tempVertices.length} / 4</p>
                </div>
              )}
            </div>
            
            {/* Right Column - Stats and History */}
            <div style={{ flex: 1 }}>
              {/* Safety Status Card */}
              <div style={{
                background: '#1a232e',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                boxShadow: '0 2px 8px #0003'
              }}>
                <h3 style={{ color: '#fff', marginTop: 0, marginBottom: 16 }}>Safety Status</h3>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  paddingBottom: 12,
                  borderBottom: '1px solid #2a3a4d'
                }}>
                  <span style={{ color: '#fff' }}>Persons in Zone:</span>
                  <span style={{ 
                    color: detectionSummary.persons > 0 ? '#ff6b6b' : '#66ff66',
                    fontWeight: 600
                  }}>
                    {detectionSummary.persons}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  paddingBottom: 12,
                  borderBottom: '1px solid #2a3a4d'
                }}>
                  <span style={{ color: '#fff' }}>Without Hardhat:</span>
                  <span style={{ 
                    color: detectionSummary.noHardhats > 0 ? '#ff6b6b' : '#66ff66',
                    fontWeight: 600
                  }}>
                    {detectionSummary.noHardhats}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  paddingBottom: 12,
                  borderBottom: '1px solid #2a3a4d'
                }}>
                  <span style={{ color: '#fff' }}>Without Mask:</span>
                  <span style={{ 
                    color: detectionSummary.noMasks > 0 ? '#ff6b6b' : '#66ff66',
                    fontWeight: 600
                  }}>
                    {detectionSummary.noMasks}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: 12
                }}>
                  <span style={{ color: '#fff' }}>Without Vest:</span>
                  <span style={{ 
                    color: detectionSummary.noVests > 0 ? '#ff6b6b' : '#66ff66',
                    fontWeight: 600
                  }}>
                    {detectionSummary.noVests}
                  </span>
                </div>
                
                <div style={{ 
                  background: detectionSummary.violations > 0 ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 0, 0.2)',
                  padding: 12,
                  borderRadius: 8,
                  textAlign: 'center',
                  marginTop: 16
                }}>
                  <span style={{ 
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 18
                  }}>
                    {detectionSummary.violations > 0 
                      ? `${detectionSummary.violations} Safety Violations!` 
                      : 'All Safety Protocols Followed'}
                  </span>
                </div>
              </div>
              
              {/* Violation Trend Chart */}
              <div style={{
                background: '#1a232e',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                boxShadow: '0 2px 8px #0003'
              }}>
                <h3 style={{ color: '#fff', marginTop: 0, marginBottom: 16 }}>Violation Trend</h3>
                <div style={{ height: 200 }}>
                  <Line 
                    data={violationTrendData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: { enabled: true }
                      },
                      scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.1)' } },
                        y: { 
                          beginAtZero: true,
                          grid: { color: 'rgba(255,255,255,0.1)' }
                        }
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* Recent Violations */}
              <div style={{
                background: '#1a232e',
                borderRadius: 12,
                padding: 16,
                boxShadow: '0 2px 8px #0003'
              }}>
                <h3 style={{ color: '#fff', marginTop: 0, marginBottom: 16 }}>Recent Violations</h3>
                {violationHistory.length > 0 ? (
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {violationHistory.map((violation, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,0,0,0.1)',
                        padding: 8,
                        borderRadius: 6,
                        marginBottom: 8
                      }}>
                        <div style={{ color: '#ff6b6b', fontWeight: 600 }}>
                          {new Date(violation.timestamp).toLocaleTimeString()}
                        </div>
                        <div style={{ color: '#fff', fontSize: 14 }}>
                          {violation.violations.map(v => v.class).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#aaa', textAlign: 'center', padding: 16 }}>
                    No recent safety violations detected
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CCTVMonitoring;