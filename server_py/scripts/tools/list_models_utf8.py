from dotenv import load_dotenv
from google import genai
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))


load_dotenv()
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

with open("models_utf8.txt", "w", encoding="utf-8") as f:
    try:
        f.write("Listing models:\n")
        for model in client.models.list(config={"page_size": 100}):
            f.write(f"{model.name}\n")
    except Exception as e:
        f.write(f"Error: {e}")
