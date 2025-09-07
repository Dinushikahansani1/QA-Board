import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { generateJourneyFromText } from '../api/journeys';

export default function NaturalLanguageCreator() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter a description of the journey.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const journeyData = await generateJourneyFromText(text);
      // The journeyData from the API should have a name and steps
      navigate('/journeys/new', { state: { template: journeyData } });
    } catch (err) {
      setError('Failed to generate journey. The AI may be offline or the request may have failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Create with AI
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Describe the user journey you want to create in plain English. The AI will generate the steps for you.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        label="Describe your journey here..."
        multiline
        rows={4}
        fullWidth
        value={text}
        onChange={(e) => setText(e.target.value)}
        variant="outlined"
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        {loading && <CircularProgress size={24} sx={{ mr: 2 }} />}
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerate}
          disabled={loading}
        >
          Generate Journey
        </Button>
      </Box>
    </Paper>
  );
}
