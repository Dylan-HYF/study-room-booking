import * as React from 'react';
import { useState, useEffect } from 'react';
import { Box, Button, Container, Typography, Stack, Alert, Snackbar, CircularProgress } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { API_BASE_URL } from './Common';

// Custom Alert component for use inside Snackbar
const AlertBar = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const professor = 'professor';
const student = 'student';

// Define your API base URL (adjust if your Java app runs on a different port/path)
// const API_BASE_URL = 'http://localhost:8080';

export default function Home({ user }) {
    console.log(user)
    const [rooms, setRooms] = useState([]); // Real room data
    const [isLoading, setIsLoading] = useState(false);
    // State to track the currently selected room ID
    const [selectedRoomId, setSelectedRoomId] = useState(null);

    // State to track the currently selected time slot (string)
    const [selectedTime, setSelectedTime] = useState(null);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Determine user's role (default to 'student' if not provided).
    const userRole = user?.role || 'student';

    // New DB column `role` on rooms: 'student' or 'professor'.
    // - student rooms: visible to students
    // - professor rooms: visible to professors (and professors may also see student rooms)
    // If a room has no `role` value, show it to everyone by default.
    const filteredRooms = rooms.filter((room) => {
        if (!room.role) return false;
        if (userRole.toLowerCase() === professor.toLowerCase()) {
            // Professors see both professor and student rooms
            return room.role.toLowerCase() === professor.toLowerCase() || room.role.toLowerCase() === student.toLowerCase();
        }
        // Students only see student rooms
        return room.role.toLowerCase() === student.toLowerCase();
    });

    // Only consider selected room from the filtered list so users can't interact with
    // rooms they don't have access to.
    const selectedRoom = filteredRooms.find(room => room.id === selectedRoomId);
    const fetchRooms = async () => {
        setIsLoading(true);
        try {
            // Calls your RoomListServlet
            const response = await fetch(`${API_BASE_URL}/roomList`);
            if (!response.ok) throw new Error('Failed to fetch rooms');
            const data = await response.json();
            // data = data.map(x => {
            //     x.role = professor;
            //     return x;
            // });
            setRooms(data);
        } catch (error) {
            console.error("Error fetching rooms:", error);
            setSnackbar({ open: true, message: 'Could not load rooms. Please try again.', severity: 'error' });
        } finally {
            setIsLoading(false);
        }
    };
    // Fetch Room List on Mount
    useEffect(() => {
        fetchRooms();
    }, []);

    // Handler for closing the Snackbar
    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    // --- Handlers ---

    const handleRoomClick = (roomId) => {
        // Clear selected time if changing rooms
        if (selectedRoomId !== roomId) {
            setSelectedTime(null);
        }
        // Toggle room selection
        setSelectedRoomId(selectedRoomId === roomId ? null : roomId);
    };

    const handleTimeSlotClick = (time) => {
        // If the same time is clicked, deselect it (toggle), otherwise select it
        setSelectedTime(selectedTime === time ? null : time);
    };

    const handleConfirmBooking = async () => {
        const bookingData = {
            // Match the names your Java servlet expects
            room_id: selectedRoomId,
            booked_slot: selectedTime,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/confirmBooking`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookingData),
            });

            if (response.ok) {
                // HTTP Status 200-299
                selectedRoom.availability = selectedRoom.availability.map(x => {
                    if (x.timeSlot === selectedTime) {
                        x.isBooked = true;
                    }
                    return x;
                });
                setSelectedTime(null);
                setSnackbar({
                    open: true,
                    message: `Booking confirmed for ${selectedRoom.name} at ${selectedTime}!`,
                    severity: 'success'
                });
            } else {
                const errorText = await response.text();

                setSnackbar({
                    open: true,
                    message: `Booking failed: ${response.status} - ${errorText}`,
                    severity: 'error'
                });
            }
        } catch (error) {
            // Handle network errors (e.g., server offline, CORS block)
            console.error("Booking error:", error);
            setSnackbar({
                open: true,
                message: error.message || 'An unexpected error occurred during booking.',
                severity: 'error'
            });
        }
    };

    const handleCancelBooking = () => {
        setSelectedTime(null);
    };

    // --- Rendering Logic ---
    return (
        <Container component="main" maxWidth="md">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    py: 8,
                }}
            >
                <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
                    📚 Book a Study Room
                </Typography>

                {/* Loading Indicator */}
                {isLoading && <CircularProgress sx={{ mt: 3 }} />}

                <Alert severity="info" sx={{ mb: 4, width: '100%' }}>
                    Disabled slots are already booked (e.g., Study Room Alpha at 10:00 AM).
                </Alert>

                {/* --- 1. Room Buttons --- */}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Showing rooms for role: <strong>{userRole}</strong>
                </Typography>
                {filteredRooms.length === 0 && (
                    <Alert severity="warning" sx={{ my: 2, width: '100%' }}>
                        No rooms available for your role.
                    </Alert>
                )}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    mt={4}
                    sx={{ justifyContent: 'center', flexWrap: 'wrap' }}
                >
                    {filteredRooms.map((room) => (
                        <Button
                            key={room.id}
                            variant={selectedRoomId === room.id ? 'contained' : 'outlined'}
                            color="primary"
                            size="large"
                            onClick={() => handleRoomClick(room.id)}
                        >
                            {room.name}
                        </Button>
                    ))}
                </Stack>

                {/* --- 2. Availability Buttons (Conditional Rendering) --- */}
                {selectedRoom && (
                    <Box
                        sx={{
                            mt: 5,
                            p: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            width: '100%',
                            backgroundColor: 'action.hover'
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Available times for **{selectedRoom.name}**:
                        </Typography>

                        <Stack
                            direction="row"
                            spacing={1.5}
                            mt={2}
                            sx={{ justifyContent: 'center', flexWrap: 'wrap' }}
                        >
                            {selectedRoom.availability.map((time) => {
                                const isBooked = time.isBooked;

                                return (
                                    <Button
                                        key={time.timeSlot}
                                        variant={selectedTime === time.timeSlot && !isBooked ? 'contained' : 'outlined'}
                                        color={isBooked ? 'error' : 'success'} // Use 'error' color for booked slots
                                        size="medium"
                                        onClick={() => !isBooked && handleTimeSlotClick(time.timeSlot)} // Only allow click if not booked
                                        disabled={isBooked} // <--- THE KEY CHANGE
                                    >
                                        {time.timeSlot}
                                    </Button>
                                );
                            })}
                        </Stack>

                        {/* --- 3. Confirm/Cancel Buttons (Conditional Rendering) --- */}
                        {selectedTime && (
                            <Stack
                                direction="row"
                                spacing={2}
                                mt={3}
                                sx={{ justifyContent: 'center' }}
                            >
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    onClick={handleConfirmBooking}
                                >
                                    Confirm Booking
                                </Button>

                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="large"
                                    onClick={handleCancelBooking}
                                >
                                    Cancel
                                </Button>
                            </Stack>
                        )}

                    </Box>
                )}

            </Box>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                // Position the notification at the bottom center
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <AlertBar onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </AlertBar>
            </Snackbar>
        </Container>
    );
}