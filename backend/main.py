import os
import json
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, AsyncGenerator, Optional
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
    "http://localhost:5174",         # Vite may use alternative ports
    "http://localhost:5175",         # Vite may use alternative ports
    "http://localhost:5176",         # Vite may use alternative ports
    "http://localhost:5177",         # Vite may use alternative ports
    "http://localhost:8000",         # Local FastAPI server (if accessing API directly)
    "http://127.0.0.1:5173",        # Alternative local dev
    "http://127.0.0.1:5174",        # Alternative local dev with different port
    "http://127.0.0.1:5175",        # Alternative local dev with different port
    "http://127.0.0.1:5176",        # Alternative local dev with different port
    "http://127.0.0.1:5177",        # Alternative local dev with different port
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
    stream: Optional[bool] = False
    woffy_mode: bool = False  # Default to standard mode

# --- API Endpoints --- 
@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """Receives chat messages and proxies the request to OpenAI.
    Supports both streaming and non-streaming responses.
    """
    if not openai_api_key:
         raise HTTPException(status_code=500, detail="Server configuration error: API key not set.")
    
    # Check if streaming is requested
    stream_response = request.stream if hasattr(request, 'stream') else False
    
    try:
        # Always use GPT-4o regardless of model requested
        model_to_use = "gpt-4o-search-preview"
        logger.info(f"Processing chat request with model: {model_to_use}, streaming: {stream_response}")
        
        # Convert the messages to the format required by the API
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Log the number of messages being sent
        logger.info(f"Sending {len(messages)} messages to OpenAI")
        
        # Handle streaming response
        if stream_response:
            return StreamingResponse(
                stream_openai_response(model_to_use, messages),
                media_type="text/event-stream"
            )
        
        # For non-streaming, use the standard approach
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


async def stream_openai_response(model: str, messages: List[dict]) -> AsyncGenerator[str, None]:
    """Stream the OpenAI response chunk by chunk."""
    try:
        # Create a streaming completion
        stream = client.chat.completions.create(
            model=model,
            messages=messages,
            response_format={"type": "text"},
            stream=True,
            store=False
        )
        
        # Process each chunk as it arrives
        for chunk in stream:
            if chunk.choices and len(chunk.choices) > 0:
                choice = chunk.choices[0]
                if choice.delta and hasattr(choice.delta, 'content') and choice.delta.content:
                    # Format the chunk as a server-sent event
                    content = choice.delta.content
                    yield f"data: {json.dumps({'content': content})}\n\n"
                    # Small delay to control the flow rate
                    await asyncio.sleep(0.01)
        
        # Signal the end of the stream
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        logger.error(f"Error in streaming response: {str(e)}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"
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
