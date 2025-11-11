'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PresentPosition() {
  const [position, setPosition] = useState({
    easting: 485193,
    northing: 6202674,
    height: 41,
    zone: 30,
    fixType: 'INS+GPS',
    gpsOk: true,
    quality: 'good',
  });
  const [lastUpdate, setLastUpdate] = useState('11:06:00');
  const [showDegraded, setShowDegraded] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Set background and font for this screen only
  useEffect(() => {
    document.body.style.background = '#000';
    document.body.style.color = '#fff';
    document.body.style.fontFamily = 'monospace';
    return () => {
      document.body.style.background = '';
      document.body.style.color = '';
    };
  }, []);

  const getColor = (q) =>
    q === 'good'
      ? 'text-green'
      : q === 'warning'
      ? 'text-yellow'
      : 'text-red';

  return (
    <>
      <style jsx>{`
        .screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          width: 100vw;
          background-color: #000;
          color: #fff;
          font-family: monospace;
          position: relative;
        }

        .title {
          font-size: 22px;
          font-weight: bold;
          color: #ccc;
          margin-bottom: 20px;
          letter-spacing: 1px;
        }

        .data-box {
          border: 1px solid #444;
          background: rgba(0, 0, 0, 0.8);
          padding: 40px 50px;
          border-radius: 4px;
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.15);
          width: 400px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: 20px;
        }

        .label {
          color: #ccc;
        }

        .value {
          color: #00ff66;
        }

        .utm {
          text-align: right;
          font-size: 12px;
          color: #888;
          margin-top: 10px;
        }

        .status {
          margin-top: 30px;
          font-size: 14px;
          color: #bbb;
        }

        .status div {
          margin: 3px 0;
        }

        .green {
          color: #00ff66;
        }

        .yellow {
          color: #ffff66;
        }

        .red {
          color: #ff4444;
        }

        .footer {
          position: absolute;
          bottom: 50px;
          font-size: 12px;
          color: #777;
          font-style: italic;
        }

        .back {
          position: absolute;
          top: 20px;
          left: 20px;
          padding: 10px 14px;
          background: #222;
          border: 1px solid #555;
          color: #fff;
          cursor: pointer;
          border-radius: 3px;
        }

        .back:hover {
          background: #2c2306ff;
        }

        .popup {
          position: absolute;
          top: 20px;
          right: 20px;
          background: #0a0;
          color: #fff;
          padding: 8px 14px;
          border-radius: 5px;
          font-weight: bold;
          animation: blink 1s infinite alternate;
        }

        @keyframes blink {
          from {
            opacity: 1;
          }
          to {
            opacity: 0.5;
          }
        }

        .overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ff4444;
          font-size: 24px;
          font-weight: bold;
        }
      `}</style>

      <div className="screen">
        <h1 className="title">Present Position</h1>

        {/* Data Box */}
        <div className="data-box">
          <div className="row">
            <span className="label">Easting =</span>
            <span className="value">{position.easting}</span>
          </div>
          <div className="row">
            <span className="label">Northing =</span>
            <span className="value">N {position.northing}</span>
          </div>
          <div className="row">
            <span className="label">Height (m) =</span>
            <span className="value">+{position.height}</span>
          </div>
          <div className="row">
            <span className="label">Zone =</span>
            <span className="value">{position.zone}</span>
          </div>
          <div className="utm">UTM (WGS 1984)</div>
        </div>

        {/* Status Section */}
        <div className="status">
          <div>
            Fix: <span className="green">{position.fixType}</span>
          </div>
          <div>
            GPS:{' '}
            <span className={position.gpsOk ? 'green' : 'red'}>
              {position.gpsOk ? 'OK' : 'NO FIX'}
            </span>
          </div>
          <div>
            Quality:{' '}
            <span className={getColor(position.quality)}>
              {position.quality.toUpperCase()}
            </span>
          </div>
          <div>
            Last Update: <span className="yellow">{lastUpdate}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          Source: Provided by INU (fused INS+GPS)
        </div>

        {/* Back Button */}
        <Link href="/">
          <button className="back">← Back</button>
        </Link>

        {/* Popup */}
        {showPopup && (
          <div className="popup">NEW TARGET DATA RECEIVED</div>
        )}

        {/* Degraded Mode */}
        {showDegraded && (
          <div className="overlay">
            DEGRADED — USING ODOMETER/INS ONLY
          </div>
        )}
      </div>
    </>
  );
}
