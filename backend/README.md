# Woffy.ai Backend

This is the backend service for the Woffy.ai chat application. It has been simplified to provide only the chat API endpoint.

## API Overview

The backend now provides a single endpoint:

- `/api/chat` - Handles chat requests and communicates with the OpenAI API

## Key Features

- Direct integration with OpenAI API using gpt-4o-search-preview model
- Simplified architecture with minimal dependencies
- CORS support for cross-origin requests
- FastAPI framework for efficient API handling

## Getting Started

1. Create a `.env` file based on the `.env.sample` template
2. Add your OpenAI API key to the `.env` file
3. Install dependencies: `pip install fastapi uvicorn openai python-dotenv`
4. Run the server: `uvicorn main:app --reload --port 8000`

## Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key (required)

## API Usage

Send a POST request to `/api/chat` with the following JSON body:

```json
{
  "model": "gpt-4o-search-preview", 
  "messages": [
    {"role": "user", "content": "Hello, how can you help me?"}
  ]
}
```

The model parameter is included for compatibility but the backend will always use gpt-4o-search-preview.
