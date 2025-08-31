import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import JourneyForm from './JourneyForm';
import { getJourney, updateJourney, type Journey, type JourneyStep } from '../../api/journeys';

export default function JourneyEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<{ name: string; steps: JourneyStep[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No journey ID provided.");
      setLoading(false);
      return;
    }
    const fetchJourneyData = async () => {
      try {
        const journey = await getJourney(id);
        setInitialData({ name: journey.name, steps: journey.steps });
      } catch (err) {
        setError('Failed to fetch journey data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJourneyData();
  }, [id]);

  const handleSubmit = async (data: { name: string; steps: JourneyStep[] }) => {
    if (!id) return;
    try {
      await updateJourney(id, data);
      navigate('/journeys');
    } catch (err) {
      setError('Failed to update journey.');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Edit Journey
      </Typography>
      <Paper>
        {initialData ? (
          <JourneyForm
            onSubmit={handleSubmit}
            initialData={initialData}
            submitButtonText="Update Journey"
          />
        ) : (
          <Alert severity="info">Journey data could not be loaded.</Alert>
        )}
      </Paper>
    </Box>
  );
}
