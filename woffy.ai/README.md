# Woffy.ai

A modern AI chat interface with a sleek black and gold design.

## Overview

Woffy.ai is a React-based chat application that simulates an AI assistant conversation. It features a minimal, elegant UI with a dark theme and gold accents.

## Features

- **Elegant UI**: Black and gold themed interface for a premium look and feel
- **Responsive Design**: Works well on both desktop and mobile devices
- **Interactive Chat**: Simulated AI responses to user messages
- **Auto-scroll**: Automatically scrolls to the latest message

## Technologies Used

- React (with Vite)
- CSS3 with custom variables for theming
- JavaScript (ES6+)

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)

### Installation

1. Clone the repository:
```bash
git clone hhttps://github.com/nikhil8182/woffy.ai-chat.git
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

## Project Structure

```
woffy.ai/
├── public/             # Public assets
├── src/                # Source files
│   ├── components/     # React components
│   ├── styles/         # CSS styles
│   ├── App.jsx         # Main application component
│   ├── main.jsx        # Entry point
│   └── ...
├── index.html          # HTML entry
└── ...
```

## Note on Node.js Version

This application requires Node.js version 18 or higher. If you encounter the following error:

```
TypeError: crypto$2.getRandomValues is not a function
```

Please upgrade your Node.js version:

```bash
# Using nvm (recommended)
nvm install 18
nvm use 18

# Or download from Node.js website
# https://nodejs.org/
```

## License

MIT

## Acknowledgements

- Inspired by modern AI chat interfaces like ChatGPT
- Built with React and Vite for optimal performance
