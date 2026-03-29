import os
from dotenv import load_dotenv

load_dotenv(override=True)

class Config:
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./marketmind.db")
    
    # Redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Kafka
    KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    
    # Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
    
    # Pinecone
    PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
    PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT", "")
    
    # AI/LLM
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    
    # Upstox
    UPSTOX_API_KEY = os.getenv("UPSTOX_API_KEY", "")
    UPSTOX_API_SECRET = os.getenv("UPSTOX_API_SECRET", "")

config = Config()
