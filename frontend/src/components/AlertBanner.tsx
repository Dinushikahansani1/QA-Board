import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { Alert, Collapse, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

const AlertBanner = () => {
  const { alerts } = useWebSocket();
  const [latestAlert, setLatestAlert] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (alerts.length > 0) {
      // Assuming the first alert in the array is the newest one
      const newAlert = alerts[0];
      // Only show the banner if it's a different alert than the last one shown
      if (!latestAlert || newAlert._id !== latestAlert._id) {
        setLatestAlert(newAlert);
        setOpen(true);
      }
    }
  }, [alerts, latestAlert]);

  if (!latestAlert) {
    return null;
  }

  return (
    <Collapse in={open}>
      <Alert
        severity="error"
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={() => {
              setOpen(false);
            }}
          >
            <Close fontSize="inherit" />
          </IconButton>
        }
        sx={{ mb: 2 }}
      >
        <strong>New Alert:</strong> Journey "{latestAlert.journey.name}" failed at {new Date(latestAlert.createdAt).toLocaleTimeString()}.
      </Alert>
    </Collapse>
  );
};

export default AlertBanner;
