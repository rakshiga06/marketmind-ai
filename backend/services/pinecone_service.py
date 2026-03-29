from pinecone import Pinecone, ServerlessSpec
from config import config

# Initialize Pinecone
try:
    if config.PINECONE_API_KEY and config.PINECONE_API_KEY != "your_pinecone_api_key":
        pc = Pinecone(api_key=config.PINECONE_API_KEY)
        INDEX_NAME = "marketmind-alerts"
        
        # Create index if it doesn't exist
        if INDEX_NAME not in [i.name for i in pc.list_indexes()]:
            pc.create_index(
                name=INDEX_NAME,
                dimension=1536, # OpenAI ada-002 dimensionality
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
        
        pinecone_index = pc.Index(INDEX_NAME)
    else:
        pinecone_index = None
except Exception as e:
    print(f"Failed to initialize Pinecone: {e}")
    pinecone_index = None

def store_alert_context(alert_id: str, text_representation: str, metadata: dict):
    if not pinecone_index:
        return False
        
    try:
        from openai import OpenAI
        client = OpenAI(api_key=config.OPENAI_API_KEY)
        res = client.embeddings.create(input=[text_representation], model="text-embedding-3-small")
        embedding = res.data[0].embedding
        
        pinecone_index.upsert(vectors=[
            {
                "id": str(alert_id),
                "values": embedding,
                "metadata": metadata
            }
        ])
        return True
    except Exception as e:
        print(f"Error storing alert embeddings: {e}")
        return False

def query_similar_alerts(text_representation: str, top_k: int = 3):
    if not pinecone_index:
        return []
        
    try:
        from openai import OpenAI
        client = OpenAI(api_key=config.OPENAI_API_KEY)
        res = client.embeddings.create(input=[text_representation], model="text-embedding-3-small")
        embedding = res.data[0].embedding
        
        results = pinecone_index.query(
            vector=embedding,
            top_k=top_k,
            include_metadata=True
        )
        return results.get("matches", [])
    except Exception as e:
        print(f"Error querying Pinecone: {e}")
        return []
