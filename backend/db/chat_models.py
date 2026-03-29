import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, JSON
from sqlalchemy import Uuid as UUID
from sqlalchemy.sql import func
from db.models import Base

class ConversationSession(Base):
    __tablename__ = 'conversation_sessions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    title = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())

class ChatMessage(Base):
    __tablename__ = 'chat_messages'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey('conversation_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    role = Column(String(20), nullable=False) # "user" or "assistant"
    content = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True)
    tools_used = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
