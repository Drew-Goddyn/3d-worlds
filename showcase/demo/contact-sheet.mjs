import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {run,json,save} from './core.mjs';
const font='/System/Library/Fonts/Supplemental/Arial.ttf';
export default async function contactSheet({out,builds}){
 const dir=path.join(out,'calibration');
 const images=[];
 for(const b of builds)for(const shot of ['overview','ball','charges']){
  const data=await json(path.join(dir,b.id,shot==='charges'?'charges.json':`${shot}.json`));
  let filter='drawbox=x=288:y=151:w=1344:h=691:color=yellow@0.65:t=2';
  const targets=shot==='charges'?data.markers.map((m,i)=>({screen:m.screen,label:String(i+1)})):Object.entries(data.targets).filter(([,t])=>t.screen).map(([k,t])=>({screen:t.screen,label:k}));
  if(shot==='ball'){const camera=await json(path.join(dir,b.id,'camera.json'));const point=camera.bankPoint;const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),norm=a=>{const d=Math.hypot(...a);return a.map(x=>x/d);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];const forward=norm(sub(data.target,data.position)),right=norm(cross(forward,[0,1,0])),up=cross(right,forward),delta=sub(point,data.position),depth=dot(delta,forward),tan=Math.tan(Math.PI/8);targets.splice(0,targets.length,{label:'BANK AIM',screen:{x:960*(1+dot(delta,right)/(depth*tan*16/9)),y:540*(1-dot(delta,up)/(depth*tan))}});}for(const p of targets){filter+=`,drawbox=x=${p.screen.x-9}:y=${p.screen.y-9}:w=18:h=18:color=red:t=2,drawtext=fontfile='${font}':text='${p.label}':x=${p.screen.x+12}:y=${p.screen.y-12}:fontsize=20:fontcolor=red`;}
  const image=path.join(dir,b.id,`${shot}-marked.png`);await run('ffmpeg',['-v','error','-y','-i',path.join(dir,b.id,`${shot}.png`),'-vf',filter,'-frames:v','1',image]);images.push({image,b,shot});
 }
 // Rows are builds; columns are overview, bank/crane shot, and native charge set.
 const filters=images.map((v,i)=>`[${i}:v]scale=640:360,pad=640:400:0:40:color=0x111a1b,drawtext=fontfile='${font}':text='${v.b.label} / ${v.shot}':x=14:y=10:fontsize=19:fontcolor=white[v${i}]`).join(';')+';'+images.map((_,i)=>`[v${i}]`).join('')+'xstack=inputs=9:layout=0_0|640_0|1280_0|0_400|640_400|1280_400|0_800|640_800|1280_800[out]';
 await run('ffmpeg',['-v','error','-y',...images.flatMap(v=>['-i',v.image]),'-filter_complex',filters,'-map','[out]','-frames:v','1',path.join(dir,'contact-sheet.png')]);
 console.log('Saved marked calibration contact sheet.');
}
