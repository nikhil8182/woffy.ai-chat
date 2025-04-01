# Woffy.ai

A modern AI chat interface with a sleek black and gold design.

![Woffy.ai Interface](https://via.placeholder.com/800x450.png?text=Woffy.ai+Interface)

## Overview

Woffy.ai is a React-based chat application that simulates an AI assistant conversation. It features a minimal, elegant UI with a dark theme and gold accents. The application consists of a chat interface and an "Add Model" page that allows users to configure which AI model to use.

## Features

- **Elegant UI**: Black and gold themed interface for a premium look and feel
- **Responsive Design**: Works well on both desktop and mobile devices
- **Interactive Chat**: Simulated AI responses to user messages
- **Auto-scroll**: Automatically scrolls to the latest message
- **Navigation Bar**: Easy switching between chat and model configuration
- **Model Management**: Add and configure AI models through a user-friendly form
- **Real-time Validation**: Form validation with helpful error messages
- **Notifications**: Success and error notifications for better user feedback

## Screenshots

![Chat Interface](https://via.placeholder.com/400x300.png?text=Chat+Interface)
![Add Model Form](https://via.placeholder.com/400x300.png?text=Add+Model+Form)

## Technologies Used

- React 19 (with Vite)
- React Router for navigation
- CSS3 with custom variables for theming
- JavaScript (ES6+)
- Vite middleware for API handling

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher) - **IMPORTANT**: This application will not run on Node.js v16 or lower
- npm (v8.0.0 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/nikhil8182/woffy.ai-chat.git
cd woffy.ai
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```
(or the URL shown in your terminal if port 5173 is in use)

## Project Structure

```
woffy.ai/
├── public/                # Public assets
├── src/                   # Source files
│   ├── components/        # React components
│   │   ├── ChatPage.jsx   # Chat interface component
│   │   └── NavBar.jsx     # Navigation bar component
│   ├── styles/            # CSS styles
│   │   ├── ChatPage.css   # Chat styling
│   │   ├── NavBar.css     # Navigation bar styling
│   │   └── AddModelForm.css # Form styling
│   ├── App.jsx            # Main application component
│   └── main.jsx           # Entry point
├── frontend/              # Additional frontend components
│   └── AddModelForm.jsx   # Form for adding models
├── api/                   # API handlers
│   └── add-model.js       # Original API endpoint (not used with Vite config)
├── model.json             # Stores the current model configuration
├── robots.txt             # Instructions for AI agents
├── vite.config.js         # Vite configuration with API middleware
└── index.html             # HTML entry
```

## How It Works

### Chat Interface

The chat interface provides a simulation of an AI assistant conversation. Currently, it uses hardcoded responses, but it can be extended to integrate with actual AI models using the configuration from the model.json file.

### Add Model

The "Add Model" feature allows you to configure which AI model to use. When you submit the form:

1. The application validates your inputs
2. It sends a POST request to the API endpoint
3. The Vite middleware (configured in vite.config.js) processes the request
4. The model information is saved to the model.json file
5. A success notification is displayed and you're redirected to the chat interface

### API Handling

Instead of requiring a separate backend server, this application uses Vite's middleware capabilities to handle API requests:

```javascript
// From vite.config.js
function apiHandler() {
  return {
    name: 'api-handler',
    configureServer(server) {
      server.middlewares.use('/api/add-model', (req, res, next) => {
        // API handling logic...
      });
    }
  }
}
```

This approach simplifies development by keeping everything in a single project.

## Troubleshooting

### Node.js Version Issues

If you encounter the following error:

```
TypeError: crypto$2.getRandomValues is not a function
```

This means you're using an older version of Node.js. Please upgrade to Node.js v18 or higher:

```bash
# Using nvm (recommended)
nvm install 18
nvm use 18

# Or download from Node.js website
# https://nodejs.org/
```

### API Not Working

If the "Add Model" feature isn't working:

1. Make sure you're running the application with `npm run dev`
2. Check the browser console for any errors
3. Verify that the Vite middleware is correctly set up in vite.config.js
4. Ensure you have write permissions for the model.json file

## Customization

### Changing the Theme

The application uses CSS variables for theming. You can easily change the colors by modifying the `:root` variables in the CSS files:

```css
:root {
  --primary-bg: #121212;
  --secondary-bg: #1e1e1e;
  --accent-gold: #d4af37;
  --text-light: #f0f0f0;
  --text-dark: #121212;
}
```

## Future Enhancements

- Integration with actual AI models via API
- User authentication
- Conversation history
- Theme customization
- Multiple chat sessions
- Export/import conversations

## License

MIT

## Acknowledgements

- Inspired by modern AI chat interfaces like ChatGPT
- Built with React and Vite for optimal performance
