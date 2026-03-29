import os
import uuid
import chromadb
from sentence_transformers import SentenceTransformer
from datetime import datetime

# Initialize ChromaDB locally
chroma_client = chromadb.PersistentClient(path=os.path.join(os.path.dirname(__file__), "..", "chroma_db"))
collection = chroma_client.get_or_create_collection("market-intelligence")

# Initialize Embedding Model
# This downloads the model on first run locally.
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def index_document(text: str, source_label: str, symbol: str, date: str = None) -> None:
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
        
    embedding = embedder.encode(text).tolist()
    doc_id = str(uuid.uuid4())
    
    collection.add(
        documents=[text],
        embeddings=[embedding],
        metadatas=[{"source": source_label, "symbol": symbol, "date": date}],
        ids=[doc_id]
    )

def retrieve_context(query: str, symbol: str = None, top_k: int = 5) -> str:
    query_embedding = embedder.encode(query).tolist()
    
    kwargs = {
        "query_embeddings": [query_embedding],
        "n_results": top_k
    }
    
    if symbol:
        kwargs["where"] = {"symbol": symbol}
        
    results = collection.query(**kwargs)
    
    context_chunks = []
    if results and "documents" in results and results["documents"]:
        docs = results["documents"][0]
        metadatas = results["metadatas"][0]
        
        for doc, meta in zip(docs, metadatas):
            source = meta.get("source", "Unknown Source")
            chunk = f"[{source}] {doc}"
            context_chunks.append(chunk)
            
    return "\n\n".join(context_chunks)

def _pre_index_placeholders():
    """Injects mock earnings call summaries to test the RAG functionality."""
    # Check if there's already data
    if collection.count() > 0:
        return
        
    placeholders = [
        {
            "text": "Zomato reported a strong Q2 FY25, achieving profitability for the fourth consecutive quarter. Gross Order Value (GOV) grew by 47% YoY. Blinkit continues to outpace core food delivery growth.",
            "source": "Q2 Earnings Summary, Zomato, Q2 FY25",
            "symbol": "ZOMATO"
        },
        {
            "text": "Zomato management indicated cautious optimism regarding margin expansion. They plan to expand Blinkit dark stores aggressively in Tier 2 cities.",
            "source": "Earnings Call Transcript, Zomato, Q2 FY25",
            "symbol": "ZOMATO"
        },
        {
            "text": "Reliance reported stable numbers for Q2 FY25, supported by strong retail and Jio platform revenue. O2C EBITDA margins compressed due to lower refining margins.",
            "source": "BSE Filing, Reliance Industries, Oct 2024",
            "symbol": "RELIANCE"
        },
        {
            "text": "Reliance Jio added 11 million net subscribers in Q2 FY25, and ARPU (Average Revenue Per User) increased to ₹181.7 due to targetted tariff implementations.",
            "source": "Q2 Earnings Summary, Reliance, Q2 FY25",
            "symbol": "RELIANCE"
        },
        {
            "text": "TCS Q2 FY25 earnings met street expectations with a 5.5% YoY constant currency growth. Deal wins stood at a robust $8.6 billion TCV.",
            "source": "BSE Filing, Nov 2024",
            "symbol": "TCS"
        },
        {
            "text": "TCS management warned about soft discretionary spending in the BFSI sector in North America, leading to cautious guidance for Q3.",
            "source": "Q2 Earnings Call, TCS, Q2 FY25",
            "symbol": "TCS"
        }
    ]
    
    for item in placeholders:
        index_document(item["text"], item["source"], item["symbol"], date="2024-10-31")

# Auto-run pre-indexing on start
_pre_index_placeholders()
