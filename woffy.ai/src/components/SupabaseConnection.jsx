import React, { useState, useEffect } from 'react';
import { supabase, signUp } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const SupabaseConnection = () => {
  const [status, setStatus] = useState('Checking connection...');
  const [error, setError] = useState(null);
  const [env, setEnv] = useState({
    url: import.meta.env.VITE_SUPABASE_URL ? 'Set ✅' : 'Missing ❌',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set ✅' : 'Missing ❌'
  });
  
  // For test registration form
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [registering, setRegistering] = useState(false);
  const [regResult, setRegResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Simple ping to check if we're connected
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          setStatus('Failed to connect');
          setError(error.message);
        } else {
          setStatus('Connected to Supabase! ✅');
        }
      } catch (err) {
        setStatus('Error checking connection');
        setError(err.message);
      }
    };
    
    checkConnection();
  }, []);
  
  // Handle test registration
  const handleTestRegister = async (e) => {
    e.preventDefault();
    setRegResult(null);
    setRegistering(true);
    
    try {
      const { data, error } = await signUp(testEmail, testPassword);
      
      if (error) {
        throw error;
      }
      
      setRegResult({
        success: true,
        message: 'Test user registered successfully!'
      });
      
      // Reset form
      setTestEmail('');
      setTestPassword('');
    } catch (err) {
      console.error('Test registration error:', err);
      setRegResult({
        success: false,
        message: err.message || 'Registration failed'
      });
    } finally {
      setRegistering(false);
    }
  };

  const goToLoginPage = () => {
    navigate('/login');
  };
  
  const allSet = env.url === 'Set ✅' && env.key === 'Set ✅' && status.includes('Connected');

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '40px auto', 
      padding: '25px', 
      backgroundColor: '#1e1e1e', 
      color: 'white', 
      borderRadius: '12px',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
    }}>
      <h2 style={{ color: '#ffd700', textAlign: 'center', marginBottom: '25px', fontSize: '28px' }}>Supabase Connection Test</h2>
      
      <div style={{ 
        marginBottom: '25px', 
        backgroundColor: '#252525', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #333' 
      }}>
        <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginTop: '0' }}>Environment Variables</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span><strong>VITE_SUPABASE_URL:</strong></span>
          <span style={{ 
            backgroundColor: env.url === 'Set ✅' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)', 
            padding: '2px 8px', 
            borderRadius: '4px',
            color: env.url === 'Set ✅' ? '#4caf50' : '#f44336'
          }}>{env.url}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span><strong>VITE_SUPABASE_ANON_KEY:</strong></span>
          <span style={{ 
            backgroundColor: env.key === 'Set ✅' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)', 
            padding: '2px 8px', 
            borderRadius: '4px',
            color: env.key === 'Set ✅' ? '#4caf50' : '#f44336'
          }}>{env.key}</span>
        </div>
      </div>
      
      <div style={{ 
        marginBottom: '25px', 
        backgroundColor: '#252525', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginTop: '0' }}>Connection Status</h3>
        <div style={{
          backgroundColor: status.includes('Connected') ? 'rgba(76, 175, 80, 0.2)' : status.includes('Checking') ? 'rgba(255, 215, 0, 0.2)' : 'rgba(244, 67, 54, 0.2)',
          padding: '15px',
          borderRadius: '4px',
          textAlign: 'center',
          marginTop: '10px'
        }}>
          <p style={{ 
            color: status.includes('Connected') ? '#4caf50' : status.includes('Checking') ? '#ffd700' : '#f44336',
            fontWeight: 'bold',
            margin: 0,
            fontSize: '18px'
          }}>
            {status}
          </p>
        </div>
        {error && (
          <div style={{ backgroundColor: 'rgba(244, 67, 54, 0.1)', padding: '15px', borderRadius: '4px', marginTop: '15px', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
            <p style={{ color: '#f44336', margin: 0 }}><strong>Error:</strong> {error}</p>
          </div>
        )}
      </div>
      
      {allSet ? (
        <div style={{ 
          backgroundColor: 'rgba(76, 175, 80, 0.1)', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid rgba(76, 175, 80, 0.3)',
          textAlign: 'center',
          marginBottom: '25px'
        }}>
          <p style={{ fontSize: '18px', marginBottom: '15px' }}>
            <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✓ All systems ready!</span> Your Supabase configuration is complete.  
          </p>
          <button 
            onClick={goToLoginPage}
            style={{ 
              backgroundColor: '#ffd700', 
              color: 'black', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '4px', 
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Go to Login Page
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
          <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginTop: '0' }}>Troubleshooting</h3>
          <ol style={{ paddingLeft: '20px' }}>
            <li>Make sure both environment variables are set in your <code>.env</code> file</li>
            <li>If variables are set but still seeing errors, verify your Supabase project is active</li>
            <li>Check that authentication is enabled in your Supabase dashboard</li>
            <li>Try restarting your development server</li>
          </ol>
        </div>
      )}

      {/* Test Registration Form */}
      {status.includes('Connected') && (
        <div style={{ 
          marginTop: '20px', 
          backgroundColor: '#252525', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginTop: '0' }}>Test User Registration</h3>
          
          {regResult && (
            <div style={{
              backgroundColor: regResult.success ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '15px',
              border: `1px solid ${regResult.success ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`
            }}>
              <p style={{ 
                color: regResult.success ? '#4caf50' : '#f44336', 
                margin: 0 
              }}>
                {regResult.message}
              </p>
            </div>
          )}
          
          <form onSubmit={handleTestRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label htmlFor="test-email" style={{ fontSize: '14px', color: '#aaa' }}>Email</label>
              <input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                required
                disabled={registering}
                style={{ 
                  padding: '10px', 
                  backgroundColor: '#333', 
                  border: '1px solid #444', 
                  borderRadius: '4px',
                  color: 'white'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label htmlFor="test-password" style={{ fontSize: '14px', color: '#aaa' }}>Password</label>
              <input
                id="test-password"
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                disabled={registering}
                style={{ 
                  padding: '10px', 
                  backgroundColor: '#333', 
                  border: '1px solid #444', 
                  borderRadius: '4px',
                  color: 'white'
                }}
              />
            </div>
            
            <button
              type="submit"
              disabled={registering}
              style={{ 
                backgroundColor: '#ffd700', 
                color: 'black', 
                border: 'none', 
                padding: '10px', 
                borderRadius: '4px', 
                fontWeight: 'bold',
                cursor: registering ? 'not-allowed' : 'pointer',
                opacity: registering ? 0.7 : 1
              }}
            >
              {registering ? 'Registering...' : 'Register Test User'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SupabaseConnection;
