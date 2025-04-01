import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../src/styles/AddModelForm.css';

const AddModelForm = () => {
  const [formData, setFormData] = useState({
    nameToShow: '',
    apiName: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nameToShow.trim()) {
      newErrors.nameToShow = 'Display name is required';
    }
    
    if (!formData.apiName.trim()) {
      newErrors.apiName = 'API name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/add-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showNotification('success', 'Model added successfully!');
        setFormData({
          nameToShow: '',
          apiName: '',
          description: ''
        });
        
        // Navigate back to home after successful submission (with a delay)
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        const data = await response.json();
        showNotification('error', data.message || 'Failed to add model');
      }
    } catch (error) {
      showNotification('error', 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  // Cleanup notification when component unmounts
  useEffect(() => {
    return () => {
      if (notification.show) {
        setNotification({ show: false, type: '', message: '' });
      }
    };
  }, []);

  return (
    <div className="add-model-container">
      <div className="add-model-content">
        <div className="add-model-card">
          <h2 className="add-model-title">Add New AI Model</h2>
          
          <form className="add-model-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nameToShow">Display Name</label>
              <input
                type="text"
                id="nameToShow"
                name="nameToShow"
                className="form-control"
                placeholder="e.g. GPT-4 Turbo"
                value={formData.nameToShow}
                onChange={handleChange}
              />
              {errors.nameToShow && <p className="error">{errors.nameToShow}</p>}
              <p className="description">This name will be displayed to users in the chat interface</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="apiName">API Name</label>
              <input
                type="text"
                id="apiName"
                name="apiName"
                className="form-control"
                placeholder="e.g. deepseek/deepseek-v3-base:free"
                value={formData.apiName}
                onChange={handleChange}
              />
              {errors.apiName && <p className="error">{errors.apiName}</p>}
              <p className="description">The model identifier used for API calls (any format accepted)</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                placeholder="Enter a brief description of the model"
                rows="3"
                value={formData.description}
                onChange={handleChange}
              />
              <p className="description">Provide additional information about this model's capabilities</p>
            </div>
            
            <div className="button-container">
              <Link to="/" className="back-button">
                Cancel
              </Link>
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Model'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default AddModelForm; 