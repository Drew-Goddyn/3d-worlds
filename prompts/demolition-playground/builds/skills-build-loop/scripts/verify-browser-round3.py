"""Run capture-free measurements, then rendered restoration in one isolated browser."""
import os,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
env={**os.environ,'AGENT_BROWSER_SESSION':f'b3-check-{os.getpid()}','AGENT_BROWSER_SOCKET_DIR':'/tmp/blind-build-03-browser'}
subprocess.run(['agent-browser','open','http://127.0.0.1:4173'],env=env,cwd=root,check=True)
try:
    for script in ['measure-round3.mjs','render-check-round3.mjs']:
        subprocess.run(['node','scripts/'+script],env=env,cwd=root,check=True)
finally:
    subprocess.run(['agent-browser','close'],env=env,cwd=root,check=True)
