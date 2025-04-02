// Simple Express server to handle API requests
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory name (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' })); // Allow requests from Vite dev server
app.use(bodyParser.json());

// API endpoint to save models
app.post('/api/save-models', (req, res) => {
  try {
    const models = req.body;
    
    // Basic validation
    if (!Array.isArray(models)) {
      return res.status(400).json({ message: 'Request body must be an array of models' });
    }
    
    // Validate individual models
    for (const model of models) {
      if (!model['name to show'] || !model.api_name) {
        return res.status(400).json({ 
          message: 'Each model must have "name to show" and "api_name" properties' 
        });
      }
    }
    
    // Two paths to consider: public/model.json and model.json
    const publicFilePath = path.join(__dirname, 'public', 'model.json');
    const rootFilePath = path.join(__dirname, 'model.json');
    
    // Determine which file to update (prefer public/ if it exists)
    const filePath = fs.existsSync(publicFilePath) ? publicFilePath : rootFilePath;
    
    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(models, null, 2));
    
    console.log(`Models saved successfully to ${filePath}`);
    
    return res.status(200).json({ 
      message: 'Models saved successfully',
      totalModels: models.length,
      filepath: filePath
    });
  } catch (error) {
    console.error('Error saving models:', error);
    return res.status(500).json({ 
      message: 'Server error occurred', 
      error: error.message 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
