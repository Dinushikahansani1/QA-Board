import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Grid,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { getSecrets, createSecret, deleteSecret, type Secret } from '../api/secrets';

export default function SecretsPage() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSecrets = async () => {
    try {
      setLoading(true);
      const data = await getSecrets();
      setSecrets(data);
    } catch (err) {
      setError('Failed to fetch secrets.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecrets();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newValue.trim()) {
      setError('Both name and value are required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await createSecret(newName, newValue);
      setNewName('');
      setNewValue('');
      fetchSecrets(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create secret.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this secret? This cannot be undone.')) {
      try {
        await deleteSecret(id);
        fetchSecrets(); // Refresh the list
      } catch (err) {
        setError('Failed to delete secret.');
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Secrets Vault
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
       {"Manage your secrets here. These can be used in your journeys with the syntax '{{secrets.SECRET_NAME}}'. The values are encrypted and never shown again after creation."}
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Create New Secret
            </Typography>
            <Box component="form" onSubmit={handleCreate} noValidate>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <TextField
                label="Secret Name (e.g., LOGIN_PASSWORD)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <TextField
                label="Secret Value (e.g., your password)"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                type="password"
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? <CircularProgress size={24} /> : 'Create Secret'}
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Existing Secrets
            </Typography>
            <List>
              {secrets.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No secrets found. Create one to get started." />
                </ListItem>
              ) : (
                secrets.map((secret) => (
                  <ListItem key={secret._id} divider>
                    <ListItemText
                      primary={secret.name}
                      secondary={`Created on ${new Date(secret.createdAt).toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(secret._id)}>
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
