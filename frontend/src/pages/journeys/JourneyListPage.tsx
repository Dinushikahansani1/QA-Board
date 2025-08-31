import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete, PlayArrow, Visibility } from '@mui/icons-material';
import { getJourneys, deleteJourney, runJourney, Journey } from '../../api/journeys';

export default function JourneyListPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJourneys = async () => {
    try {
      setLoading(true);
      const data = await getJourneys();
      setJourneys(data);
    } catch (err) {
      setError('Failed to fetch journeys. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneys();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this journey?')) {
      try {
        await deleteJourney(id);
        setJourneys(journeys.filter((j) => j._id !== id));
      } catch (err) {
        setError('Failed to delete journey.');
      }
    }
  };

  const handleRun = async (id: string) => {
    try {
      await runJourney(id);
      alert('Journey execution started successfully.');
      // Optionally, refresh the list to show the updated 'lastRun' status
      fetchJourneys();
    } catch (err) {
      setError('Failed to start journey execution.');
    }
  };

  const getStatusChip = (status: 'success' | 'failure' | 'pending' | undefined) => {
    if (!status) return <Chip label="Not Run" size="small" />;
    switch (status) {
      case 'success':
        return <Chip label="Success" color="success" size="small" />;
      case 'failure':
        return <Chip label="Failure" color="error" size="small" />;
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Journeys
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          component={RouterLink}
          to="/journeys/new"
        >
          Create New Journey
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Last Run Status</TableCell>
              <TableCell>Last Run At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {journeys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No journeys found. Create one to get started!
                </TableCell>
              </TableRow>
            ) : (
              journeys.map((journey) => (
                <TableRow key={journey._id}>
                  <TableCell>{journey.name}</TableCell>
                  <TableCell>{getStatusChip(journey.lastRun?.status)}</TableCell>
                  <TableCell>
                    {journey.lastRun?.runAt ? new Date(journey.lastRun.runAt).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <IconButton component={RouterLink} to={`/journeys/${journey._id}`} title="View Details">
                      <Visibility />
                    </IconButton>
                    <IconButton component={RouterLink} to={`/journeys/edit/${journey._id}`} title="Edit">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleRun(journey._id)} title="Run Journey">
                      <PlayArrow />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(journey._id)} title="Delete">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
