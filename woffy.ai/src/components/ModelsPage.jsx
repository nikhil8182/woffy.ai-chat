import React, { useState, useEffect, useMemo } from 'react';
import '../styles/ModelsPage.css';
import { supabase } from '../lib/supabase';

const ModelsPage = () => {
  const [openRouterModels, setOpenRouterModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  
  // Calculate the base API URL for different environments
  const baseApiUrl = useMemo(() => {
    // Check if we're in a production environment (deployed on Render)
    const isProduction = window.location.hostname !== 'localhost';
    
    if (isProduction) {
      // In production, use the same domain (no need for absolute URL)
      return '';
    } else {
      // In development, try the main FastAPI backend first (port 8000)
      return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    }
  }, []);

  // Fetch models from OpenRouter API
  useEffect(() => {
    const fetchOpenRouterModels = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://openrouter.ai/api/v1/models');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.statusText}`);
        }
        
        const data = await response.json();
        setOpenRouterModels(data.data || []);
        
        // Also load current models from model.json
        await loadCurrentModels();
      } catch (err) {
        console.error("Error fetching models:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOpenRouterModels();
  }, []);

  // Load current models from Supabase
  const loadCurrentModels = async () => {
    try {
      console.log('🔍 Attempting to fetch models from Supabase...');
      console.log('🔑 Using Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'URL is set' : 'URL is missing');
      console.log('🔒 Using Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Key is set' : 'Key is missing');
      
      // Fetch models from Supabase
      const { data: currentModels, error: supabaseError } = await supabase
        .from('models')
        .select('*');
      
      console.log('📦 Supabase response:', { data: currentModels, error: supabaseError });
        
      if (supabaseError) {
        throw new Error(`Failed to load current models: ${supabaseError.message}`);
      }
      
      if (!currentModels || currentModels.length === 0) {
        console.warn('⚠️ No models found in Supabase. Check your models table.');
      } else {
        console.log('✅ Successfully loaded models from Supabase:', currentModels);
      }
      
      // Extract api_names from current models to use for checkbox selection
      const currentModelApiNames = currentModels.map(model => model.api_name);
      setSelectedModels(currentModelApiNames);
    } catch (err) {
      console.error("❌ Error loading current models:", err);
      setError(err.message);
    }
  };

  // Save models to Supabase
  const saveModels = async (modelData) => {
    try {
      setSaveStatus('Saving changes...');
      
      // Always store in localStorage first as a backup - this is our reliable storage method
      localStorage.setItem('selected_models', JSON.stringify(modelData));
      
      // Clear existing models first (transaction-like behavior)
      const { error: deleteError } = await supabase
        .from('models')
        .delete()
        .neq('api_name', 'placeholder'); // Delete all - dummy condition to avoid empty filter
        
      if (deleteError) {
        throw new Error(`Failed to clear existing models: ${deleteError.message}`);
      }
      
      // Insert the new models
      const { error: insertError } = await supabase
        .from('models')
        .insert(modelData);
        
      if (insertError) {
        throw new Error(`Failed to save models: ${insertError.message}`);
      }
      
      // Set success message
      setSaveStatus(`Models selected successfully! (${modelData.length} models)`);
      
      // Clear status after a delay
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error('Error saving models:', err);
      setError(`Could not save model selection: ${err.message}`);
      setSaveStatus('');
    }
  };

  // Handle checkbox changes
  const handleModelSelection = async (modelId, isChecked) => {
    try {
      // Get the current models from Supabase
      const { data: currentModels, error: supabaseError } = await supabase
        .from('models')
        .select('*');
        
      if (supabaseError) {
        throw new Error(`Failed to load models: ${supabaseError.message}`);
      }
      
      let updatedModels = [...currentModels];
      
      if (isChecked) {
        // Add model to selectedModels state
        setSelectedModels(prev => [...prev, modelId]);
        
        // Find the model in OpenRouter models
        const modelToAdd = openRouterModels.find(model => model.id === modelId);
        if (!modelToAdd) {
          throw new Error(`Model with ID ${modelId} not found`);
        }
        
        // Check if this model already exists
        const modelExists = updatedModels.some(model => model.api_name === modelId);
        if (!modelExists) {
          // Add the model to the array
          updatedModels.push({
            "name to show": modelToAdd.name || modelId,
            "api_name": modelId,
            "description": modelToAdd.description || "",
            "added_at": new Date().toISOString()
          });
        }
      } else {
        // Remove model from selectedModels state
        setSelectedModels(prev => prev.filter(id => id !== modelId));
        
        // Remove the model from the array
        updatedModels = updatedModels.filter(model => model.api_name !== modelId);
      }
      
      // Store the updated models in localStorage
      localStorage.setItem('selected_models', JSON.stringify(updatedModels));
      
      // Show success status immediately for better UX
      setSaveStatus(`Model ${isChecked ? 'added to' : 'removed from'} your selection`);
      setTimeout(() => setSaveStatus(''), 3000);
      
      // Save changes automatically
      saveModels(updatedModels);
      
      // Clear any previous errors
      setError(null);
    } catch (err) {
      console.error("Error updating models:", err);
      setError(err.message);
    }
  };

  // Check if a model is currently selected
  const isModelSelected = (modelId) => {
    return selectedModels.includes(modelId);
  };

  // Calculate cost per 1000 tokens
  const formatCost = (cost) => {
    if (!cost) return 'N/A';
    const costPerK = parseFloat(cost) * 1000;
    return `$${costPerK.toFixed(5)}`;
  };

  if (loading) {
    return (
      <div className="models-page">
        <h1>AI Models</h1>
        <div className="loading-indicator">Loading models...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="models-page">
        <h1>AI Models</h1>
        <div className="error-message">Error: {error}</div>
        <button className="retry-button" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="models-page">
      <h1>AI Models</h1>
      <p className="models-description">
        Select models from OpenRouter to add to your chat application. 
        Changes are saved automatically.
      </p>

      {saveStatus && <div className="save-status">{saveStatus}</div>}

      <div className="models-grid">
        {openRouterModels.map(model => (
          <div key={model.id} className="model-card">
            <div className="model-header">
              <h3>{model.name || model.id}</h3>
              <label className="model-checkbox">
                <input 
                  type="checkbox"
                  checked={isModelSelected(model.id)}
                  onChange={(e) => handleModelSelection(model.id, e.target.checked)}
                />
                <span className="checkmark"></span>
              </label>
            </div>
            
            <div className="model-details">
              <p className="model-description">{model.description || "No description available"}</p>
              
              <div className="model-specs">
                <div className="model-spec">
                  <span className="spec-label">Context:</span>
                  <span className="spec-value">{model.context_length ? `${model.context_length.toLocaleString()} tokens` : 'Unknown'}</span>
                </div>
                
                <div className="model-spec">
                  <span className="spec-label">Input Cost:</span>
                  <span className="spec-value">{model.pricing ? formatCost(model.pricing.prompt) : 'Unknown'}</span>
                </div>
                
                <div className="model-spec">
                  <span className="spec-label">Output Cost:</span>
                  <span className="spec-value">{model.pricing ? formatCost(model.pricing.completion) : 'Unknown'}</span>
                </div>
                
                <div className="model-spec">
                  <span className="spec-label">Modalities:</span>
                  <span className="spec-value">
                    {model.architecture?.input_modalities?.join(', ') || 'Text Only'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {openRouterModels.length === 0 && (
        <div className="no-models">
          No models available from OpenRouter API. Please try again later.
        </div>
      )}
    </div>
  );
};

export default ModelsPage;
