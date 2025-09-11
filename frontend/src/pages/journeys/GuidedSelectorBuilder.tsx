import React, { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, TextField, Typography } from '@mui/material';
import type { JourneyStep } from '../../api/journeys';

type Selector = { method: string; args: any[] } | string;

interface GuidedSelectorBuilderProps {
  selector: Selector;
  onSelectorChange: (selector: Selector) => void;
}

export default function GuidedSelectorBuilder({ selector, onSelectorChange }: GuidedSelectorBuilderProps) {
  const getInitialType = () => {
    if (typeof selector === 'object') {
      if (selector.method === 'getByRole') return 'role';
      if (selector.method === 'getByText') return 'text';
      if (selector.method === 'getByTestId') return 'testid';
    }
    return 'advanced';
  };

  const [type, setType] = useState(getInitialType());

  // State for each input type
  const [role, setRole] = useState(typeof selector === 'object' && selector.method === 'getByRole' ? selector.args[0] : 'button');
  const [roleName, setRoleName] = useState(typeof selector === 'object' && selector.method === 'getByRole' ? selector.args[1]?.name : '');
  const [text, setText] = useState(typeof selector === 'object' && selector.method === 'getByText' ? selector.args[0] : '');
  const [testId, setTestId] = useState(typeof selector === 'object' && selector.method === 'getByTestId' ? selector.args[0] : '');
  const [advanced, setAdvanced] = useState(typeof selector === 'string' ? selector : '');

  useEffect(() => {
    let newSelector: Selector = '';
    if (type === 'role') {
      newSelector = { method: 'getByRole', args: [role, { name: roleName }] };
    } else if (type === 'text') {
      newSelector = { method: 'getByText', args: [text] };
    } else if (type === 'testid') {
      newSelector = { method: 'getByTestId', args: [testId] };
    } else if (type === 'advanced') {
      newSelector = advanced;
    }
    onSelectorChange(newSelector);
  }, [type, role, roleName, text, testId, advanced]);


  const handleTypeChange = (newType: string) => {
    setType(newType);
  };

  const renderInputs = () => {
    switch (type) {
      case 'role':
        return (
          <>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select value={role} label="Role" onChange={(e) => setRole(e.target.value)}>
                <MenuItem value="button">Button</MenuItem>
                <MenuItem value="link">Link</MenuItem>
                <MenuItem value="textbox">Textbox</MenuItem>
                <MenuItem value="checkbox">Checkbox</MenuItem>
                <MenuItem value="radio">Radio</MenuItem>
                <MenuItem value="heading">Heading</MenuItem>
                <MenuItem value="listitem">List Item</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Name / Label"
              helperText="The visible text of the element."
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
            />
          </>
        );
      case 'text':
        return (
          <TextField
            label="Text"
            helperText="The exact text to find."
            value={text}
            onChange={(e) => setText(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
        );
      case 'testid':
        return (
          <TextField
            label="Test ID"
            helperText="The value of the data-testid attribute."
            value={testId}
            onChange={(e) => setTestId(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
        );
      case 'advanced':
        return (
          <TextField
            label="CSS Selector or XPath"
            helperText="e.g., #my-id or //div[@class='my-class']"
            value={advanced}
            onChange={(e) => setAdvanced(e.target.value)}
            fullWidth
            multiline
            rows={4}
            sx={{ mt: 2 }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <FormControl fullWidth>
        <InputLabel>Selector Type</InputLabel>
        <Select
          value={type}
          label="Selector Type"
          onChange={(e) => handleTypeChange(e.target.value)}
        >
          <MenuItem value="role">By Role</MenuItem>
          <MenuItem value="text">By Text</MenuItem>
          <MenuItem value="testid">By Test ID</MenuItem>
          <MenuItem value="advanced">Advanced (CSS/XPath)</MenuItem>
        </Select>
      </FormControl>
      {renderInputs()}
    </Box>
  );
}
