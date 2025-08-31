import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material';
import { AddCircle, Delete } from '@mui/icons-material';
import type { JourneyStep } from '../../api/journeys';

interface JourneyFormProps {
  onSubmit: (data: { name: string; steps: JourneyStep[] }) => void;
  initialData?: { name: string; steps: JourneyStep[] };
  submitButtonText?: string;
}

const defaultStep: JourneyStep = {
  action: 'goto',
  params: { url: 'https://www.saucedemo.com' },
};

export default function JourneyForm({
  onSubmit,
  initialData = { name: '', steps: [defaultStep] },
  submitButtonText = 'Create Journey',
}: JourneyFormProps) {
  const [name, setName] = useState(initialData.name);
  const [steps, setSteps] = useState<JourneyStep[]>(initialData.steps);

  const handleStepChange = (index: number, field: keyof JourneyStep | keyof JourneyStep['params'], value: any) => {
    const newSteps = [...steps];
    if (field === 'action') {
      newSteps[index] = { ...newSteps[index], action: value, params: {} }; // Reset params on action change
    } else if (field in newSteps[index]) {
      (newSteps[index] as any)[field] = value;
    } else {
      newSteps[index].params = { ...newSteps[index].params, [field]: value };
    }
    setSteps(newSteps);
  };

  const addStep = () => {
    setSteps([...steps, { ...defaultStep }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, steps });
  };

  const renderStepParams = (step: JourneyStep, index: number) => {
    switch (step.action) {
      case 'goto':
        return (
          <TextField
            label="URL"
            value={step.params.url || ''}
            onChange={(e) => handleStepChange(index, 'url', e.target.value)}
            fullWidth
            required
          />
        );
      case 'click':
      case 'waitForSelector':
        return (
          <TextField
            label="Selector"
            value={step.params.selector || ''}
            onChange={(e) => handleStepChange(index, 'selector', e.target.value)}
            fullWidth
            required
          />
        );
      case 'type':
        return (
          <>
            <Grid item xs={6}>
              <TextField
                label="Selector"
                value={step.params.selector || ''}
                onChange={(e) => handleStepChange(index, 'selector', e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Text"
                value={step.params.text || ''}
                onChange={(e) => handleStepChange(index, 'text', e.target.value)}
                fullWidth
                required
              />
            </Grid>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
      <TextField
        label="Journey Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        required
        sx={{ mb: 3 }}
      />

      <Typography variant="h6" sx={{ mb: 1 }}>Steps</Typography>

      {steps.map((step, index) => (
        <Paper key={index} sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  value={step.action}
                  label="Action"
                  onChange={(e) => handleStepChange(index, 'action', e.target.value)}
                >
                  <MenuItem value="goto">Go To</MenuItem>
                  <MenuItem value="click">Click</MenuItem>
                  <MenuItem value="type">Type</MenuItem>
                  <MenuItem value="waitForSelector">Wait For Selector</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={7}>
              <Grid container spacing={2}>
                {renderStepParams(step, index)}
              </Grid>
            </Grid>
            <Grid item xs={12} sm={1}>
              <IconButton onClick={() => removeStep(index)} color="error">
                <Delete />
              </IconButton>
            </Grid>
          </Grid>
        </Paper>
      ))}

      <Button
        type="button"
        onClick={addStep}
        startIcon={<AddCircle />}
        sx={{ mr: 2 }}
      >
        Add Step
      </Button>

      <Button type="submit" variant="contained">
        {submitButtonText}
      </Button>
    </Box>
  );
}
