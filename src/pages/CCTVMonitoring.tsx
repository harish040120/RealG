import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';

const maxVertices = 4;
const serverUrl = 'http://localhost:5000';

type Detection = {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
};

const FRAME_INTERVAL = 50; // ms, ~5 FPS

const CCTVMonitoring: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [screenshot, setScreenshot] = useState<string>("");
  const [vertices, setVertices] = useState<[number, number][]>([]);
  const [tempVertices, setTempVertices] = useState<[number, number][]>([]);
  const [redZoneDefined, setRedZoneDefined] = useState(false);

  const [detections, setDetections] = useState<Detection[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [personAlert, setPersonAlert] = useState<{ count: number, visible: boolean }>({ count: 0, visible: false });
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // --- Main Detection Loop (Throttled) ---
  useEffect(() => {
    if (!hasPermission || isPaused) return;

    let stopped = false;

    const sendFrame = async () => {
      if (stopped) return;
      if (!canvasRef.current || !webcamRef.current?.video) return;

      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx || !video || !video.videoWidth || !video.videoHeight || video.readyState < 2) {
        timerRef.current = setTimeout(sendFrame, FRAME_INTERVAL);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      drawRedZone(ctx, vertices, tempVertices, redZoneDefined);

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
        if (!blob) {
          timerRef.current = setTimeout(sendFrame, FRAME_INTERVAL);
          return;
        }
        const formData = new FormData();
        formData.append('image', blob, 'frame.jpg');
        if (roiInfo) formData.append('roi', JSON.stringify(roiInfo));
        try {
          const response = await fetch(`${serverUrl}/detect`, { method: 'POST', body: formData });
          if (!response.ok) {
            setErrorMsg("Detection server error.");
            timerRef.current = setTimeout(sendFrame, FRAME_INTERVAL);
            return;
          }
          const result = await response.json();
          if (result.error) {
            setErrorMsg(result.error);
            timerRef.current = setTimeout(sendFrame, FRAME_INTERVAL);
            return;
          }
          setErrorMsg("");
          setDetections(result.detections || []);
        } catch (err) {
          setErrorMsg("Failed to fetch detection results.");
        }
        timerRef.current = setTimeout(sendFrame, FRAME_INTERVAL);
      }, 'image/jpeg', 0.7);
    };

    sendFrame();

    return () => {
      stopped = true;
      if (timerRef.current) clearTimeout(timerRef.current);
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
      // If no person detected, start a timer to hide the alert after 5 seconds
      if (personAlert.visible && alertTimeoutRef.current == null) {
        alertTimeoutRef.current = setTimeout(() => {
          setPersonAlert({ count: 0, visible: false });
        }, 5000);
      }
    }
    // Cleanup on unmount
    return () => {
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
    // eslint-disable-next-line
  }, [detections, redZoneDefined]);

  const personCount = redZoneDefined ? detections.filter(d => d.class === "Person").length : 0;

  return (
    <>
      {/* Global Alert */}
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
          {`A person (${personAlert.count}) is detected in red zone`}
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
          maxWidth: 800,
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
          }}>Camp 1 CCTV Monitoring</h2>
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
                  maxWidth: 720,
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
                  maxWidth: 720,
                  height: 400,
                  objectFit: 'cover',
                  background: '#000'
                }}
                width={720}
                height={400}
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
              width={720}
              height={400}
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
                ? `Person detected in Red Zone: ${personCount}`
                : `Draw a Red Zone and Resume to see person detection`}
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
      </div>
    </>
  );
};

export default CCTVMonitoring;