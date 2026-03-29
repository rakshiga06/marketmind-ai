import os
import uuid
from datetime import datetime

# ChromaDB conflicts severely with Pydantic V1/V2 under Mac Python 3.14 typings.
# In Phase 2, MarketMind shifted production embeddings to Pinecone (services/pinecone_service.py).
# For local chat development without Pinecone keys, we use an in-memory dictionary.
mock_collection = []

def index_document(text: str, source_label: str, symbol: str, date: str = None) -> None:
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
        
    doc_id = str(uuid.uuid4())
    mock_collection.append({
        "id": doc_id,
        "text": text,
        "metadata": {"source": source_label, "symbol": symbol, "date": date}
    })

def retrieve_context(query: str, symbol: str = None, top_k: int = 5) -> str:
    # Very basic naive text-matching against the memory store
    results = []
    
    for doc in mock_collection:
        if symbol and doc["metadata"]["symbol"].upper() != symbol.upper():
            continue
        results.append(doc)
            
    context_chunks = []
    for r in results[:top_k]:
        source = r["metadata"].get("source", "Unknown Source")
        chunk = f"[{source}] {r['text']}"
        context_chunks.append(chunk)
            
    return "\n\n".join(context_chunks)

def _pre_index_placeholders():
    """Injects mock earnings call summaries to test the RAG functionality natively."""
    if len(mock_collection) > 0:
        return
        
    placeholders = [
        {
            "text": "Zomato reported a strong Q2 FY25, achieving profitability for the fourth consecutive quarter. Gross Order Value (GOV) grew by 47% YoY. Blinkit continues to outpace core food delivery growth.",
            "source": "Q2 Earnings Summary, Zomato, Q2 FY25",
            "symbol": "ZOMATO"
        },
        {
            "text": "Reliance reported stable numbers for Q2 FY25, supported by strong retail and Jio platform revenue. O2C EBITDA margins compressed due to lower refining margins.",
            "source": "BSE Filing, Reliance Industries, Oct 2024",
            "symbol": "RELIANCE"
        },
        {
            "text": "TCS Q2 FY25 earnings met street expectations with a 5.5% YoY constant currency growth. Deal wins stood at a robust $8.6 billion TCV.",
            "source": "BSE Filing, Nov 2024",
            "symbol": "TCS"
        }
    ]
    
    for item in placeholders:
        index_document(item["text"], item["source"], item["symbol"], date="2024-10-31")

# Auto-run pre-indexing on start
_pre_index_placeholders()
