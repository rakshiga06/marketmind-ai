import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def generate_pattern_explanation(symbol: str, pattern_name: str, win_rate: float, avg_return: float, count: int) -> str:
    """Generate a qualitative explanation for why a pattern is successful for a given stock."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_key_here":
        return f"The {pattern_name} for {symbol} has a {win_rate}% win rate over {count} occurrences, suggesting strong historical reliability for this specific setup."

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""
        You are a quantitative trading analyst for MarketMind. 
        A technical analysis engine has backtested the '{pattern_name}' pattern for the stock '{symbol}' over the last 5 years.
        
        STATISTICS:
        - Occurrences: {count} times
        - Win Rate (Target +10% in 60 days): {win_rate:.1f}%
        - Average 60-day Return: {avg_return:.1f}%
        
        TASK:
        In exactly 2 sentences, explain WHY this specific pattern might be successful or significant for this stock. 
        Focus on market psychology (e.g. accumulation, institutional support, or volatility characteristics). 
        Do not use introductory phrases like 'This pattern is successful because...'. 
        Be concise and professional.
        """
        
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Historically, {pattern_name} has shown a {win_rate:.1f}% success rate for {symbol}, indicating consistent institutional interest during these technical setups."
