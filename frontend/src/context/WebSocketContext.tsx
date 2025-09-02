import React, { createContext, useContext, useEffect, useState } from 'react';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

export const WebSocketProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const VITE_APP_WS_URL = import.meta.env.VITE_APP_WS_URL || 'ws://localhost:4000';

  useEffect(() => {
    const ws = new WebSocket(VITE_APP_WS_URL);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'NEW_ALERT') {
        setAlerts((prevAlerts) => [message.payload, ...prevAlerts]);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    // Clean up the connection when the component unmounts
    return () => {
      ws.close();
    };
  }, [VITE_APP_WS_URL]);

  const value = {
    alerts,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
