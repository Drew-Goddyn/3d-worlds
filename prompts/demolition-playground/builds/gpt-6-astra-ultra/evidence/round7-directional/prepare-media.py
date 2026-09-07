"""Prepare portable evidence without retiming; repository-only. Existing local ffmpeg and Pillow."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import subprocess,sys,json,hashlib,tempfile
out=Path(__file__).resolve().parent;baseline=Path(sys.argv[1]);final=Path(sys.argv[2]);native=Path(sys.argv[3]);temp=Path(tempfile.mkdtemp(prefix='astra-r7-frames-'))

# Preserve every captured frame timestamp in the portable video copies.
def timestamps(path):
 r=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','frame=best_effort_timestamp_time','-of','json',str(path)]));return [float(f['best_effort_timestamp_time']) for f in r['frames']]
media=[]
for src in [folder/(label+'-'+route+'.webm') for label,folder in [('baseline',baseline),('final',final)] for route in ['front','side','clean-side','collapse']]+[native/'final-time-controls.webm']:
 dst=out/(src.stem+'.mp4')
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(src),'-vf','scale=1280:800','-c:v','libx264','-preset','fast','-crf','25','-pix_fmt','yuv420p','-fps_mode','vfr','-video_track_timescale','1000000','-movflags','+faststart','-an',str(dst)],check=True)
 a,b=timestamps(src),timestamps(dst);assert a==b,(src.stem,len(a),len(b))
 subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(dst),'-fps_mode','passthrough','-enc_time_base','demux','-f','null','-'],check=True)
 media.append({'file':dst.name,'frames':len(b),'firstPTS':b[0],'lastPTS':b[-1],'everyFrameTimestampPreserved':True,'rawCaptureSHA256':hashlib.sha256(src.read_bytes()).hexdigest(),'mp4SHA256':hashlib.sha256(dst.read_bytes()).hexdigest()})
(out/'media-check.json').write_text(json.dumps({'rawCaptures':'Local recording intermediates intentionally excluded from the packet and repository; hashes identify the input bytes used for these portable copies.','media':media},indent=2)+'\n')

font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',18)
for label,folder in [('baseline',baseline),('final',final)]:
 for route in ['front','side']:
  stem=label+'-'+route;d=temp/stem;d.mkdir(exist_ok=True)
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(Path(folder)/(stem+'.webm')),'-vf','fps=4,scale=400:250','-start_number','0',str(d/'%03d.png')],check=True)
  files=sorted(d.glob('*.png'))
  for page in range((len(files)+15)//16):
   pagefiles=files[page*16:(page+1)*16];sheet=Image.new('RGB',(1600,4*280),'#eee9dd');draw=ImageDraw.Draw(sheet)
   for j,f in enumerate(pagefiles):
    x=(j%4)*400;y=(j//4)*280;sheet.paste(Image.open(f),(x,y+30));draw.text((x+8,y+5),f'{stem} · {int(f.stem)/4:.2f} s wall',font=font,fill='#253b34')
   sheet.save(temp/(stem+'-'+str(page)+'.jpg'),quality=88)
sheet=Image.new('RGB',(1600,4*280),'#eee9dd');draw=ImageDraw.Draw(sheet)
for r,route in enumerate(['front','side']):
 for j,t in enumerate([.5,1,1.5,2,3,4,6,10]):
  x=(j%4)*400;y=(r*2+j//4)*280;sheet.paste(Image.open(temp/('final-'+route)/(f'{round(t*4):03d}.png')),(x,y+30));draw.text((x+8,y+5),f'{route.capitalize()} · {t:g} s wall',font=font,fill='#253b34')
sheet.save(out/'progression.jpg',quality=91)
for route in ['front','side']:
 im=Image.open(final/('final-'+route+'-aftermath.png'));im.save(out/(route+'-aftermath.jpg'),quality=90)
im=Image.open(final/'final-front-before.png');im.save(out/'before.jpg',quality=90)
sheet=Image.new('RGB',(1440,330),'#eee9dd');draw=ImageDraw.Draw(sheet)
for j,(route,title) in enumerate([('left','One low left charge'),('right','One low right charge'),('perturbed','Side cut · middle charge raised 22 cm')]):
 im=Image.open(final/('final-'+route+'-12.png')).resize((480,300));sheet.paste(im,(j*480,30));draw.text((j*480+8,6),title,font=font,fill='#253b34')
sheet.save(out/'placement-family.jpg',quality=92)
