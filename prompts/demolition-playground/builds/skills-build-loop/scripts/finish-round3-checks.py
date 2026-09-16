"""Run final checks, profiling, capture-free browser verification, then recordings in order."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1];checks=root/'review/build-03/checks';checks.mkdir(parents=True,exist_ok=True)
stages=[(['npm','test'],'tests.txt'),(['npm','run','check'],'static-check.txt'),(['node','scripts/contact-evidence-round3.mjs'],'tank-contact-console.txt'),(['node','scripts/collapse-evidence-round3.mjs'],'collapse-support-console.txt'),(['node','scripts/temporal-evidence-round3.mjs'],'temporal-console.txt'),(['node','scripts/profile-round3.mjs'],'profile-after-console.txt'),([sys.executable,'scripts/verify-browser-round3.py'],'browser-verification-console.txt')]
stages.extend(([sys.executable,'scripts/record-round3.py',scene],'record-'+scene+'.txt') for scene in ['temporal','collapse','tank'])
for command,name in stages:
    print('Starting '+name,flush=True)
    with (checks/name).open('w') as output:subprocess.run(command,cwd=root,stdout=output,stderr=subprocess.STDOUT,check=True)
    print('Completed '+name,flush=True)
