

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

  // === WebSocket setup and smooth IMU update ===
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

          // Smooth transition toward new roll/pitch values
          setPitch((prev) => prev + (p - prev) * 0.1);
          setRoll((prev) => prev + (r - prev) * 0.1);
          
          setYaw((prev) => prev + (y - prev) * 0.1);

          // Occasional log updates
          if (Math.random() < 0.1) {
            setLog((prev) => [
              ...prev.slice(-50),
              {
                time: new Date().toLocaleTimeString(),
                pitch: p.toFixed(2),
                roll: r.toFixed(2),
                yaw: y.toFixed(2),
              },
            ]);
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

  // Reset pitch/yaw when very close to target
  const rollError = roll - target.roll;
  const pitchError = pitch - target.pitch;

  useEffect(() => {
  if (Math.abs(rollError) < 0.05 && Math.abs(pitchError) < 0.05) {
    // Pause when actual = target
    console.log('✅ Target reached. Waiting for SET click...');
  }
}, [rollError, pitchError]);

  // === Calculate bar offsets ===
  const maxDeviation = 3; // degrees
  const xOffset = clamp((rollError / maxDeviation) * 100, -100, 100);
  const yOffset = clamp((pitchError / maxDeviation) * 100, -100, 100);

  // === Save current data to file ===
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

  // === Set target to current posture ===
  const handleSetTarget = () => {
    setTarget({ pitch, roll });
    alert('Target set to current posture and data saved!');
    handleSaveToFile();
  };

  return (
    <div className="relative h-screen w-screen text-white overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e3c72] via-[#2a5298] to-[#1e3c72]" />

      {/* HEADER */}
      <header className="header">
        <div className="title">Artillery Pointing System</div>

        <div className="status-container">
          <span className="status-label">WebSocket:</span>
          <span
            className={`status-badge ${
              connected ? 'status-connected' : 'status-disconnected'
            }`}
          >
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Present Position Button */}
        <Link href="/PresentPos">
          <button className="ml-3 px-4 py-2 bg-green-400 hover:bg-green-500 text-black font-bold rounded-full shadow-lg shadow-green-400/40 transition-all duration-300">
            Present Position
          </button>
        </Link>

        {/* SET Button */}
        <button
          onClick={handleSetTarget}
          className="ml-auto px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-full shadow-lg shadow-yellow-400/40 transition-all duration-300"
          style={{ marginLeft: 'auto', marginRight: '10px' }}
        >
          SET
        </button>
      </header>

      {/* MAIN SECTION */}
      <main className="main-content" style={{ transform: 'translate(-40%, -65%)' }}>
        <div className="flex flex-col gap-6 items-center">
          {/* === IMU DATA CARD === */}
          <div className="data-card imu-card">
            <h3 className="text-lg font-bold text-yellow-400 mb-3 text-center">
              IMU Data
            </h3>
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
            <h3 className="text-lg font-bold text-yellow-400 mb-3 text-center">
              GNSS Data
            </h3>
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
                <div className="data-value text-2xl">
                  {gnss.altitude?.toFixed(2) || '0.00'} m
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>


      {/* === Y-AXIS BAR === */}
      <aside className="y-axis-sidebar" style={{ top: '20%' }}>
        <div className="axis-label">Y-Axis</div>
        <div className="absolute -top-8 right-[45px] text-yellow-300 text-base font-bold">
          +
        </div>

        <div className="bar-vertical-wrapper">
          <div className="bar-vertical-track">
            {/* Center reference line */}
            <div className="bar-center-line-vertical" />

            {/* Dynamic fill — symmetric around center */}
            <div
              className={`bar-vertical-fill ${getColorClass(Math.abs(yOffset))}`}
              style={{
                height: `${Math.abs(yOffset)}%`,
                top:
                  yOffset >= 0
                    ? `calc(50% - ${Math.abs(yOffset)}%)`
                    : '50%',
              }}
            />
          </div>
        </div>

        <div className="absolute -bottom-8 right-[45px] text-yellow-300 text-base font-bold">
          –
        </div>
        <div className="absolute right-[-110px] top-1/2 -translate-y-1/2 text-sm font-mono text-gray-200 leading-5">
          <div>Actual: {pitch.toFixed(2)}°</div>
          <div>Target: {target.pitch.toFixed(2)}°</div>
        </div>
        <div className="axis-percentage">{yOffset.toFixed(1)}%</div>
      </aside>

      {/* === X-AXIS BAR === */}
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
          <div className="text-yellow-400 font-bold mt-1">
            {xOffset.toFixed(1)}%
          </div>
        </div>
      </div>


    </div>
  );
}


// 'use client';

// import { useEffect, useState } from 'react';

// export default function PostureMonitor() {
//   const [roll, setRoll] = useState(0);
//   const [target, setTarget] = useState(0);
//   const [connected, setConnected] = useState(false);
//   const [running, setRunning] = useState(false);

//   const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
//   const getColorClass = (progress) => {
//     if (progress < 20) return 'bg-green-400';
//     if (progress < 60) return 'bg-yellow-400';
//     return 'bg-red-500';
//   };

//   // === WebSocket Connection ===
//   useEffect(() => {
//     const ws = new WebSocket('ws://localhost:2003');
//     ws.onopen = () => setConnected(true);
//     ws.onclose = () => setConnected(false);
//     ws.onerror = () => setConnected(false);

//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       if (data.imu && typeof data.imu.roll === 'number') {
//         const newRoll = clamp(data.imu.roll, -10, 10);
//         setRoll(newRoll);

//         // Ignore when both stable
//         if (newRoll === 0 && target === 0) return;

//         // When roll changes significantly, start auto-return to zero
//         if (Math.abs(newRoll - target) > 1) {
//           setTarget(newRoll);
//           setRunning(true);
//         }
//       }
//     };

//     return () => ws.close();
//   }, [target]);

//   // === Auto return to zero ===
//   useEffect(() => {
//     if (!running) return;
//     let current = target;
//     const step = target / 40; // smoothness
//     const timer = setInterval(() => {
//       current -= step;
//       if ((target > 0 && current <= 0) || (target < 0 && current >= 0)) {
//         current = 0;
//         clearInterval(timer);
//         setRunning(false);
//       }
//       setTarget(current);
//     }, 50);

//     return () => clearInterval(timer);
//   }, [running]);

//   // === Manual SET Button ===
//   const handleSetTarget = () => {
//     if (roll === 0 && target === 0) {
//       alert('System stable and waiting for IMU input...');
//     } else {
//       setRoll(0);
//       setTarget(0);
//       setRunning(false);
//       alert('System manually centered.');
//     }
//   };

//   // === Bar Range ===
//   const maxRange = 10;
//   const xOffset = clamp((target / maxRange) * 50, -50, 50); // % offset from center
//   const fillWidth = Math.abs((target / maxRange) * 50); // bar fill percentage

//   // === Scale Labels ===
//   const ticks = [];
//   for (let i = -10; i <= 10; i++) ticks.push(i);

//   return (
    
//     <div className="relative h-screen w-screen text-white overflow-hidden">
//       {/* Background */}
//       <div className="absolute inset-0 bg-gradient-to-br from-[#1e3c72] via-[#2a5298] to-[#1e3c72]" />

//       {/* Header */}
//       <header className="flex justify-between items-center p-4">
//         <h1 className="text-xl font-bold text-yellow-400">
//           X-Axis Roll Monitor (–10° to +10°)
//         </h1>
//         <div>
//           <span className="mr-4">
//             WebSocket:{' '}
//             <span className={connected ? 'text-green-400' : 'text-red-400'}>
//               {connected ? 'Connected' : 'Disconnected'}
//             </span>
//           </span>
//           <button
//             onClick={handleSetTarget}
//             className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-full shadow-lg shadow-yellow-400/40 transition-all duration-300"
//           >
//             SET
//           </button>
//         </div>
//       </header>

//       {/* Bar Section */}
//       <div className="x-axis-bar mt-20">
//         <div className="axis-label mb-2 text-center text-lg font-bold">Roll Axis</div>

//         {/* Bar Container */}
//         <div className="relative w-[80%] mx-auto h-4 bg-gray-800 rounded-full overflow-hidden shadow-md">
//           {/* Center Line */}
//           <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-yellow-300" />

//           {/* Pointer Fill */}
//           <div
//             className={`absolute top-0 h-full ${getColorClass(
//               Math.abs(target)
//             )} rounded-full transition-all duration-200`}
//             style={{
//               width: `${fillWidth}%`,
//               left: target >= 0 ? '50%' : `${50 - fillWidth}%`,
//             }}
//           />
//         </div>

      
//         {/* Scale Markers (Fixed Layout) */}
// <div className="relative w-[80%] mx-auto mt-3">
//   <div className="flex justify-between text-xs text-gray-300 font-mono">
//     {[...Array(21)].map((_, i) => {
//       const tick = i - 10; // generate from -10 to +10
//       return (
//         <span
//           key={tick}
//           className={`${
//             tick === 0
//               ? 'text-yellow-300 font-bold'
//               : 'text-gray-400'
//           }`}
//         >
//           {tick}
//         </span>
//       );
//     })}
//   </div>
// </div>


//         {/* Status Info */} 
//         <div className="text-center mt-6 font-mono text-sm">
//           <div>
//             Roll Input: <span className="text-yellow-300">{roll.toFixed(2)}°</span>
//           </div>
//           <div>
//             Pointer: <span className="text-green-300">{target.toFixed(2)}°</span>
//           </div>
//           <div>
//             Status:{' '}
//             {running ? (
//               <span className="text-blue-300">Returning to Center...</span>
//             ) : (
//               <span className="text-gray-400">Stable</span>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
