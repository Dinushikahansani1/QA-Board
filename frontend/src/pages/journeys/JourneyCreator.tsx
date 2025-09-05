import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Paper, Alert } from '@mui/material';
import JourneyForm from './JourneyForm';
import { createJourney, type JourneyStep } from '../../api/journeys';
import { Template } from '../../api/templates';

export default function JourneyCreator() {
  const navigate = useNavigate();
  const location = useLocation();
  const templateData = location.state?.template as Template | undefined;

  const [error, setError] = useState<string | null>(null);

  const transformTemplateToInitialData = (template: Template | undefined) => {
    if (!template) {
      return undefined;
    }

    const transformedSteps: JourneyStep[] = template.steps
      .map((step): JourneyStep | null => {
        switch (step.action) {
          case 'navigate':
            return { action: 'goto', params: { url: step.value } };
          case 'click':
            return { action: 'click', params: { selector: step.selector } };
          case 'type':
            return { action: 'type', params: { selector: step.selector, text: step.value } };
          case 'waitForSelector':
            return { action: 'waitForSelector', params: { selector: step.selector } };
          default:
            // Ignore unsupported actions for now
            return null;
        }
      })
      .filter((step): step is JourneyStep => step !== null);

    return {
      name: template.name,
      steps: transformedSteps,
    };
  };

  const initialData = transformTemplateToInitialData(templateData);

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
        {templateData ? `Create Journey from "${templateData.name}"` : 'Create New Journey'}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper>
        <JourneyForm onSubmit={handleSubmit} initialData={initialData} />
      </Paper>
    </Box>
  );
}
