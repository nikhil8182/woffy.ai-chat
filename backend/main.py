import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from openai import OpenAI, AsyncOpenAI, APIError
import logging
import json
import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Path to the instructions file
INSTRUCTIONS_FILE = os.path.join(os.path.dirname(__file__), "instructions.json")

app = FastAPI(title="Woffy.ai API", description="Backend API for Woffy.ai chat interface")

# --- CORS Configuration --- 
# Allow requests from your frontend development server
# Update origin if your frontend runs on a different port
origins = [
    "http://localhost:5173",         # Local React dev server
    "http://localhost:8000",         # Local FastAPI server (if accessing API directly)
    "http://127.0.0.1:5173",        # Alternative local dev
    "https://woffy-ai-chat.onrender.com", # Deployed Frontend URL
    "https://chat.woffy.ai",           # Deployed Frontend URL (Custom Domain)
    # Add any other origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods including GET, POST, etc.
    allow_headers=["*"],  # Allow all headers
)

# --- OpenRouter Configuration --- 
openrouter_api_key = os.getenv("OPENROUTER_API_KEY") or None
http_referer = os.getenv("HTTP_REFERER") # Optional
x_title = os.getenv("X_TITLE") # Optional

if not openrouter_api_key:
    logger.error("FATAL: OPENROUTER_API_KEY is not set in the .env file.")
    # In a real app, you might want to prevent startup 
    # or return a specific error state here.
    # For simplicity, we'll let it proceed but API calls will fail.

default_headers = {}
if http_referer: 
    default_headers['HTTP-Referer'] = http_referer
if x_title:
    default_headers['X-Title'] = x_title

# Initialize OpenAI client (use AsyncOpenAI for async FastAPI)
client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=openrouter_api_key,
    default_headers=default_headers
)

# --- Request/Response Models --- 
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    woffy_mode: bool = True  # Default to Woffy Mode ON

class InstructionRequest(BaseModel):
    instruction: str
    mode: str = 'woffy_mode'  # Default to woffy_mode if not specified

# --- Helper Functions ---
def get_instruction(mode='woffy_mode'):
    """Load the instruction based on mode from the JSON file.
    mode: 'woffy_mode' or 'normal_mode'"""
    try:
        if os.path.exists(INSTRUCTIONS_FILE):
            with open(INSTRUCTIONS_FILE, 'r') as f:
                data = json.load(f)
                # Return the appropriate instruction based on mode
                # Default to empty string if the mode is not found
                return data.get(mode, '')
        else:
            # Create default instructions file if it doesn't exist
            with open(INSTRUCTIONS_FILE, 'w') as f:
                default_instructions = {
                    'woffy_mode': 'Your name is Woffy. Behave like a friendly dog assistant.',
                    'normal_mode': 'You are an advanced AI assistant.'
                }
                json.dump(default_instructions, f, indent=2)
            return default_instructions.get(mode, '')
    except Exception as e:
        logger.error(f"Error loading instruction: {e}")
        return ''

def save_instruction(instruction, mode='woffy_mode'):
    """Save the instruction to the JSON file based on mode.
    mode: 'woffy_mode' or 'normal_mode'"""
    try:
        # Load existing instructions
        current_instructions = {}
        if os.path.exists(INSTRUCTIONS_FILE):
            with open(INSTRUCTIONS_FILE, 'r') as f:
                current_instructions = json.load(f)
        
        # Update the specific mode instruction
        current_instructions[mode] = instruction
        
        # Save back to file
        with open(INSTRUCTIONS_FILE, 'w') as f:
            json.dump(current_instructions, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving instruction: {e}")
        return False

# --- API Endpoints --- 
@app.get("/api/instructions")
async def get_instructions():
    """Get instructions for both modes."""
    return {
        "woffy_mode": get_instruction('woffy_mode'),
        "normal_mode": get_instruction('normal_mode')
    }

@app.post("/api/instructions")
async def update_instruction(request: InstructionRequest):
    """Save the instruction for the specified mode."""
    if save_instruction(request.instruction, request.mode):
        return {"status": "success", "message": f"Instruction saved for {request.mode}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to save instruction")

@app.post("/api/chat", response_model=ChatMessage)
async def chat_endpoint(request: ChatRequest):
    """Receives chat messages and proxies the request to OpenRouter."""
    if not openrouter_api_key:
         raise HTTPException(status_code=500, detail="Server configuration error: API key not set.")

    # Hardcode model to gpt-4o-search-preview (hidden from user)
    hardcoded_model = "openai/gpt-4o-search-preview"
    logger.info(f"Received chat request for woffy.ai")
    
    # Get instruction based on woffy_mode setting
    mode = 'woffy_mode' if request.woffy_mode else 'normal_mode'
    instruction = get_instruction(mode)
    
    logger.info(f"Mode: {mode} - Using instruction: {instruction if instruction else 'Empty'}")
    
    # Prepare messages with system instruction
    messages = []
    
    # Always add a system message, but content depends on woffy_mode
    messages.append({"role": "system", "content": instruction})
    
    # Add user messages
    for msg in request.messages:
        messages.append(msg.dict())
    
    try:
        # Log the actual messages being sent for debugging
        logger.info(f"Processing woffy.ai chat request with {len(messages)} messages")
        
        completion = await client.chat.completions.create(
            model="openai/gpt-4o-search-preview",  # Hardcoded model instead of request.model
            messages=messages,
            max_tokens=1024  # Limiting max tokens to prevent credit issues
        )
        
        # Add safety checks to avoid NoneType errors
        if not completion:
            logger.error("Received None completion from OpenRouter API")
            raise HTTPException(status_code=500, detail="Empty response from AI service")
            
        if not hasattr(completion, 'choices') or not completion.choices:
            logger.error(f"No choices in completion response: {completion}")
            raise HTTPException(status_code=500, detail="Invalid response format from AI service")
        
        # Get the first choice safely
        choice = completion.choices[0]
        if not hasattr(choice, 'message') or not choice.message:
            logger.error(f"No message in response choice: {choice}")
            raise HTTPException(status_code=500, detail="Invalid message format from AI service")
        
        response_message = choice.message
        logger.info("Successfully received response from OpenRouter.")
        
        # Return the response message in the expected format
        return ChatMessage(role=response_message.role, content=response_message.content)
    
    except APIError as e:
        logger.error(f"OpenRouter API Error: {e.status_code} - {e.message}")
        raise HTTPException(status_code=e.status_code or 500, detail=f"AI Service Error: {e.message}")
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# --- Models Endpoint ---
@app.post("/api/save-models")
async def save_models(models: List[Dict[str, Any]]):
    """Save models to model.json file."""
    try:
        # Log the incoming request for debugging
        logger.info(f"Received request to save {len(models)} models")
        
        # Possible paths for model.json
        possible_paths = [
            # Render deployment path - app root
            os.path.join(os.path.dirname(__file__), "model.json"),
            # Render deployment path - backend folder
            os.path.join(os.path.dirname(__file__), "public", "model.json"),
            # Development path
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "woffy.ai", "public", "model.json")
        ]
        
        # Find the first valid path
        models_file = None
        for path in possible_paths:
            # Check if the directory exists
            if os.path.exists(os.path.dirname(path)):
                models_file = path
                logger.info(f"Using path: {models_file}")
                break
                
        # If no valid path found, default to backend directory
        if not models_file:
            models_file = os.path.join(os.path.dirname(__file__), "model.json")
            logger.info(f"No valid path found, defaulting to: {models_file}")
            
            # Create directory if needed
            os.makedirs(os.path.dirname(models_file), exist_ok=True)
        
        # Ensure the models are in the expected format
        formatted_models = []
        for model in models:
            formatted_model = {
                "name to show": model.get("name to show", model.get("name", model.get("api_name", ""))),
                "api_name": model.get("api_name", ""),
                "description": model.get("description", ""),
                "added_at": model.get("added_at", "") 
            }
            formatted_models.append(formatted_model)
        
        # Write the models to the file
        with open(models_file, 'w') as f:
            json.dump(formatted_models, f, indent=2)
        
        logger.info(f"Models saved successfully to {models_file}")
        
        # Return a simple response structure to avoid JSON parsing issues
        # Make sure to use JSONResponse explicitly to ensure proper content type
        return JSONResponse(
            status_code=200,
            content={
                "status": "success", 
                "message": "Models saved successfully", 
                "count": len(formatted_models)
            },
            headers={"Content-Type": "application/json"}
        )
    except Exception as e:
        logger.error(f"Error saving models: {e}")
        # Return a simple error structure
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Failed to save models: {str(e)}"}
        )

# --- Root Endpoint (Optional) --- 
@app.get("/")
async def read_root():
    return {"message": "Woffy.ai FastAPI backend is running."}

# --- Running the server (for local development) --- 
# You would typically run this using: uvicorn main:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn
    # Use a different port than the Node.js backend if needed, e.g., 8000
    uvicorn.run(app, host="0.0.0.0", port=8000) 
