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
} from '@mui/material';
import { AddCircle, Delete, VpnKey } from '@mui/icons-material';
import type { JourneyStep } from '../../api/journeys';
import { getSecrets, type Secret } from '../../api/secrets';

interface JourneyFormProps {
  onSubmit: (data: { name: string; domain: string; steps: JourneyStep[] }) => void;
  initialData?: { name: string; domain: string; steps: JourneyStep[] };
  submitButtonText?: string;
}

const defaultStep: JourneyStep = {
  action: 'goto',
  params: { url: 'https://www.saucedemo.com' },
};

export default function JourneyForm({
  onSubmit,
  initialData = { name: '', domain: '', steps: [defaultStep] },
  submitButtonText = 'Create Journey',
}: JourneyFormProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(initialData.name);
  const [domain, setDomain] = useState(initialData.domain);
  const [steps, setSteps] = useState<JourneyStep[]>(initialData.steps);
  const [secrets, setSecrets] = useState<Secret[]>([]);

  useEffect(() => {
    // Fetch available secrets when the component mounts
    getSecrets().then(setSecrets).catch(err => console.error("Failed to fetch secrets", err));
  }, []);

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
    onSubmit({ name, domain, steps });
  };

  // A helper component to select a secret
  const SecretSelector = ({ onSelect }: { onSelect: (name: string) => void }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    const handleSelect = (secretName: string) => {
      onSelect(`{{secrets.${secretName}}}`);
      handleClose();
    };

    return (
      <>
        <IconButton onClick={handleClick} size="small" title="Insert Secret">
          <VpnKey />
        </IconButton>
        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          {secrets.length === 0 ? (
            <MenuItem disabled>No secrets found</MenuItem>
          ) : (
            secrets.map((secret) => (
              <MenuItem key={secret._id} onClick={() => handleSelect(secret.name)}>
                {secret.name}
              </MenuItem>
            ))
          )}
        </Menu>
      </>
    );
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
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SecretSelector onSelect={(val) => handleStepChange(index, 'url', val)} />
                </InputAdornment>
              ),
            }}
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
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SecretSelector onSelect={(val) => handleStepChange(index, 'text', val)} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </>
        );
      case 'press':
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
                label="Key"
                value={step.params.text || ''}
                onChange={(e) => handleStepChange(index, 'text', e.target.value)}
                fullWidth
                required
              />
            </Grid>
          </>
        );
      case 'selectOption':
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
                label="Value"
                value={step.params.value || ''}
                onChange={(e) => handleStepChange(index, 'value', e.target.value)}
                fullWidth
                required
              />
            </Grid>
          </>
        );
      case 'toBeVisible':
        return (
          <TextField
            label="Selector"
            value={step.params.selector || ''}
            onChange={(e) => handleStepChange(index, 'selector', e.target.value)}
            fullWidth
            required
          />
        );
      case 'toHaveText':
      case 'toContainText':
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
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SecretSelector onSelect={(val) => handleStepChange(index, 'text', val)} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </>
        );
      case 'toHaveAttribute':
        return (
          <>
            <Grid item xs={4}>
              <TextField
                label="Selector"
                value={step.params.selector || ''}
                onChange={(e) => handleStepChange(index, 'selector', e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Attribute"
                value={step.params.attribute || ''}
                onChange={(e) => handleStepChange(index, 'attribute', e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Value"
                value={step.params.value || ''}
                onChange={(e) => handleStepChange(index, 'value', e.target.value)}
                fullWidth
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SecretSelector onSelect={(val) => handleStepChange(index, 'value', val)} />
                    </InputAdornment>
                  ),
                }}
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
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Journey Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Target Domain (e.g., example.com)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            fullWidth
            required
          />
        </Grid>
      </Grid>

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
                  <MenuItem value="press">Press Key</MenuItem>
                  <MenuItem value="selectOption">Select Option</MenuItem>
                  <MenuItem value="waitForSelector">Wait For Selector</MenuItem>
                  <MenuItem value="toBeVisible">Is Visible</MenuItem>
                  <MenuItem value="toHaveText">Has Text</MenuItem>
                  <MenuItem value="toContainText">Contains Text</MenuItem>
                  <MenuItem value="toHaveAttribute">Has Attribute</MenuItem>
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

      <Button type="submit" variant="contained" sx={{ mr: 2 }}>
        {submitButtonText}
      </Button>
      <Button variant="outlined" onClick={() => navigate('/journeys')}>
        Cancel
      </Button>
    </Box>
  );
}
