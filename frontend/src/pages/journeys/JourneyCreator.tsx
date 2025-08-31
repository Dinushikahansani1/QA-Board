import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Alert } from '@mui/material';
import JourneyForm from './JourneyForm';
import { createJourney, JourneyStep } from '../../api/journeys';

export default function JourneyCreator() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: { name: string; steps: JourneyStep[] }) => {
    try {
      await createJourney(data);
      navigate('/journeys');
    } catch (err) {
      setError('Failed to create journey. Please check your input and try again.');
      console.error(err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Create New Journey
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper>
        <JourneyForm onSubmit={handleSubmit} />
      </Paper>
    </Box>
  );
}
