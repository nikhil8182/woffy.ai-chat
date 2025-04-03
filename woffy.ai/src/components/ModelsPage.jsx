import React, { useState, useEffect, useMemo } from 'react';
import '../styles/ModelsPage.css';
import { supabase } from '../lib/supabase';
import { FiSearch, FiFilter, FiStar, FiInfo, FiCheck, FiX } from 'react-icons/fi';

const ModelsPage = () => {
  const [openRouterModels, setOpenRouterModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedModelDetails, setSelectedModelDetails] = useState(null);
  
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
  
  // Filter models based on search term and filter type
  const filteredModels = useMemo(() => {
    let result = openRouterModels;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(model => 
        model.name?.toLowerCase().includes(term) || 
        model.id?.toLowerCase().includes(term) ||
        model.description?.toLowerCase().includes(term));
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      if (filterType === 'selected') {
        result = result.filter(model => isModelSelected(model.id));
      } else if (filterType === 'newest') {
        // This is a simplified way to show "newest" - in a real app you might have a created_at field
        result = [...result].sort((a, b) => b.context_length - a.context_length);
      }
    }
    
    return result;
  }, [openRouterModels, searchTerm, filterType, selectedModels]);
  
  // Open model details modal
  const openModelDetails = (model) => {
    setSelectedModelDetails(model);
    setModalOpen(true);
  };
  
  // Close model details modal
  const closeModal = () => {
    setModalOpen(false);
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
        <div className="models-loading">
          <div className="loading-spinner">
            <div className="spinner-inner"></div>
          </div>
          <p>Loading available AI models...</p>
        </div>
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
      <div className="models-header">
        <h1>AI Models</h1>
        <p className="models-description">
          Select models from OpenRouter to add to your chat application.
          <span className="save-info">Changes are saved automatically.</span>
        </p>
        
        <div className="models-controls">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search models..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="clear-search" 
                onClick={() => setSearchTerm('')}
              >
                <FiX />
              </button>
            )}
          </div>
          
          <div className="filter-controls">
            <div className="filter-label">
              <FiFilter />
              <span>Filter:</span>
            </div>
            <div className="filter-options">
              <button 
                className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                All
              </button>
              <button 
                className={`filter-btn ${filterType === 'selected' ? 'active' : ''}`}
                onClick={() => setFilterType('selected')}
              >
                Selected
              </button>
              <button 
                className={`filter-btn ${filterType === 'newest' ? 'active' : ''}`}
                onClick={() => setFilterType('newest')}
              >
                Newest
              </button>
            </div>
          </div>
        </div>
      </div>

      {saveStatus && <div className="save-status">{saveStatus}</div>}
      
      {filteredModels.length === 0 && !loading && (
        <div className="no-results">
          <FiInfo size={24} />
          <p>No models found matching your search criteria.</p>
          <button className="clear-btn" onClick={() => {
            setSearchTerm('');
            setFilterType('all');
          }}>Clear filters</button>
        </div>
      )}

      <div className="models-grid">
        {filteredModels.map(model => (
          <div key={model.id} className={`model-card ${isModelSelected(model.id) ? 'selected' : ''}`}>
            <div className="model-selection" onClick={() => handleModelSelection(model.id, !isModelSelected(model.id))}>
              {isModelSelected(model.id) ? (
                <div className="model-selected">
                  <FiCheck />
                </div>
              ) : (
                <div className="model-unselected">
                  <span></span>
                </div>
              )}
            </div>
            
            <div className="model-header">
              <h3>{model.name || model.id}</h3>
              {isModelSelected(model.id) && <FiStar className="model-starred" />}
            </div>
            
            <div className="model-details">
              <p className="model-description">{model.description || "No description available"}</p>
              
              <div className="model-specs">
                <div className="model-spec">
                  <span className="spec-label">Context</span>
                  <span className="spec-value">{model.context_length ? `${model.context_length.toLocaleString()} tokens` : 'Unknown'}</span>
                </div>
                
                <div className="model-spec">
                  <span className="spec-label">Input</span>
                  <span className="spec-value">{model.pricing ? formatCost(model.pricing.prompt) : 'Unknown'}</span>
                </div>
                
                <div className="model-spec">
                  <span className="spec-label">Output</span>
                  <span className="spec-value">{model.pricing ? formatCost(model.pricing.completion) : 'Unknown'}</span>
                </div>
                
                <div className="model-spec">
                  <span className="spec-label">Type</span>
                  <span className="spec-value">
                    {model.architecture?.input_modalities?.join(', ') || 'Text Only'}
                  </span>
                </div>
              </div>
              
              <button className="view-details-btn" onClick={() => openModelDetails(model)}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {openRouterModels.length === 0 && !loading && (
        <div className="no-models">
          <FiInfo size={24} />
          <p>No models available from OpenRouter API. Please try again later.</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      )}
      
      {/* Model Details Modal */}
      {modalOpen && selectedModelDetails && (
        <div className="model-modal-overlay" onClick={closeModal}>
          <div className="model-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <FiX />
            </button>
            
            <div className="modal-header">
              <h2>{selectedModelDetails.name || selectedModelDetails.id}</h2>
              <div className="modal-actions">
                <label className="modal-checkbox">
                  <input 
                    type="checkbox"
                    checked={isModelSelected(selectedModelDetails.id)}
                    onChange={(e) => handleModelSelection(selectedModelDetails.id, e.target.checked)}
                  />
                  <span>{isModelSelected(selectedModelDetails.id) ? 'Selected' : 'Add to Selection'}</span>
                </label>
              </div>
            </div>
            
            <div className="modal-body">
              <div className="modal-section">
                <h3>Description</h3>
                <p>{selectedModelDetails.description || "No description available"}</p>
              </div>
              
              <div className="modal-section">
                <h3>Technical Specifications</h3>
                <div className="modal-specs">
                  <div className="modal-spec">
                    <span className="spec-label">Context Length</span>
                    <span className="spec-value">{selectedModelDetails.context_length ? `${selectedModelDetails.context_length.toLocaleString()} tokens` : 'Unknown'}</span>
                  </div>
                  
                  <div className="modal-spec">
                    <span className="spec-label">Input Cost</span>
                    <span className="spec-value">{selectedModelDetails.pricing ? formatCost(selectedModelDetails.pricing.prompt) : 'Unknown'}</span>
                  </div>
                  
                  <div className="modal-spec">
                    <span className="spec-label">Output Cost</span>
                    <span className="spec-value">{selectedModelDetails.pricing ? formatCost(selectedModelDetails.pricing.completion) : 'Unknown'}</span>
                  </div>
                  
                  <div className="modal-spec">
                    <span className="spec-label">Modalities</span>
                    <span className="spec-value">
                      {selectedModelDetails.architecture?.input_modalities?.join(', ') || 'Text Only'}
                    </span>
                  </div>
                  
                  <div className="modal-spec">
                    <span className="spec-label">Model ID</span>
                    <span className="spec-value">{selectedModelDetails.id}</span>
                  </div>
                </div>
              </div>
              
              {selectedModelDetails.parameter_count && (
                <div className="modal-section">
                  <h3>Model Size</h3>
                  <p>{(selectedModelDetails.parameter_count / 1000000000).toFixed(1)} billion parameters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelsPage;
