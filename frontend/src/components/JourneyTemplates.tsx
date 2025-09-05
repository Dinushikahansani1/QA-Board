import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
  Alert as MuiAlert,
  Button,
} from '@mui/material';
import { getTemplates, type Template } from '../api/templates';

export default function JourneyTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const data = await getTemplates();
        setTemplates(data);
      } catch (err) {
        setError('Failed to fetch templates. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleSelectTemplate = (template: Template) => {
    navigate('/journeys/new', { state: { template } });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Create from a Template
      </Typography>
      {error && <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>}
      <List>
        {templates.map((template) => (
          <ListItem
            key={template.name}
            secondaryAction={
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleSelectTemplate(template)}
              >
                Use Template
              </Button>
            }
          >
            <ListItemText
              primary={template.name}
              secondary={template.description}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
