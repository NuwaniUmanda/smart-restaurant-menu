import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getErrorMessage } from '../utils/errorHandler';
import { Mail, Lock, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';

const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err) {
      console.error('Login error:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{
           background: 'linear-gradient(135deg, #111827 0%, #000000 50%, #1f2937 100%)',
         }}>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-20"
             style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}></div>
        <div className="absolute top-1/2 -right-10 w-60 h-60 rounded-full blur-3xl opacity-10"
             style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}></div>
        <div className="absolute -bottom-10 left-1/3 w-32 h-32 rounded-full blur-3xl opacity-15"
             style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Glass morphism container */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 35px 70px rgba(220, 38, 38, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.3)';
        }}>
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                 style={{
                   background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                   boxShadow: '0 8px 25px rgba(220, 38, 38, 0.3)'
                 }}>
              <Shield size={32} color="white" />
            </div>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              Admin Portal
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              Secure access to your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <Mail size={20} color="#9ca3af" />
              </div>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 52px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#dc2626';
                  e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <Lock size={20} color="#9ca3af" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '16px 52px 16px 52px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#dc2626';
                  e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'none';
                }}
              >
                {showPassword ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#9ca3af" />}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px',
                animation: 'slideIn 0.3s ease-out'
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading 
                  ? 'rgba(156, 163, 175, 0.3)' 
                  : 'linear-gradient(135deg, #dc2626, #991b1b)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              <div className="flex items-center justify-center gap-2">
                {loading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                )}
                {loading ? 'Signing in...' : 'Secure Login'}
              </div>
            </button>

            {/* Additional Links */}
            <div className="text-center pt-4">
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                Need help accessing your account?
              </p>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  marginTop: '4px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#991b1b';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#dc2626';
                }}
                onClick={() => {
                  // Add forgot password functionality here
                  alert('Contact system administrator for password reset');
                }}
              >
                Contact Administrator
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p style={{ color: '#6b7280', fontSize: '12px' }}>
            © 2024 Restaurant Admin System. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateX(-10px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        input::placeholder {
          color: #9ca3af;
        }

        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px rgba(255, 255, 255, 0.05) inset !important;
          -webkit-text-fill-color: white !important;
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;