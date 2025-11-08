
'use client';

import { useEffect, useState } from 'react';

export default function PostureMonitor() {
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [gnss, setGnss] = useState({ latitude: 0, longitude: 0, altitude: 0 });
  const [connected, setConnected] = useState(false);
  const [target, setTarget] = useState({ pitch: 0, roll: 0 });
  const [showLog, setShowLog] = useState(false);
  const [log, setLog] = useState([]);

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
  const getColorClass = (progress) => {
    if (progress < 10) return 'status-good';
    if (progress < 30) return 'status-warning';
    return 'status-bad';
  };

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:2003');
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.imu) {
          const p = parseFloat(data.imu.pitch) || 0;
          const r = parseFloat(data.imu.roll) || 0;
          const y = parseFloat(data.imu.yaw) || 0;
          setPitch(p);
          setRoll(r);
          setYaw(y);

          // Log every 2 seconds
          if (Math.random() < 0.1) {
            setLog(prev => [...prev.slice(-50), {
              time: new Date().toLocaleTimeString(),
              pitch: p.toFixed(2),
              roll: r.toFixed(2),
              yaw: y.toFixed(2),
            }]);
          }
        }
        if (data.gnss) {
          setGnss({
            latitude: data.gnss.latitude,
            longitude: data.gnss.longitude,
            altitude: data.gnss.altitude,
          });
        }
      } catch (err) {
        console.error('Parse error:', err);
      }
    };

    return () => ws.close();
  }, []);

  const xOffset = clamp(roll, -100, 100);
  const yOffset = clamp(pitch, -100, 100);




const handleSaveToFile = () => {
  const timestamp = new Date().toLocaleString();
  const content = `
==== Artillery Pointing Log ====
Timestamp : ${timestamp}

IMU Data:
  Pitch (Y): ${pitch.toFixed(2)}°
  Roll  (X): ${roll.toFixed(2)}°
  Yaw   (Z): ${yaw.toFixed(2)}°

GNSS Data:
  Latitude : ${gnss.latitude.toFixed(6)}
  Longitude: ${gnss.longitude.toFixed(6)}
  Altitude : ${gnss.altitude?.toFixed(2)} m

Target Reference:
  Pitch Target: ${target.pitch.toFixed(2)}°
  Roll Target : ${target.roll.toFixed(2)}°
-----------------------------------------
`;

  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `PostureData_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
};

const handleSetTarget = () => {
  setTarget({ pitch, roll });
  alert('Target set to current posture and data saved!');
  handleSaveToFile();
};



  return (
    <div className="relative h-screen w-screen text-white overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e3c72] via-[#2a5298] to-[#1e3c72]" />


<header className="header">
  <div className="title">Artillery Pointing System</div>

  <div className="status-container">
    <span className="status-label">WebSocket:</span>
    <span
      className={`status-badge ${connected ? 'status-connected' : 'status-disconnected'}`}
    >
      {connected ? 'Connected' : 'Disconnected'}
    </span>
  </div>

  {/* SET Button (New) */}
  <button
    onClick={handleSetTarget}
    className="ml-auto px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-full shadow-lg shadow-yellow-400/40 transition-all duration-300"
    style={{ marginLeft: 'auto', marginRight: '10px' }}
  >
    SET
  </button>
</header>


{/* MAIN SECTION — Two separate info cards */}
<main className="main-content" style={{ transform: 'translate(-40%, -65%)' }}>
  <div className="flex flex-col gap-6 items-center">

   
    {/* === IMU DATA CARD === */}
    <div className="data-card imu-card">
      <h3 className="text-lg font-bold text-yellow-400 mb-3 text-center">IMU Data</h3>
      <div className="data-row">
        <div className="data-item">
          <div className="data-label">Pitch (Y-Axis)</div>
          <div className="data-value">{pitch.toFixed(2)}°</div>
        </div>
        <div className="divider" />
        <div className="data-item">
          <div className="data-label">Roll (X-Axis)</div>
          <div className="data-value">{roll.toFixed(2)}°</div>
        </div>
        <div className="divider" />
        <div className="data-item">
          <div className="data-label">Yaw (Z-Axis)</div>
          <div className="data-value">{yaw.toFixed(2)}°</div>
        </div>
      </div>
    </div>

    {/* === GNSS DATA CARD === */}
    <div className="data-card gnss-card">
      <h3 className="text-lg font-bold text-yellow-400 mb-3 text-center">GNSS Data</h3>
      <div className="data-row justify-center">
        <div className="data-item text-center">
          <div className="data-label">Latitude</div>
          <div className="data-value text-2xl">{gnss.latitude.toFixed(6)}</div>
        </div>
        <div className="divider" />
        <div className="data-item text-center">
          <div className="data-label">Longitude</div>
          <div className="data-value text-2xl">{gnss.longitude.toFixed(6)}</div>
        </div>
        <div className="divider" />
        <div className="data-item text-center">
          <div className="data-label">Altitude</div>
          <div className="data-value text-2xl">{gnss.altitude?.toFixed(2) || "0.00"} m</div>
        </div>
      </div>
    </div>

  </div>
</main>


{/* Y-AXIS BAR - Symmetric (center-based) */}
<aside className="y-axis-sidebar" style={{ top: '20%' }}>
  <div className="axis-label">Y-Axis</div>
  <div className="absolute -top-8 right-[45px] text-yellow-300 text-base font-bold">+</div>

  <div className="bar-vertical-wrapper">
    <div className="bar-vertical-track">

      {/* Center reference line */}
      <div className="bar-center-line-vertical" />

      {/* Dynamic fill — symmetric around center */}
      <div
        className={`bar-vertical-fill ${getColorClass(Math.abs(yOffset))}`}

      style={{
      height: `${Math.abs(yOffset)}%`,
      top: yOffset >= 0 ? `calc(50% - ${Math.abs(yOffset)}%)` : '50%',
      }}
      />
    </div>
  </div>

  <div className="absolute -bottom-8 right-[45px] text-yellow-300 text-base font-bold">–</div>
  <div className="absolute right-[-110px] top-1/2 -translate-y-1/2 text-sm font-mono text-gray-200 leading-5">
    <div>Actual: {pitch.toFixed(2)}°</div>
    <div>Target: {target.pitch.toFixed(2)}°</div>
  </div>
  <div className="axis-percentage">{yOffset.toFixed(1)}%</div>
</aside>









{/* X-AXIS BAR — Center-based with side indicators */}
<div className="x-axis-bar">
  <div className="axis-label mb-2 text-center">X-Axis</div>

  <div className="relative w-[80%] mx-auto bar-horizontal-track">
    {/* Center reference line */}
    <div className="bar-center-line" />

    {/* Fill bar */}
    <div
      className={`bar-horizontal-fill ${getColorClass(Math.abs(xOffset))}`}
      style={{
        width: `${Math.abs(xOffset)}%`,
        left: xOffset >= 0 ? '50%' : `${50 + xOffset}%`,
      }}
      />

    
  </div>

  {/* Data below the bar */}
  <div className="text-sm font-mono text-gray-200 text-center mt-4">
    <div>Actual: {roll.toFixed(2)}°</div>
    <div>Target: {target.roll.toFixed(2)}°</div>
    <div className="text-yellow-400 font-bold mt-1">{xOffset.toFixed(1)}%</div>
  </div>
</div>


      {/* LOG MODAL */}
      {showLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowLog(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Posture Log</h3>
            <table className="w-full text-xs font-mono text-gray-300">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="text-left py-2">Time</th>
                  <th className="text-center">Pitch</th>
                  <th className="text-center">Roll</th>
                  <th className="text-center">Yaw</th>
                </tr>
              </thead>
              <tbody>
                {log.map((entry, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-1">{entry.time}</td>
                    <td className="text-center">{entry.pitch}°</td>
                    <td className="text-center">{entry.roll}°</td>
                    <td className="text-center">{entry.yaw}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => setShowLog(false)}
              className="mt-4 w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-bold rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}







