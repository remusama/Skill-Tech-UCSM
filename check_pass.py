import bcrypt

def check():
    h = "$2b$12$GFQrJjzqwcbnCJRLz/1FA.qsZS0QoK2zZ71bdjsMxrv5G.4uuXnZW"
    print("Match:", bcrypt.checkpw(b"123", h.encode('utf-8')))

if __name__ == "__main__":
    check()
