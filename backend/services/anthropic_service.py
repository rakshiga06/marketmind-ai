from anthropic import Anthropic
from config import config

try:
    if config.ANTHROPIC_API_KEY and config.ANTHROPIC_API_KEY != "your_anthropic_api_key":
        anthropic_client = Anthropic(api_key=config.ANTHROPIC_API_KEY)
    else:
        anthropic_client = None
except Exception as e:
    print(f"Failed to initialize Anthropic client: {e}")
    anthropic_client = None

def detect_tone_shift(historical_paragraphs: list, current_paragraph: str):
    if not anthropic_client:
        return "neutral"
        
    prompt = f"""You are a specialized financial NLP model.
Analyze the following earnings call statements.
Historical Statements (past 4 quarters):
{chr(10).join(['- ' + p for p in historical_paragraphs])}

Current Statement:
{current_paragraph}

Evaluate the shift in management tone regarding forward looking guidance.
Output exactly ONE word: 'confident', 'cautious', or 'neutral'.
"""
    
    try:
        response = anthropic_client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=10,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text.strip().lower()
    except Exception as e:
        print(f"Anthropic API Error: {e}")
        return "neutral"
