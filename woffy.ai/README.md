# Woffy.ai

A modern AI chat interface with a sleek black and gold design.

![Woffy.ai Interface](https://via.placeholder.com/800x450.png?text=Woffy.ai+Interface)

## Overview

Woffy.ai is a React-based chat application featuring:
*   A **Vite React frontend** ([woffy.ai](./woffy.ai/)) with a sleek black and gold themed UI.
*   A **FastAPI Python backend** ([backend](./backend/)) that connects to AI models via OpenRouter.

It allows users to interact with configured AI models, manage model settings, and set global instructions.

## Features

- **Elegant UI**: Black and gold themed interface for a premium look and feel
- **Responsive Design**: Works well on both desktop and mobile devices
- **Interactive Chat**: Simulated AI responses to user messages
- **Auto-scroll**: Automatically scrolls to the latest message
- **Navigation Bar**: Easy switching between chat and model configuration
- **Model Management**: Add and configure AI models through a user-friendly form
- **Real-time Validation**: Form validation with helpful error messages
- **Notifications**: Success and error notifications for better user feedback
- **Woffy Mode Toggle**: Switch between dog-like AI responses and standard AI communication
- **Enhanced Message Bubbles**: Modern message display with gradients, shadows, and animations
- **Improved Input Area**: Refined input field and send button for better usability

## Screenshots

![Chat Interface](https://via.placeholder.com/400x300.png?text=Chat+Interface)
![Add Model Form](https://via.placeholder.com/400x300.png?text=Add+Model+Form)

## Technologies Used

*   **Frontend**: React 19, Vite, React Router, CSS3
*   **Backend**: Python 3.11+, FastAPI, Uvicorn, OpenAI Python SDK (for OpenRouter), python-dotenv
*   **AI Service**: OpenRouter

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
nvm use 18
npm run devnvm use 18
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```
(or the URL shown in your terminal if port 5173 is in use)

### Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd ../backend
    ```

2.  Create a virtual environment (optional but recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  Create a `.env` file in the `backend` directory and add your OpenRouter API key:
    ```env
    OPENROUTER_API_KEY="your_openrouter_api_key_here"
    # Optional: Add HTTP_REFERER and X_TITLE if needed by OpenRouter
    # HTTP_REFERER="https://your-site-url.com"
    # X_TITLE="Woffy.ai"
    ```

5.  Run the backend server:
    ```bash
    uvicorn main:app --reload --port 8000
    ```
    The backend API will be available at `http://localhost:8000`.

### Running Both Frontend and Backend

1.  Start the backend server first (in one terminal).
2.  Start the frontend development server (in a separate terminal).
3.  Open `http://localhost:5173` (or the Vite port) in your browser.

## Project Structure

```
woffy.ai-chat/
├── backend/                 # Python FastAPI Backend
│   ├── .env                 # Environment variables (API Key)
│   ├── .gitignore
│   ├── main.py              # FastAPI app
│   ├── requirements.txt     # Python dependencies
│   └── instructions.json    # Stored common instruction
│   └── venv/                # Virtual environment (if created)
├── woffy.ai/                # Vite React Frontend
│   ├── public/
│   ├── src/                 # Source files (Components, Styles, etc.)
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── README.md            # This file
│   ├── vite.config.js
│   └── robots.txt
├── .git/
├── package.json             # (Minimal, potentially for workspace tooling)
└── package-lock.json
```

## How It Works

### Chat Interface

The chat interface provides a simulation of an AI assistant conversation. Currently, it uses hardcoded responses, but it can be extended to integrate with actual AI models using the configuration from the model.json file.

### Woffy Mode Toggle

The Woffy Mode toggle is positioned in the model selector area at the top-right of the chat interface. It allows users to switch between:
- **Woffy Mode ON**: AI responses with dog-like personality traits
- **Woffy Mode OFF**: Standard AI communication style

This feature enhances user engagement by providing two distinct interaction modes without changing the underlying AI model.

### Add Model

The "Add Model" feature allows you to configure which AI model to use. When you submit the form:

1. The application validates your inputs
2. It sends a POST request to the API endpoint
3. The Vite middleware (configured in vite.config.js) processes the request
4. The model information is saved to the model.json file
5. A success notification is displayed and you're redirected to the chat interface

### Backend API

The Python FastAPI backend handles:
*   Serving chat requests by proxying them to OpenRouter.
*   Managing a common system instruction for AI models.
*   CORS (Cross-Origin Resource Sharing) to allow the frontend to make requests.

Key Endpoints:
*   `POST /api/chat`: Sends user messages (prepended with the common instruction) to the specified OpenRouter model and returns the AI's response.
*   `GET /api/instructions`: Retrieves the current common instruction.
*   `POST /api/instructions`: Updates the common instruction.

## Deployment to Render

This project can be deployed to Render using two services: a **Static Site** for the frontend and a **Web Service** for the backend.

### 1. Backend Deployment (Web Service)

*   **Repository:** Your GitHub/GitLab repo
*   **Branch:** `main` (or your deployment branch)
*   **Root Directory:** `backend`
*   **Runtime:** `Python 3` (Select a specific version like 3.11)
*   **Build Command:** `pip install -r requirements.txt`
*   **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
*   **Environment Variables:**
    *   `PYTHON_VERSION`: `3.11` (or your chosen Python version)
    *   `OPENROUTER_API_KEY`: Your key
    *   `HTTP_REFERER`: (Optional)
    *   `X_TITLE`: (Optional)

### 2. Frontend Deployment (Static Site)

*   **Repository:** Your GitHub/GitLab repo
*   **Branch:** `main` (or your deployment branch)
*   **Root Directory:** `woffy.ai`
*   **Build Command:** `npm install && npm run build`
*   **Publish Directory:** `dist`

### 3. CORS Configuration (Important!)

*   After deploying the frontend, **copy its Render URL** (e.g., `https://your-app-name.onrender.com`).
*   Go back to your **backend service settings** in Render.
*   Add an **Environment Variable**:
    *   Key: `FRONTEND_URL` (or similar)
    *   Value: Your full frontend Render URL.
*   **Modify `backend/main.py`:** Update the `origins` list in the CORS middleware configuration to include your deployed frontend URL. You can use the environment variable you just set.
    ```python
    # backend/main.py
    # ... (imports)
    load_dotenv()
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173") # Default for safety
    
    origins = [
        "http://localhost",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        frontend_url, # Add deployed frontend URL
    ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins, # Use the updated list
        # ... rest of config
    )
    # ... rest of the file
    ```
*   **Redeploy the backend service** for the CORS change to take effect.

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
