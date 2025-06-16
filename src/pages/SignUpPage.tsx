import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { APIService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';

const SignUpPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Form validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setLoading(true);
      
      // Call the register API using APIService
      const data = await APIService.register(name, email, password);
      
      // Save token to localStorage
      localStorage.setItem('authToken', data.token);
      
      // Show success toast
      showToast('Your account has been successfully registered!', 'success');
      
      // Redirect to dashboard
      navigate('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle different types of errors
      if (err.code === 'ERR_NETWORK') {
        setError('Network error: Unable to connect to the server. Please check if the server is running.');
      } else if (err.response) {
        // The server responded with a status code outside the 2xx range
        setError(err.response.data?.error || `Server error: ${err.response.status}`);
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Please try again later.');
      } else {
        // Something else happened while setting up the request
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join AI Sales Assistant to boost your sales performance</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-error-50 border border-error-200 text-error-700 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            fullWidth
            startIcon={<User size={18} />}
            required
          />
          
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            fullWidth
            startIcon={<Mail size={18} />}
            required
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            helperText="Must be at least 8 characters"
            fullWidth
            startIcon={<Lock size={18} />}
            required
          />
          
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            fullWidth
            startIcon={<Lock size={18} />}
            required
          />
          
          <div className="flex items-center mt-2">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              I agree to the{' '}
              <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                Privacy Policy
              </a>
            </label>
          </div>
          
          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            className="w-full mt-6"
            loading={loading}
            disabled={loading}
          >
            Create Account
            <ArrowRight className="ml-2" size={18} />
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/signin" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUpPage;