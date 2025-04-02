import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from dotenv import load_dotenv
from openai import OpenAI, AsyncOpenAI, APIError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# --- CORS Configuration --- 
# Allow requests from your frontend development server
# Update origin if your frontend runs on a different port
origins = [
    "http://localhost",
    "http://localhost:5173", # Default Vite port
    "http://127.0.0.1:5173",
    # Add other origins if needed (e.g., your deployed frontend URL)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["POST"], # Allow only POST for the chat endpoint
    allow_headers=["*"], # Allow all headers
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

# --- API Endpoint --- 
@app.post("/api/chat", response_model=ChatMessage) # Define expected response model
async def chat_endpoint(request: ChatRequest):
    """Receives chat messages and proxies the request to OpenRouter."""
    if not openrouter_api_key:
         raise HTTPException(status_code=500, detail="Server configuration error: API key not set.")

    logger.info(f"Received request for model: {request.model}")
    try:
        completion = await client.chat.completions.create(
            model=request.model,
            messages=[msg.dict() for msg in request.messages] # Convert Pydantic models to dicts
        )
        
        response_message = completion.choices[0].message
        logger.info("Successfully received response from OpenRouter.")
        # Return the response message in the expected format
        return ChatMessage(role=response_message.role, content=response_message.content)
    
    except APIError as e:
        logger.error(f"OpenRouter API Error: {e.status_code} - {e.message}")
        raise HTTPException(status_code=e.status_code or 500, detail=f"AI Service Error: {e.message}")
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

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
