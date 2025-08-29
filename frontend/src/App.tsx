import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import { Box, Button } from '@mui/material';

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function DashboardStub() {
  const { user, logout } = useAuth();
  return (
    <Box sx={{ p: 3, display: 'grid', gap: 2 }}>
      <h2>Welcome, {user?.email}</h2>
      <p>Login worked. Replace this with your real dashboard later.</p>
      <Button variant="outlined" component={Link} to="/login" onClick={logout}>Logout</Button>
    </Box>
  );
}

function AppInner() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><DashboardStub /></Protected>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
