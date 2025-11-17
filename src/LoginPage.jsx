import React, { useState } from 'react';
import { API_BASE_URL } from './Common';
import Home from './Home';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Snackbar,
    Alert as MuiAlert,
    CircularProgress
} from '@mui/material';

// --- API Configuration ---
// Adjusted the URL to the root context path you specified: http://localhost:8080/login

// Custom Alert component for Snackbar
const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// Mock component to show what happens after successful login
// const DashboardMock = ({ user }) => (
//     <Box mt={4} p={3} bgcolor="#e8f5e9" borderRadius={2} textAlign="center">
//         <Typography variant="h5" color="success.main">Login Successful!</Typography>
//         <Typography variant="body1">Welcome, User ID: {user.id} ({user.role})</Typography>
//         <Typography variant="body2" color="text.secondary">
//             In a real app, you would now be redirected to the main booking page with a session token.
//         </Typography>
//     </Box>
// );

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null); // State to hold the authenticated user object
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

    // --- REAL LOGIN API CALL USING FETCH ---
    const loginApiCall = async (userEmail, userPassword) => {
        // Prepare the payload to be sent as JSON
        const payload = {
            email: userEmail,
            password: userPassword,
        };

        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            // Crucial: Tell the server we are sending JSON
            headers: {
                'Content-Type': 'application/json',
            },
            // Send the JSON payload
            body: JSON.stringify(payload),
        });

        // Check if the response status is 200-299 (success)
        if (!response.ok) {
            // Read the error message from the Java server's response body
            const errorData = await response.json();
            throw new Error(errorData.message || `Login failed with status: ${response.status}`);
        }

        // If successful, parse the response body (which should contain user data/token)
        const userData = await response.json();

        // Assuming your Java server returns an object like { id: '...', role: '...' }
        return { success: true, user: userData };
    };

    // --- Form Submission Logic ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSnackbar({ open: false, message: '', severity: 'error' });

        if (!email || !password) {
            setSnackbar({ open: true, message: 'Please enter both email and password.', severity: 'warning' });
            setLoading(false);
            return;
        }

        try {
            // Replaced mockLoginApiCall with the real loginApiCall
            const result = await loginApiCall(email, password);

            // On successful login, save the user data
            if (result.success) {
                setUser(result.user);
            }

        } catch (error) {
            // Display error from the actual API call
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // If the user is authenticated, show the success message
    if (user) {
        return <Home user={user} />;
    }

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 4,
                    borderRadius: 2,
                    boxShadow: 3,
                    bgcolor: 'background.paper',
                }}
            >
                <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                    Study Room Login
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        variant="outlined"
                    />

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        variant="outlined"
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                    </Button>

                    <Typography variant="body2" color="text.secondary" align="center">
                        <span style={{ fontWeight: 'bold' }}>Note:</span> Waiting for Java server to implement `http://localhost:8080/login` endpoint.
                    </Typography>

                </Box>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default LoginPage;