from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel
from app.ai_service import chat_with_ai, analyze_inventory_trends, generate_inventory_report, suggest_task
from app.auth import get_current_user

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    response: str

class ReportRequest(BaseModel):
    report_type: str = "summary"

class TaskRequest(BaseModel):
    task_description: str

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, current_user = Depends(get_current_user)):
    """Chat with the AI assistant."""
    try:
        # Convert Pydantic models to dicts
        history = [{"role": msg.role, "content": msg.content} for msg in request.conversation_history]
        
        response = chat_with_ai(request.message, history)
        return ChatResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analyze")
async def analyze(current_user = Depends(get_current_user)):
    """Analyze inventory trends and provide AI insights."""
    try:
        analysis = analyze_inventory_trends()
        return {"analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/report")
async def generate_report(request: ReportRequest, current_user = Depends(get_current_user)):
    """Generate an inventory report with AI analysis."""
    try:
        report = generate_inventory_report(request.report_type)
        return {"report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/suggest")
async def suggest_task_help(request: TaskRequest, current_user = Depends(get_current_user)):
    """Get AI guidance for performing a task."""
    try:
        guidance = suggest_task(request.task_description)
        return guidance
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
