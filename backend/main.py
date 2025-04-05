import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv
from openai import OpenAI, APIError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Woffy.ai API", description="Backend API for Woffy.ai chat interface")

# --- CORS Configuration --- 
# Allow requests from your frontend development server
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

# --- OpenAI Configuration --- 
openai_api_key = os.getenv("OPENAI_API_KEY") or None

if not openai_api_key:
    logger.error("FATAL: OPENAI_API_KEY is not set in the .env file.")
    # In a real app, you might want to prevent startup 
    # or return a specific error state here.
    # For simplicity, we'll let it proceed but API calls will fail.

# Initialize OpenAI client
client = OpenAI(
    api_key=openai_api_key
)

# --- Request/Response Models --- 
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    woffy_mode: bool = False  # Default to standard mode

# --- API Endpoints --- 
@app.post("/api/chat", response_model=ChatMessage)
async def chat_endpoint(request: ChatRequest):
    """Receives chat messages and proxies the request to OpenAI."""
    if not openai_api_key:
         raise HTTPException(status_code=500, detail="Server configuration error: API key not set.")

    try:
        # Always use GPT-4o regardless of model requested
        model_to_use = "gpt-4o-search-preview"
        logger.info(f"Processing chat request with model: {model_to_use}")
        
        # Convert the messages to the format required by the API
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Log the number of messages being sent
        logger.info(f"Sending {len(messages)} messages to OpenAI")
        
        # Call the OpenAI API
        completion = client.chat.completions.create(
            model=model_to_use,
            messages=messages,
            response_format={"type": "text"},
            store=False
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
        logger.info("Successfully received response from OpenAI.")
        
        # Return the response message in the expected format
        return ChatMessage(role=response_message.role, content=response_message.content)
    
    except APIError as e:
        logger.error(f"OpenAI API Error: {e.status_code} - {e.message}")
        raise HTTPException(status_code=e.status_code or 500, detail=f"AI Service Error: {e.message}")
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# --- Root Endpoint (Optional) --- 
@app.get("/")
async def read_root():
    return {"message": "Woffy.ai FastAPI backend is running - Simple version with only chat endpoint."}

# --- Running the server (for local development) --- 
# You would typically run this using: uvicorn main:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn
    # Use a different port than the Node.js backend if needed, e.g., 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
