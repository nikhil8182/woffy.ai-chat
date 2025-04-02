import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// Custom plugin to handle API requests
function apiHandler() {
  return {
    name: 'api-handler',
    configureServer(server) {
      // Add middleware for saving models directly to model.json
      server.middlewares.use('/api/save-models', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', () => {
            try {
              const models = JSON.parse(body);
              
              // Basic validation
              if (!Array.isArray(models)) {
                res.statusCode = 400;
                res.end(JSON.stringify({ message: 'Request body must be an array of models' }));
                return;
              }
              
              // Validate individual models
              for (const model of models) {
                if (!model['name to show'] || !model.api_name) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ message: 'Each model must have "name to show" and "api_name" properties' }));
                  return;
                }
              }
              
              // Two paths to consider: public/model.json (for production) and model.json (for dev)
              const publicFilePath = path.join(process.cwd(), 'public', 'model.json');
              const rootFilePath = path.join(process.cwd(), 'model.json');
              
              // Determine which file to update (prefer public/ if it exists)
              let filePath = fs.existsSync(publicFilePath) ? publicFilePath : rootFilePath;
              
              // Write to file
              fs.writeFile(filePath, JSON.stringify(models, null, 2), (err) => {
                if (err) {
                  console.error('Error writing model data:', err);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ message: 'Failed to save model data', error: err.message }));
                  return;
                }
                
                // If we updated the root file but not the public file, and public exists, copy to public
                if (filePath === rootFilePath && fs.existsSync(path.join(process.cwd(), 'public'))) {
                  try {
                    fs.writeFileSync(publicFilePath, JSON.stringify(models, null, 2));
                  } catch (copyErr) {
                    console.warn('Warning: Updated root model.json but failed to copy to public/', copyErr);
                  }
                }
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  message: 'Models saved successfully',
                  totalModels: models.length,
                  filepath: filePath
                }));
              });
            } catch (error) {
              console.error('Error processing save-models request:', error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ message: 'Server error occurred', error: error.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.setHeader('Allow', ['POST']);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: `Method ${req.method} not allowed` }));
        }
      });
      
      server.middlewares.use('/api/add-model', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', () => {
            try {
              const { nameToShow, apiName, description } = JSON.parse(body);
              
              // Basic validation
              if (!nameToShow || !nameToShow.trim()) {
                res.statusCode = 400;
                res.end(JSON.stringify({ message: 'Display name is required' }));
                return;
              }
              
              if (!apiName || !apiName.trim()) {
                res.statusCode = 400;
                res.end(JSON.stringify({ message: 'API name is required' }));
                return;
              }
              
              const filePath = path.join(process.cwd(), 'model.json');
              
              // Create the new model entry
              const newModel = { 
                "name to show": nameToShow.trim(), 
                "api_name": apiName.trim(),
                "description": description || "",
                "added_at": new Date().toISOString()
              };
              
              // Read existing models, or create empty array if file doesn't exist
              let models = [];
              try {
                if (fs.existsSync(filePath)) {
                  const fileData = fs.readFileSync(filePath, 'utf8');
                  const content = JSON.parse(fileData);
                  
                  // Check if it's an array or a single object
                  if (Array.isArray(content)) {
                    models = content;
                  } else {
                    // If it's a single object, convert to array with that object
                    models = [content];
                  }
                }
              } catch (err) {
                console.error('Error reading models file:', err);
                // Continue with empty array if file can't be read
              }
              
              // Add the new model
              models.push(newModel);
              
              // Write back to file
              fs.writeFile(filePath, JSON.stringify(models, null, 2), (err) => {
                if (err) {
                  console.error('Error writing model data:', err);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ message: 'Failed to save model data' }));
                  return;
                }
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  message: 'Model added successfully',
                  model: newModel,
                  totalModels: models.length
                }));
              });
            } catch (error) {
              console.error('Error processing request:', error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ message: 'Server error occurred' }));
            }
          });
        } else {
          res.statusCode = 405;
          res.setHeader('Allow', ['POST']);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: `Method ${req.method} not allowed` }));
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    apiHandler()
  ],
  server: {
    historyApiFallback: true
  }
})
