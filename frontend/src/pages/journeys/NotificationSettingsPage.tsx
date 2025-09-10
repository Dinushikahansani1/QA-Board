import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { getNotificationSettings, updateNotificationSettings } from '../../api/journeys';

const NotificationSettingsPage = () => {
  const { journeyId } = useParams();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getNotificationSettings(journeyId);
        setSettings(data);
      } catch (err) {
        setError('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    if (journeyId) {
      fetchSettings();
    }
  }, [journeyId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await updateNotificationSettings(journeyId, settings);
      navigate(`/journeys`);
    } catch (err) {
      setError('Failed to save settings.');
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'emails') {
      setSettings({ ...settings, [name]: value.split(',').map(e => e.trim()) });
    } else {
      setSettings({ ...settings, [name]: value });
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Notification Settings
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {settings && (
        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <TextField
              name="failureThreshold"
              label="Failure Threshold"
              type="number"
              value={settings.failureThreshold}
              onChange={handleChange}
              fullWidth
              margin="normal"
              helperText="Number of consecutive failures before an alert is triggered."
            />
            <TextField
              name="emails"
              label="Email Recipients"
              value={settings.emails.join(', ')}
              onChange={handleChange}
              fullWidth
              margin="normal"
              helperText="Comma-separated list of email addresses."
            />
            <TextField
              name="slackWebhookUrl"
              label="Slack Webhook URL"
              value={settings.slackWebhookUrl}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <Box sx={{ mt: 2 }}>
              <Button type="submit" variant="contained" sx={{ mr: 2 }}>
                Save Settings
              </Button>
              <Button variant="outlined" onClick={() => navigate('/journeys')}>
                Cancel
              </Button>
            </Box>
          </form>
        </Paper>
      )}
    </Box>
  );
};

export default NotificationSettingsPage;
