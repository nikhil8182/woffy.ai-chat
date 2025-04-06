# Woffy.ai Chat Project

This repository contains the code for the Woffy.ai chat application, a modern AI chat interface with an elegant black and gold theme and enhanced user experience.

## Project Structure

*   **`./woffy.ai/`**: Contains the React/Vite frontend application with modern UI/UX design, responsive layout, and features like Woffy Mode toggle for switching between dog-like and standard AI responses.
*   **`./backend/`**: Contains the Python/FastAPI backend API server that connects to OpenAI with support for the Woffy Mode feature.

## Setup and Running Locally

### Prerequisites

- Node.js 18+ for the frontend
- Python 3.9+ for the backend
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment (if not already done):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   - Copy `.env.sample` to `.env`
   - Add your OpenAI API key to the `.env` file

5. Run the backend server:
   ```bash
   python main.py
   ```
   The backend server will be available at http://0.0.0.0:8000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd woffy.ai
   ```

2. Install the required dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend application will be available at http://127.0.0.1:5173

### Running Both Services

For a fully functional application, you need to run both the frontend and backend services simultaneously. Open two terminal windows and follow the instructions above for each component.

## Recent Enhancements

* **Improved UI/UX**: Enhanced the overall user experience with modern message bubbles, better visual hierarchy, and smooth animations
* **Woffy Mode Toggle**: Added a toggle button in the model selector area to switch between dog-like AI responses and normal AI communication
* **Responsive Design**: Made the interface work well on all device sizes with optimized layouts
* **Enhanced Message Display**: Added visual improvements to message bubbles including hover effects and better styling
* **Input Area Refinements**: Improved the chat input area with better focus states and visual feedback
* **Authentication System**: Implemented comprehensive authentication with email/password, Google OAuth, and GitHub authentication

Please refer to the [./woffy.ai/README.md](./woffy.ai/README.md) for additional setup, usage, and deployment details.
