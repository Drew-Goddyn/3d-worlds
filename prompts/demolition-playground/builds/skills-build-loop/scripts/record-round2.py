"""Three actual browser takes, using the installed product-demo recorder."""
import os,sys,subprocess,json
from pathlib import Path
sys.path.insert(0,'/Users/drewgoddyn/.codex/skills/record-product-demo/scripts')
from demo import Demo
root=Path(__file__).resolve().parents[1]
os.environ['AGENT_BROWSER_SOCKET_DIR']='/tmp/blind-build-02-browser'
scene=sys.argv[1]
session=f'b2-{scene}-{os.getpid()}'
os.environ['AGENT_BROWSER_SESSION']=session
demo=Demo(session,root/'review/build-02/captures')
demo.run('open','http://127.0.0.1:4173')
subprocess.run(['node','scripts/capture-round2.mjs','prepare',scene],cwd=root,check=True)
if '--rehearse' in sys.argv:
    subprocess.run(['node','scripts/capture-round2.mjs','run',scene],cwd=root,check=True)
    demo.close()
    raise SystemExit(0)
with demo.record(scene+'.mp4'):
    demo.event('story',takeaway={'temporal':'Judge fixed-camera normal and 10% motion, reverse, intervention and restoration.','collapse':'Observe player charges causing connected failure, material breakup, contact and rubble.','tank':'Observe an actual charged tank rupture, then fall as its roof loses support.'}[scene])
    subprocess.run(['node','scripts/capture-round2.mjs','run',scene],cwd=root,check=True)
demo.close()
