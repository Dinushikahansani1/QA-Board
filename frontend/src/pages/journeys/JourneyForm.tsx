import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Menu,
  TextField,
  Typography,
  Paper,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  InputAdornment,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { AddCircle, Delete, VpnKey } from '@mui/icons-material';
import type { JourneyStep } from '../../api/journeys';

// NOTE: Secrets are not yet implemented in this focused feature.
// This will need to be re-introduced when the secrets vault is built.

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
  const navigate = useNavigate();
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

  const handleCheckboxChange = (index: number, field: keyof JourneyStep['params'], checked: boolean) => {
    const newSteps = [...steps];
    newSteps[index].params = { ...newSteps[index].params, [field]: checked };
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
      case 'expect':
        return (
          <>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Target</InputLabel>
                <Select
                  value={step.params.target || 'locator'}
                  label="Target"
                  onChange={(e) => handleStepChange(index, 'target', e.target.value)}
                >
                  <MenuItem value="locator">Locator</MenuItem>
                  <MenuItem value="page">Page</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {step.params.target !== 'page' && (
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Selector"
                  value={step.params.selector || ''}
                  onChange={(e) => handleStepChange(index, 'selector', e.target.value)}
                  fullWidth
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Assertion (e.g., toHaveText)"
                value={step.params.assertion || ''}
                onChange={(e) => handleStepChange(index, 'assertion', e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Value (optional)"
                value={step.params.value || ''}
                onChange={(e) => handleStepChange(index, 'value', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={!!step.params.soft}
                            onChange={(e) => handleCheckboxChange(index, 'soft', e.target.checked)}
                        />
                    }
                    label="Soft Assertion (does not stop test on failure)"
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
                  <MenuItem value="expect">Expect (Assertion)</MenuItem>
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

      <Box sx={{ mt: 2 }}>
        <Button
          type="button"
          onClick={addStep}
          startIcon={<AddCircle />}
          sx={{ mr: 2 }}
        >
          Add Step
        </Button>

        <Button type="submit" variant="contained" sx={{ mr: 2 }}>
          {submitButtonText}
        </Button>
        <Button variant="outlined" onClick={() => navigate('/journeys')}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
