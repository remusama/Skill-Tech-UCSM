from dotenv import load_dotenv
from google import genai
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))


load_dotenv()
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

try:
    print("Listing models...")
    for model in client.models.list(config={"page_size": 100}):
        print(model.name)
except Exception as e:
    print(f"Error: {e}")
