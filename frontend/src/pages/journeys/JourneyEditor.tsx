import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Paper, Alert, CircularProgress, Button, Modal, TextareaAutosize } from '@mui/material';
import JourneyForm from './JourneyForm';
import { getJourney, updateJourney, generateCode, type Journey, type JourneyStep } from '../../api/journeys';

export default function JourneyEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [initialData, setInitialData] = useState<{ name: string; steps: JourneyStep[] } | null>(null);
  const [code, setCode] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        const journeyData = await getJourney(id);
        setJourney(journeyData);
        setInitialData({ name: journeyData.name, steps: journeyData.steps });
        setCode(journeyData.code || '');
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
    if (!id || !journey) return;
    try {
      const { code: newCode } = await generateCode(data.steps);
      await updateJourney(id, { ...data, domain: journey.domain, code: newCode });
      navigate('/journeys');
    } catch (err) {
      setError('Failed to update journey.');
      console.error(err);
    }
  };

  const handleCodeSave = async () => {
    if (!id || !journey) return;
    try {
      const updatedJourney = await updateJourney(id, { name: journey.name, code });
      setJourney(updatedJourney);
      setInitialData({ name: updatedJourney.name, steps: updatedJourney.steps });
      setCode(updatedJourney.code || '');
      setIsModalOpen(false);
    } catch (err) {
      setError('Failed to update code.');
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
          <>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => setIsModalOpen(true)}>View/Edit Code</Button>
            </Box>
            <JourneyForm
              onSubmit={handleSubmit}
              initialData={initialData}
              submitButtonText="Update Journey"
            />
          </>
        ) : (
          <Alert severity="info">Journey data could not be loaded.</Alert>
        )}
      </Paper>
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box sx={{ ...style, width: '80vw', maxHeight: '90vh', overflowY: 'auto' }}>
          <Typography variant="h6" component="h2">
            Journey Code
          </Typography>
          <TextareaAutosize
            minRows={20}
            style={{ width: '100%', fontFamily: 'monospace', padding: '8px', marginTop: '16px' }}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button variant="contained" onClick={handleCodeSave} sx={{ mt: 2 }}>
            Save Code
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};
