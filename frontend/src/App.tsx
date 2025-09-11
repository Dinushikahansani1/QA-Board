import React from 'react';
import { Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import { Box, Button, AppBar, Toolbar, Typography } from '@mui/material';

// Import new journey pages
import JourneyListPage from './pages/journeys/JourneyListPage';
import JourneyCreator from './pages/journeys/JourneyCreator';
import JourneyEditor from './pages/journeys/JourneyEditor';
import JourneyDetailPage from './pages/journeys/JourneyDetailPage';
import JourneyImporterPage from './pages/journeys/JourneyImporterPage';
import NotificationSettingsPage from './pages/journeys/NotificationSettingsPage';

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// New Layout component with persistent navigation
function Layout() {
    const { user, logout } = useAuth();
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        CXQ Automation
                    </Typography>
                    <Button color="inherit" component={Link} to="/">Dashboard</Button>
                    <Button color="inherit" component={Link} to="/journeys">Journeys</Button>
                    <Button color="inherit" onClick={logout}>Logout ({user?.email})</Button>
                </Toolbar>
            </AppBar>
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                p: 3,
                overflow: 'auto'
              }}
            >
                <Outlet /> {/* Child routes will render here */}
            </Box>
        </Box>
    );
}

function Dashboard() {
    return (
        <Box>
            <Typography variant="h4">Dashboard</Typography>
            <Typography>Welcome to your dashboard. Select an option from the navigation bar.</Typography>
        </Box>
    )
}

function AppInner() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        {/* Nested routes that use the Layout */}
        <Route index element={<Dashboard />} />
        <Route path="journeys" element={<JourneyListPage />} />
        <Route path="journeys/new" element={<JourneyCreator />} />
        <Route path="journeys/import" element={<JourneyImporterPage />} />
        <Route path="journeys/settings/:journeyId" element={<NotificationSettingsPage />} />
        <Route path="journeys/edit/:id" element={<JourneyEditor />} />
        <Route path="journeys/:id" element={<JourneyDetailPage />} />
      </Route>
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
