import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  Chip,
  Button,
} from '@mui/material';
import { getJourney, type Journey } from '../../api/journeys';
import { ArrowBack } from '@mui/icons-material';

export default function JourneyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [journey, setJourney] = useState<Journey | null>(null);
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
        const data = await getJourney(id);
        setJourney(data);
      } catch (err) {
        setError('Failed to fetch journey details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJourneyData();
  }, [id]);

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

  if (!journey) {
    return <Alert severity="info" sx={{ m: 3 }}>Journey not found.</Alert>;
  }

  const getStatusChip = (status: 'success' | 'failure' | 'pending' | undefined) => {
    if (!status) return <Chip label="Not Run" />;
    switch (status) {
      case 'success':
        return <Chip label="Success" color="success" />;
      case 'failure':
        return <Chip label="Failure" color="error" />;
      case 'pending':
        return <Chip label="Pending" color="warning" />;
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button component={RouterLink} to="/journeys" startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        Back to Journeys
      </Button>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {journey.name}
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6">Last Run</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                {getStatusChip(journey.lastRun?.status)}
                <Typography variant="body2" color="text.secondary">
                    {journey.lastRun?.runAt ? new Date(journey.lastRun.runAt).toLocaleString() : 'Never'}
                </Typography>
            </Box>
          </Grid>
           <Grid item xs={12} sm={6}>
            <Typography variant="h6">Details</Typography>
            <Typography variant="body2" color="text.secondary">
                Created: {new Date(journey.createdAt).toLocaleString()}
            </Typography>
             <Typography variant="body2" color="text.secondary">
                Last Updated: {new Date(journey.updatedAt).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Steps
        </Typography>
        <List>
          {journey.steps.map((step, index) => (
            <ListItem key={index} divider>
              <ListItemText
                primary={<Typography variant="body1" component="span" sx={{ fontWeight: 'bold' }}>{step.action}</Typography>}
                secondary={
                  <Box component="pre" sx={{ m: 0, p: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(step.params, null, 2)}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
