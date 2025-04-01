import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { nameToShow, apiName, description } = req.body;
      
      // Basic validation
      if (!nameToShow || !nameToShow.trim()) {
        return res.status(400).json({ message: 'Display name is required' });
      }
      
      if (!apiName || !apiName.trim()) {
        return res.status(400).json({ message: 'API name is required' });
      }
      
      if (!/^[a-zA-Z0-9_-]+$/.test(apiName)) {
        return res.status(400).json({ 
          message: 'API name should only contain letters, numbers, underscores, and hyphens' 
        });
      }

      const filePath = path.join(process.cwd(), 'model.json');

      const data = { 
        "name_to_show": nameToShow.trim(), 
        "api_name": apiName.trim(),
        "description": description || "",
        "added_at": new Date().toISOString()
      };

      // Write the data to the file
      fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
        if (err) {
          console.error('Error writing model data:', err);
          return res.status(500).json({ message: 'Failed to save model data' });
        }
        
        return res.status(200).json({ 
          message: 'Model added successfully',
          model: data
        });
      });
    } catch (error) {
      console.error('Error processing request:', error);
      return res.status(500).json({ message: 'Server error occurred' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
} 