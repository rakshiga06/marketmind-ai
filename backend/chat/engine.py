import os
import re
import google.generativeai as genai
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from chat.tools import detect_tool_needed
from chat.context_builder import build_user_context
from chat.rag import retrieve_context

load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-1.5-flash")

def extract_symbols(message: str) -> str:
    # Quick utility to extract first likely symbol for RAG lookup
    potential_symbols = re.findall(r'\b[A-Z]{3,10}\b', message)
    stopwords = {"THE", "AND", "WHAT", "HOW", "WHY", "IS", "ARE", "AM", "I", "YOU", "HE", "SHE", "IT", "WE", "THEY", "THIS", "THAT"}
    found = [s for s in potential_symbols if s not in stopwords]
    return found[0] if found else None

def extract_sources(reply_text: str) -> list:
    # Extracts everything inside [...]
    sources = re.findall(r'\[(.*?)\]', reply_text)
    # Deduplicate while preserving order
    seen = set()
    return [x for x in sources if not (x in seen or seen.add(x))]

def chat(user_id: int, message: str, conversation_history: str, db: Session) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_key_here":
        # Check inside function in case it's loaded late
        return {
            "reply": "Error: GEMINI_API_KEY is not configured in the environment variables.",
            "sources": [],
            "tools_used": []
        }
    
    # Ensure it's configured reliably
    genai.configure(api_key=api_key)

    # Step 1: Detect tools needed and call them
    tool_results, tools_used = detect_tool_needed(message, user_id, db)
    
    # Step 2: Retrieve RAG context
    symbol_from_message = extract_symbols(message)
    rag_context = retrieve_context(message, symbol_from_message)
    
    # User Profile Context
    user_context = build_user_context(user_id, db)
    
    # Step 3: Build full prompt
    full_prompt = f"""
You are MarketMind, a highly intelligent financial AI assistant for Indian retail investors.

STRICT RULES:
- Cite every factual claim with its source in square brackets, exactly like [BSE Filing, Oct 2024] or [Q2 Earnings Call, TCS, Q2 FY25].
- Always consider the user portfolio concentration before giving advice.
- Use simple language unless user is Active Trader.
- Never guess financial data — if you are unsure, say "I don't have this data".
- Keep answers under 200 words — be concise and actionable.

USER PORTFOLIO CONTEXT:
{user_context}

LIVE MARKET DATA (fetched just now):
{tool_results if tool_results else "No specific live data accessed for this query."}

RELEVANT KNOWLEDGE BASE:
{rag_context if rag_context else "No specific document context found."}

CONVERSATION SO FAR:
{conversation_history}

USER QUESTION: {message}

Answer now, citing sources in [brackets] for every fact:
"""

    try:
        # Step 4: Call Gemini
        response = model.generate_content(full_prompt)
        reply_text = response.text
        
        # Step 5: Parse sources from response
        extracted_citations_list = extract_sources(reply_text)
        
        return {
            "reply": reply_text,
            "sources": extracted_citations_list,
            "tools_used": tools_used
        }
    except Exception as e:
        return {
            "reply": f"An error occurred while communicating with the AI: {str(e)}",
            "sources": [],
            "tools_used": tools_used
        }
