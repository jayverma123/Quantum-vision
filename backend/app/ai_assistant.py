
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from groq import Groq
from pydantic import BaseModel, Field


# ---------------------------------------------------------
# LOAD ENVIRONMENT VARIABLES
# ---------------------------------------------------------

# .env is located in the backend folder.
ENV_FILE = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_FILE)


# ---------------------------------------------------------
# ROUTER AND GROQ CONFIGURATION
# ---------------------------------------------------------

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Assistant"],
)

api_key = os.getenv("GROQ_API_KEY")

client = Groq(api_key=api_key) if api_key else None


# ---------------------------------------------------------
# REQUEST MODEL
# ---------------------------------------------------------

class QuestionRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Ask the Quantum Vision AI assistant a question.",
    )


# ---------------------------------------------------------
# AI ASSISTANT ENDPOINT
# ---------------------------------------------------------

@router.post("/ask")
def ask_ai(request: QuestionRequest):

    # Check whether the API key was loaded.
    if not api_key or not client:
        print("GROQ ERROR: GROQ_API_KEY was not found.")

        raise HTTPException(
            status_code=500,
            detail=(
                "Groq API key is missing. "
                "Check that backend/.env contains GROQ_API_KEY=your_key"
            ),
        )

    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Please enter a question.",
        )

    try:
        # Send the question to Groq.
        response = client.chat.completions.create(
           model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are the Quantum Vision AI Assistant. "
                        "You help users understand satellite imagery, "
                        "semantic search, geospatial analysis, change detection, "
                        "and technical reports. "
                        "Use simple, clear language. "
                        "Never claim to have analyzed an image unless actual "
                        "image-analysis results have been provided. "
                        "Explain uncertainty when evidence is insufficient."
                    ),
                },
                {
                    "role": "user",
                    "content": question,
                },
            ],
            temperature=0.3,
            max_tokens=1000,
        )

        answer = response.choices[0].message.content

        print("GROQ SUCCESS: AI response received.")

        return {
            "success": True,
            "answer": answer or "The AI returned an empty response.",
        }

    except Exception as e:
        # Print the actual error in the VS Code terminal.
        print("GROQ ERROR:", repr(e))

        raise HTTPException(
            status_code=502,
            detail=(
                "The Groq request failed. Check the VS Code terminal "
                "for the GROQ ERROR details."
            ),
        )

