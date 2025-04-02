import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

class InstructionRequest(BaseModel):
    instruction: str

# --- Helper Functions ---
def get_instruction():
    """Load the common instruction from the JSON file."""
    try:
        if os.path.exists(INSTRUCTIONS_FILE):
            with open(INSTRUCTIONS_FILE, 'r') as f:
                data = json.load(f)
                return data.get('instruction', '')
        else:
            # Create empty instructions file if it doesn't exist
            with open(INSTRUCTIONS_FILE, 'w') as f:
                json.dump({'instruction': ''}, f)
            return ''
    except Exception as e:
        logger.error(f"Error loading instruction: {e}")
        return ''

def save_instruction(instruction):
    """Save the common instruction to the JSON file."""
    try:
        with open(INSTRUCTIONS_FILE, 'w') as f:
            json.dump({'instruction': instruction}, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving instruction: {e}")
        return False

# --- API Endpoints --- 
@app.get("/api/instructions")
async def get_common_instruction():
    """Get the common instruction for all models."""
    return {"instruction": get_instruction()}

@app.post("/api/instructions")
async def update_common_instruction(request: InstructionRequest):
    """Save the common instruction for all models."""
    if save_instruction(request.instruction):
        return {"status": "success", "message": "Common instruction saved for all models"}
    else:
        raise HTTPException(status_code=500, detail="Failed to save instruction")

@app.post("/api/chat", response_model=ChatMessage)
async def chat_endpoint(request: ChatRequest):
    """Receives chat messages and proxies the request to OpenRouter."""
    if not openrouter_api_key:
         raise HTTPException(status_code=500, detail="Server configuration error: API key not set.")

    logger.info(f"Received request for model: {request.model}")
    
    # Get the common instruction if available
    instruction = get_instruction()
    
    # Prepare messages with system instruction if available
    messages = []
    if instruction:
        # Add system instruction as the first message
        messages.append({"role": "system", "content": instruction})
    
    # Add user messages
    for msg in request.messages:
        messages.append(msg.dict())
    
    try:
        # Log the actual messages being sent for debugging
        logger.info(f"Sending the following messages to model {request.model}: {messages}")
        
        completion = await client.chat.completions.create(
            model=request.model,
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
        # In production (Render), the model.json file is at the root level
        # In development, it's in the woffy.ai/public directory
        # Try both locations
        
        # Production path (Render deployment)
        production_path = os.path.join(os.path.dirname(__file__), "model.json")
        
        # Development path (local setup)
        dev_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "woffy.ai", "public", "model.json")
        
        # Determine which path to use
        if os.path.exists(os.path.dirname(dev_path)):
            models_file = dev_path
        else:
            models_file = production_path
            
        # Create directory if it doesn't exist (for production environment)
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
        return {"status": "success", "message": "Models saved successfully", "path": models_file}
    except Exception as e:
        logger.error(f"Error saving models: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save models: {str(e)}")

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
