import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function SupabaseTest() {
  const [status, setStatus] = useState('Loading...');
  const [models, setModels] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function testSupabase() {
      try {
        console.log('Environment Variables:');
        console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
        console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Key exists (hidden)' : 'Missing key');
        
        // Test direct fetch with URL constructor to validate URL format
        const testUrl = new URL(import.meta.env.VITE_SUPABASE_URL);
        console.log('URL validation passed:', testUrl.toString());
        
        // Test basic supabase connection
        const { data, error } = await supabase
          .from('models')
          .select('*');
          
        if (error) throw error;
        
        setModels(data || []);
        setStatus('Connection successful!');
      } catch (err) {
        console.error('Supabase Test Error:', err);
        setError(err.message);
        setStatus('Connection failed');
      }
    }
    
    testSupabase();
  }, []);
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Supabase Connection Test</h1>
      <div style={{ 
        padding: '10px', 
        background: status === 'Connection successful!' ? '#d4edda' : '#f8d7da',
        color: status === 'Connection successful!' ? '#155724' : '#721c24',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h3>Status: {status}</h3>
        {error && <p>Error: {error}</p>}
      </div>
      
      <h2>Models from Supabase:</h2>
      {models.length === 0 ? (
        <p>No models found in database.</p>
      ) : (
        <ul>
          {models.map((model, index) => (
            <li key={index} style={{ marginBottom: '10px' }}>
              <strong>{model['name to show']}</strong> ({model.api_name})
              <p>{model.description || 'No description'}</p>
            </li>
          ))}
        </ul>
      )}
      
      <h2>Environment Variables:</h2>
      <pre style={{ 
        background: '#f5f5f5', 
        padding: '10px', 
        borderRadius: '4px',
        overflowX: 'auto' 
      }}>
        VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL || 'Not set'}<br />
        VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set (hidden for security)' : 'Not set'}
      </pre>
    </div>
  );
}

export default SupabaseTest;
