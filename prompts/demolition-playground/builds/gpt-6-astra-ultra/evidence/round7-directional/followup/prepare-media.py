"""Portable evidence using the existing conversion/check method; no retiming."""
from pathlib import Path
import subprocess,json,hashlib,shutil
out=Path(__file__).resolve().parent
baseline=Path('/tmp/astra-pr6-followup-native-baseline-verified');final=Path('/tmp/astra-followup-native-release');inspection=Path('/tmp/astra-followup-inspection-release');controls=Path('/tmp/astra-followup-controls-release')
def timestamps(path):
 r=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','frame=best_effort_timestamp_time','-of','json',str(path)]));return [float(f['best_effort_timestamp_time']) for f in r['frames']]
media=[]
for src in [baseline/'baseline-left.webm',*[final/('final-'+s+'.webm') for s in ['left','front','side','collapse']],inspection/'final-left-later-cut.webm',controls/'final-time-controls.webm']:
 dst=out/(src.stem+'.mp4');subprocess.run(['ffmpeg','-v','error','-y','-i',str(src),'-vf','scale=1280:800','-c:v','libx264','-threads','2','-preset','fast','-crf','25','-pix_fmt','yuv420p','-fps_mode','passthrough','-enc_time_base','demux','-video_track_timescale','1000000','-movflags','+faststart','-an',str(dst)],check=True)
 a,b=timestamps(src),timestamps(dst);assert a==b,(src.stem,len(a),len(b))
 subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(dst),'-fps_mode','passthrough','-enc_time_base','demux','-f','null','-'],check=True)
 media.append({'file':dst.name,'frames':len(b),'firstPTS':b[0],'lastPTS':b[-1],'everyFrameTimestampPreserved':True,'rawCaptureSHA256':hashlib.sha256(src.read_bytes()).hexdigest(),'mp4SHA256':hashlib.sha256(dst.read_bytes()).hexdigest()});print(dst.name,flush=True)
for src,name in [(inspection/'final-left-25s.png','partial-left.png'),(inspection/'final-single-side-25s.png','partial-side.png'),(inspection/'final-right-25s.png','partial-right.png'),(inspection/'final-single-side-later-cut.png','later-side.png'),(Path('/tmp/astra-followup-inspection/baseline-support-diagnostic.png'),'support-before.png'),(inspection/'final-support-diagnostic.png','support-after.png')]:shutil.copy2(src,out/name)
(out/'media-check.json').write_text(json.dumps({'method':'Every captured video frame and wall-time timestamp is preserved. No speed changes or stall trimming. Raw recording intermediates remain outside the packet; hashes identify them. PNGs are unchanged browser screenshots.','media':media},indent=2)+'\n')
