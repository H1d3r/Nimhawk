import { useState } from 'react';
import { 
  Text, 
  TextInput,
  PasswordInput,
  Button, 
  Stack,
  Image,
  Box,
  Alert,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import axios from 'axios';
import { SERVER_BASE_URL } from '../config';

const Login: NextPage = () => {
  const router = useRouter();
  const largeScreen = useMediaQuery('(min-width: 767px)');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
        duration: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!username || !password) {
      setError('Please enter email and password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting login with:', { email: username });
      
      // Authentication endpoint URL
      const loginUrl = `${SERVER_BASE_URL}/api/auth/login`;
      console.log('Login URL:', loginUrl);
      
      // Send authentication request to the API
      const response = await axios.post(loginUrl, {
        email: username,
        password: password
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true  // This is crucial for handling cookies between domains
      });
      
      console.log('Response received:', response.data);
      
      // If successful, save the token and redirect
      if (response.data.success) {
        // Get token from response
        const authToken = response.data.token;
        
        console.log('Token from response:', authToken ? `${authToken.substring(0, 10)}...` : 'none');
        
        // Save the token in localStorage
        if (authToken) {
          try {
            localStorage.setItem('auth_token', authToken);
            console.log('Token saved in localStorage!');
            
            // Verify it was saved correctly
            const storedToken = localStorage.getItem('auth_token');
            console.log('Stored token verification:', storedToken ? `${storedToken.substring(0, 10)}...` : 'none');
            
            // We can also try to set a cookie manually
            document.cookie = `auth_token=${authToken}; path=/; max-age=86400; SameSite=Lax`;
            console.log('Cookie also set manually as fallback');
          } catch (storageError) {
            console.error('Error saving token to localStorage:', storageError);
          }
        } else {
          console.warn('No authentication token in response');
        }
        
        console.log('Login successful, redirecting...');
        
        // Force redirect using window.location instead of router.push
        // which can silently fail in some cases
        try {
          // First try with router.push
          router.push('/');
          
          // As a fallback, use a timeout to verify if we need to force the redirect
          setTimeout(() => {
            console.log('Checking if redirect happened...');
            if (window.location.pathname.includes('login')) {
              console.log('Redirect did not happen, forcing with window.location');
              window.location.href = '/';
            }
          }, 500);
        } catch (redirectError) {
          console.error('Error redirecting with router:', redirectError);
          // Force redirect if router.push fails
          window.location.href = '/';
        }
      } else {
        console.error('Unsuccessful response:', response.data);
        setError('Authentication error. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Detailed error information for debugging
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response error:', {
          data: err.response.data,
          status: err.response.status,
          headers: err.response.headers
        });
        
        // Show appropriate error message
        if (err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError(`Error ${err.response.status}: ${err.response.statusText || 'Unknown error'}`);
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('Request error - no response:', err.request);
        setError('No response received from server. Check your connection.');
      } else {
        // Something happened in setting up the request
        console.error('Setup error:', err.message);
        setError('Error trying to connect to the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      height: '100vh',
      position: 'relative',
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={{ 
          width: '100%',
          maxWidth: '400px',
          padding: '2rem',
        }}
      >
        <form onSubmit={handleLogin}>
          <Stack 
            align="center" 
            justify="center"
            gap={40}
          >
            <motion.div
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05,
                filter: 'brightness(1.1)',
                transition: { duration: 0.3 }
              }}
            >
              <Image
                src="/nimhawk.png"
                alt="Nimhawk Logo"
                width={300}
                height={75}
                fit="contain"
                style={{ 
                  opacity: 1,
                  transition: 'all 0.3s ease',
                  marginBottom: '1rem'
                }}
              />
            </motion.div>

            {error && (
              <motion.div variants={itemVariants} style={{width: '100%'}}>
                <Alert color="red" title="Authentication error" withCloseButton onClose={() => setError('')}>
                  {error}
                </Alert>
              </motion.div>
            )}

            <Stack w="100%" gap="md">
              <motion.div variants={itemVariants}>
                <TextInput
                  placeholder="Email"
                  size="md"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  styles={{
                    input: {
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      '&:focus': {
                        borderColor: '#1A1A1A'
                      }
                    }
                  }}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <PasswordInput
                  placeholder="Password"
                  size="md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  styles={{
                    input: {
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      '&:focus': {
                        borderColor: '#1A1A1A'
                      }
                    }
                  }}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  loading={loading}
                  style={{
                    backgroundColor: '#1A1A1A',
                    color: 'white',
                    marginTop: '1rem'
                  }}
                >
                  Sign In
                </Button>
              </motion.div>
            </Stack>

            <motion.div variants={itemVariants}>
              <Box
                style={{
                  backgroundColor: '#1A1A1A',
                  color: 'white',
                  padding: '0.35rem 0.8rem',
                  borderRadius: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginTop: '2rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                <Text
                  size="xs"
                  fw={500}
                  style={{
                    letterSpacing: '0.5px',
                    fontSize: '0.75rem'
                  }}
                >
                  VERSION {'1.0'}
                </Text>
              </Box>
            </motion.div>
          </Stack>
        </form>
      </motion.div>
    </div>
  );
};

export default Login; 