import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

# Allow running as script from anywhere
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from server_py.core.database import init_db

if __name__ == "__main__":
    print("Initializing database tables...")
    init_db()
    print("Done! check for skill_tech.db")
