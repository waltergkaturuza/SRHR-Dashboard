import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, Mail, AlertCircle, Loader, Eye, EyeOff, CreditCard, Gift, AlertTriangle } from 'lucide-react';
import './Signup.css';

const Signup = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState('trial'); // 'trial' or 'direct'
  
  const navigate = useNavigate();
  const { token } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const calculateTrialDates = () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);
    
    return {
      start: startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      end: endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const axios = (await import('axios')).default;
      const { getApiUrl } = await import('../config');
      
      // For now, registration requires admin token
      // In a real app, you'd have a public registration endpoint
      const response = await axios.post(
        getApiUrl('api/auth/register'),
        {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name || formData.username,
          role: 'viewer', // Default role
          subscription_type: selectedOption // 'trial' or 'direct'
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      // Show success message and redirect to login
      alert('Account created successfully! Please login.');
      navigate('/login');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const trialDates = calculateTrialDates();

  return (
    <div className="signup-container">
      <div className="brand-header">
        <h1 className="brand-name">
          <span className="brand-part-1">SRHR</span>
          <span className="brand-part-2">Dashboard</span>
        </h1>
        <p className="welcome-text">Create your account</p>
      </div>

      <div className="signup-card">
        <div className="signup-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Account Details</span>
          </div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Choose Plan</span>
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="signup-form">
            <h2 className="signup-title">Create Account</h2>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <div className="input-wrapper">
                <User size={18} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  placeholder="Username"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <Mail size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Email address"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <User size={18} />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Full name (optional)"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper password-wrapper">
                <Lock size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper password-wrapper">
                <Lock size={18} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="signup-button">
              Continue
            </button>

            <div className="signup-link">
              <span>Already have an account?</span>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                Login
              </a>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="signup-form">
            <div className="signup-option-header">
              <CreditCard size={20} />
              <h2 className="signup-title">Choose Your Signup Option</h2>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="signup-options">
              <div
                className={`signup-option-card ${selectedOption === 'trial' ? 'selected' : ''}`}
                onClick={() => setSelectedOption('trial')}
              >
                <div className="option-header">
                  <h3>7-Day Free Trial</h3>
                  <p>Free trial, requires approval</p>
                </div>
              </div>

              <div
                className={`signup-option-card ${selectedOption === 'direct' ? 'selected' : ''}`}
                onClick={() => setSelectedOption('direct')}
              >
                <div className="option-header">
                  <h3>Direct Subscription</h3>
                  <p>Start immediately after payment</p>
                </div>
              </div>
            </div>

            {selectedOption === 'trial' && (
              <div className="option-details">
                <div className="option-details-header">
                  <Gift size={20} />
                  <h3>7-Day Free Trial</h3>
                </div>
                <p className="option-description">Full access to all features - no credit card required</p>
                
                <div className="trial-info-grid">
                  <div className="trial-info-item">
                    <span className="trial-label">Trial Duration</span>
                    <span className="trial-value">7 Days</span>
                  </div>
                  <div className="trial-info-item">
                    <span className="trial-label">Start Date</span>
                    <span className="trial-value">{trialDates.start}</span>
                  </div>
                  <div className="trial-info-item">
                    <span className="trial-label">End Date</span>
                    <span className="trial-value">{trialDates.end}</span>
                  </div>
                </div>

                <div className="trial-warning">
                  <AlertTriangle size={18} />
                  <span>Your trial request will be reviewed and activated by our team within 24 hours.</span>
                </div>
              </div>
            )}

            {selectedOption === 'direct' && (
              <div className="option-details">
                <div className="option-details-header">
                  <CreditCard size={20} />
                  <h3>Direct Subscription</h3>
                </div>
                <p className="option-description">Start using the platform immediately after payment confirmation</p>
                <p className="option-note">Payment processing will be handled securely through our payment gateway.</p>
              </div>
            )}

            <div className="signup-actions">
              <button type="button" onClick={handleBack} className="back-button">
                Back
              </button>
              <button type="submit" className="signup-button" disabled={loading}>
                {loading ? (
                  <>
                    <Loader size={18} className="spinner" />
                    Creating Account...
                  </>
                ) : (
                  'Complete Signup'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Signup;

