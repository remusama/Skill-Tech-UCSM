import subprocess
import time
import httpx

def test_lifespan():
    print("Starting server...")
    proc = subprocess.Popen(["python", "server_py/main.py"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    time.sleep(5) # Wait for startup
    
    status = "N/A"
    body = "N/A"
    try:
        print("Pinging root endpoint...")
        with httpx.Client() as client:
            resp = client.get("http://localhost:8000/")
            status = str(resp.status_code)
            body = str(resp.json())
            print(f"Status: {status}")
            print(f"Body: {body}")
    except Exception as e:
        body = f"Error: {e}"
        print(f"Health check failed: {e}")
    
    time.sleep(2)
    
    with open("lifespan_results.txt", "w") as f:
        f.write(f"Health check status: {status}\n")
        f.write(f"Health check body: {body}\n")
        if proc.poll() is not None:
            f.write(f"Server exited with code {proc.returncode}\n")
            stdout, stderr = proc.communicate()
            f.write("STDOUT:\n" + stdout + "\n")
            f.write("STDERR:\n" + stderr + "\n")
        else:
            f.write("Server still running, killing it...\n")
            proc.kill()

if __name__ == "__main__":
    test_lifespan()
