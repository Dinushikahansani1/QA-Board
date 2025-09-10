import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Paper, Alert } from '@mui/material';
import JourneyForm from './JourneyForm';
import { createJourney, type JourneyStep } from '../../api/journeys';

export default function JourneyCreator() {
  const navigate = useNavigate();
  const location = useLocation();
  const rawData = location.state?.template as any | undefined;

  const [error, setError] = useState<string | null>(null);

  const transformTemplateData = (template: any) => {
    const transformedSteps: JourneyStep[] = template.steps
      .map((step: any): JourneyStep | null => {
        switch (step.action) {
          case 'navigate':
            return { action: 'goto', params: { url: step.value } };
          case 'click':
          case 'waitForSelector':
            return { action: step.action, params: { selector: step.selector } };
          case 'type':
            return { action: 'type', params: { selector: step.selector, text: step.value } };
          default:
            // For actions like waitForNavigation, waitForText, request, checkLinks
            // that are not supported by the form, we can either ignore them or
            // try to map them to something sensible if possible. For now, ignore.
            return null;
        }
      })
      .filter((step): step is JourneyStep => step !== null);

    return {
      name: template.name,
      steps: transformedSteps,
    };
  };

  // Check if the data is from a template and needs transformation
  const initialData = rawData?.source === 'template'
    ? transformTemplateData(rawData)
    : rawData;

  const handleSubmit = async (data: { name: string; domain: string; steps: JourneyStep[] }) => {
    try {
      await createJourney(data);
      navigate('/journeys');
    } catch (err) {
      setError('Failed to create journey. Please check your input and try again.');
      console.error(err);
    }
  };

  const getTitle = () => {
    if (!rawData) return 'Create New Journey';
    if (rawData.source === 'template') return `Create from Template: "${rawData.name}"`;
    return 'Create Journey from AI';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        {getTitle()}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper>
        <JourneyForm onSubmit={handleSubmit} initialData={initialData} />
      </Paper>
    </Box>
  );
}
