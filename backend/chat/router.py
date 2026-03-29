import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from db.database import get_db
from db.chat_models import ConversationSession, ChatMessage
from chat.engine import chat

router = APIRouter()

class ChatRequest(BaseModel):
    user_id: int
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    sources: List[str]
    tools_used: List[str]
    conversation_id: str

@router.post("/message", response_model=ChatResponse)
def handle_chat_message(request: ChatRequest, db: Session = Depends(get_db)):
    if request.conversation_id:
        try:
            conv_id = uuid.UUID(request.conversation_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid conversation_id format (must be UUID)")
            
        session = db.query(ConversationSession).filter(ConversationSession.id == conv_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Conversation not found")
            
        # Ensure it belongs to user
        if session.user_id != request.user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this conversation")
    else:
        # Create new session
        title = request.message[:50] + ("..." if len(request.message) > 50 else "")
        session = ConversationSession(user_id=request.user_id, title=title)
        db.add(session)
        db.commit()
        db.refresh(session)
        conv_id = session.id

    # Load last 6 messages from ChatMessage as history
    recent_messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conv_id
    ).order_by(desc(ChatMessage.created_at)).limit(6).all()
    
    recent_messages.reverse() # chronological order
    
    # Format history for prompt
    conversation_history = ""
    for msg in recent_messages:
        role_label = "User" if msg.role == "user" else "Assistant"
        conversation_history += f"{role_label}: {msg.content}\n"
        
    # Save user message
    user_msg_db = ChatMessage(
        conversation_id=conv_id,
        role="user",
        content=request.message,
        sources=[],
        tools_used=[]
    )
    db.add(user_msg_db)
    db.commit()
    
    # Call Gemini via engine
    engine_response = chat(request.user_id, request.message, conversation_history, db)
    
    reply_text = engine_response.get("reply", "")
    sources = engine_response.get("sources", [])
    tools_used = engine_response.get("tools_used", [])
    
    # Save assistant reply
    assistant_msg_db = ChatMessage(
        conversation_id=conv_id,
        role="assistant",
        content=reply_text,
        sources=sources,
        tools_used=tools_used
    )
    db.add(assistant_msg_db)
    db.commit()
    
    return ChatResponse(
        reply=reply_text,
        sources=sources,
        tools_used=tools_used,
        conversation_id=str(conv_id)
    )

@router.get("/history/{user_id}")
def get_user_conversations(user_id: int, db: Session = Depends(get_db)):
    sessions = db.query(ConversationSession).filter(
        ConversationSession.user_id == user_id
    ).order_by(desc(ConversationSession.created_at)).all()
    
    return [{"id": str(s.id), "title": s.title, "created_at": s.created_at} for s in sessions]

@router.get("/conversation/{conversation_id}")
def get_conversation_messages(conversation_id: str, db: Session = Depends(get_db)):
    try:
        conv_id = uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation_id format")
        
    messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conv_id
    ).order_by(ChatMessage.created_at).all()
    
    return [
        {
            "id": str(m.id),
            "role": m.role,
            "content": m.content,
            "sources": m.sources if m.sources else [], 
            "tools_used": m.tools_used if m.tools_used else [],
            "created_at": m.created_at
        } for m in messages
    ]

@router.delete("/conversation/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    try:
        conv_id = uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation_id format")
        
    session = db.query(ConversationSession).filter(ConversationSession.id == conv_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    db.delete(session) # OnDelete='CASCADE' drops messages if foreign keys are configured correctly or rely on SQLAlchemy behavior
    db.commit()
    return {"status": "success", "message": "Conversation deleted"}
