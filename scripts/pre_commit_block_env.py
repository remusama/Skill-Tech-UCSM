import sys
import os

for arg in sys.argv[1:]:
    filename = os.path.basename(arg)
    # Block any file starting with .env
    if filename.startswith(".env"):
        print(f"ERROR: Committing environment configuration file '{arg}' is strictly blocked for security!")
        sys.exit(1)
sys.exit(0)
