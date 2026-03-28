from supabase import create_client, Client
from config import config

def get_supabase() -> Client:
    if config.SUPABASE_URL and config.SUPABASE_KEY:
        return create_client(config.SUPABASE_URL, config.SUPABASE_KEY)
    raise ValueError("Supabase credentials not configured")
