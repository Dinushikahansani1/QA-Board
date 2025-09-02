import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';

const LiveAlerts = () => {
  const { alerts } = useWebSocket();

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Live Alerts</h2>
      {alerts.length === 0 ? (
        <p>No new alerts.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {alerts.map((alert) => (
            <li key={alert._id} style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '10px', marginBottom: '10px' }}>
              <strong>Journey Failed:</strong> {alert.journey.name}
              <br />
              <small>Time: {new Date(alert.createdAt).toLocaleString()}</small>
              <br />
              {/* In a real app, this would be a link to the full report */}
              <a href="#" style={{ color: '#007bff' }}>View Report</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LiveAlerts;
