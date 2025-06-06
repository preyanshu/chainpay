// pages/auth.tsx
'use client'
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  Stack,
  Alert,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleEmailAuth = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Check your email for confirmation link!');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Successfully signed in!');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin, // redirect to your app root after login
        },
      });
      if (error) throw error;
      setMessage(`Redirecting to ${provider} for login...`);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Box
        sx={{
          p: 4,
          boxShadow: 3,
          borderRadius: 2,
          textAlign: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h5" mb={3}>
          {mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Email"
          type="email"
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2, mb: 1 }}
          onClick={handleEmailAuth}
          disabled={loading || !email || !password}
        >
          {mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </Button>

        <Typography
          variant="body2"
          sx={{ cursor: 'pointer', color: 'primary.main' }}
          onClick={() => {
            setError(null);
            setMessage(null);
            setMode(mode === 'signin' ? 'signup' : 'signin');
          }}
        >
          {mode === 'signin'
            ? "Don't have an account? Sign Up"
            : 'Already have an account? Sign In'}
        </Typography>

        <Divider sx={{ my: 3 }}>OR</Divider>

        <Stack spacing={2}>
          <Button
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={() => handleOAuthLogin('google')}
            disabled={loading}
          >
            Continue with Google
          </Button>
          <Button
            variant="outlined"
            startIcon={<GitHubIcon />}
            onClick={() => handleOAuthLogin('github')}
            disabled={loading}
          >
            Continue with GitHub
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
