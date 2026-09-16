// Shared immutable architecture: the same pieces define rendering and fracture bounds.
export function architecture(plan) {
 const parts=[],labels=[];
 const add=(n,material,x,y,z,sx,sy,sz,opts={})=>{const p={owner:n.id,material,x,y,z,sx,sy,sz,rx:0,ry:0,rz:0,geo:'box',...opts,id:parts.length};parts.push(p);return p;};
 const owned=(n,material,x,y,z,sx,sy,sz,opts={})=>{
   if(opts.glazing){ // Four complementary triangles fill each pristine pane.
     for(let k=0;k<4;k++)add(n,material,x,y,z,sx,sy,sz,{...opts,geo:'pane'+k,shard:true});
   } else if(opts.facade&&opts.face!==undefined&&sx>plan.buildings[n.b].bay*.6){
     const a=opts.ry||0;
     for(const side of [-1,1])add(n,material,x+Math.cos(a)*sx*.25*side,y,z-Math.sin(a)*sx*.25*side,sx*.5,sy,sz,{...opts,faceX:opts.faceX+side*sx*.25});
   }else add(n,material,x,y,z,sx,sy,sz,opts);
 };
 const label=(text,node,x,y,z,w,h,color,bg)=>labels.push({text,node:node.id,x,y,z,w,h,color,bg});
function building(b){
    for(const id of b.nodes){const n=plan.nodes[id],bay=b.bay,half=bay/2;
      owned(n,b.kind==='bank'?'trim':'concrete',0,0,0,bay-.06,.38,bay-.06);
      owned(n,'metal',0,-.3,0,bay-.15,.24,.20);owned(n,'metal',0,-.3,0,.2,.24,bay-.15);
      // Columns and joints remain part of the structural debris. Two-piece steel gives a kink on failure.
      for(const x of [-half+.26,half-.26])for(const z of [-half+.26,half-.26]){
        owned(n,b.kind==='bank'?'stone':'concrete',x,-b.h*.5,z,b.kind==='bank'?.42:.25,b.h-.2,b.kind==='bank'?.42:.25,{facade:true,column:true});
        owned(n,'metal',x,-b.h*.43,z,.065,b.h-.1,.065,{detail:true,facade:true,column:true});
      }
      const faces=[];if(n.iz===b.nz-1)faces.push([0,half,0]);if(n.iz===0)faces.push([0,-half,Math.PI]);if(n.ix===b.nx-1)faces.push([half,0,Math.PI/2]);if(n.ix===0)faces.push([-half,0,-Math.PI/2]);
      for(const [fx,fz,ry]of faces){const put=(mat,x,y,z,sx,sy,sz,opts={})=>{const c=Math.cos(ry),t=Math.sin(ry);return owned(n,mat,fx+x*c+z*t,y,fz-x*t+z*c,sx,sy,sz,{facade:true,...opts,ry,face:faces.indexOf(faces.find(f=>f[0]===fx&&f[1]===fz)),faceX:x});};
        if(b.kind==='glass'){
          // Each pane is a separate unit; silhouettes reveal mullions and floor edges.
          for(let j=0;j<3;j++)for(let k=0;k<2;k++)put(n.f<2?'glassDark':(j===1?'glassLight':'glass'),(j-1)*bay/3,-b.h+.48+(k+.5)*(b.h-.58)/2,.015,bay/3-.09,(b.h-.6)/2-.04,.095,{facade:true,glazing:true});
          for(let j=0;j<4;j++)put('frame',-half+j*bay/3,-b.h/2,.1,.055,b.h,.10);
          put('trim',0,-.28,.1,bay,.08,.12);put('frame',0,-b.h/2,.12,bay,.055,.10);
        }else if(b.kind==='parking'){
          put('concrete',0,-.6,0,bay,.6,.25);put('yellow',0,-.34,.15,bay,.10,.05);
          put('metal',0,-1.12,0,bay,.06,.06);for(let j=0;j<5;j++)put('metal',(j-2)*bay/5,-.85,0,.045,.5,.045);
          if(n.f%2===0)put('white',0,-.17,-1.2,.09,.03,1.5);
        }else {
          const stone=b.kind==='bank'||b.kind==='hotel';
          // Mortar-backed brick courses with recessed, framed windows.
          if(!stone){
            for(const side of [-1,1])put('mortar',side*bay*.39,-b.h/2,-.08,bay*.22,b.h-.35,.24);
            for(const y of [-b.h+.34,-.4])put('mortar',0,y,-.08,bay,.48,.24);
            for(let row=0;row<10;row++)for(let col=0;col<9;col++){
              const x=-half+(col+.5+(row%2)*.28)*bay/9,y=-b.h+.24+row*(b.h-.32)/10;
              if(Math.abs(x)<bay*.27&&y>-b.h+.65&&y<-.65)continue;
              put(['brick','brick2','brick3'][(row+col+n.f)%3],x,y,.075,bay/9-.038,(b.h-.32)/10-.035,.16,{facade:true,detail:true});
            }
          }else{
            put(b.kind==='hotel'?'stone':'trim',0,-b.h+.24,0,bay,.5,.42,{facade:true});
            put('stone',0,-.37,0,bay,.5,.48,{facade:true});
            for(const x of [-half+.48,half-.48])put('stone',x,-b.h/2,0,.90,b.h,.5,{facade:true});
            for(let j=0;j<4;j++)put('trim',0,-b.h+.48+j*.9,.29,bay,.025,.035,{detail:true});
          }
          const width=bay*(stone?.58:.55),height=b.h*.66;
          put(n.f%3===0?'glassDark':'glass',0,-b.h*.51,.06,width,height,.13,{facade:true,glazing:true});
          for(const x of [-width/2,width/2,0])put('frame',x,-b.h*.51,.19,.07,height+.16,.12,{facade:true});
          put('frame',0,-b.h*.5,.19,width,.07,.12,{facade:true});
          put(stone?'trim':'stone',0,-b.h*.86,.2,width+.32,.16,.44,{facade:true});
          put(stone?'trim':'stone',0,-b.h*.15,.16,width+.27,.20,.31,{facade:true});
          if(b.kind==='bank'&&n.f===0){for(const x of [-bay*.37,bay*.37]){put('trim',x,-b.h/2,.75,.47,b.h-.25,.47,{geo:'cylinder'});put('white',x,-.35,.75,.72,.25,.72);put('stone',x,-b.h+.35,.75,.72,.3,.72);}}
          if(b.kind==='brick'&&n.f>0&&n.iz===b.nz-1){
            put('metal',0,-b.h+.3,.9,bay*.65,.12,1.5);put('metal',0,-b.h+1.05,1.6,bay*.65,.055,.055);
            for(let j=0;j<6;j++)put('metal',(j-2.5)*.5,-b.h+.67,1.6,.04,.75,.04);
            put('metal',bay*.28,-b.h*.5,1.0,.07,b.h,.08);for(let j=0;j<9;j++)put('metal',bay*.21,-b.h+j*.4,1,.55,.05,.06);
          }
        }
        if(n.f===b.floors-1){
          put(b.kind==='glass'?'frame':'trim',0,.32,0,bay,.5,.48);put(b.kind==='glass'?'metal':'stone',0,.59,.04,bay+.13,.14,.7);
          if(b.kind==='bank')for(let j=0;j<8;j++)put('stone',-half+.35+j*.66,.08,.28,.23,.27,.38,{detail:true});
        }
      }
      if(n.f===b.floors-1){
        owned(n,'roof',0,.25,0,bay-.04,.08,bay-.04);
        if(n.ix===0&&n.iz===0&&b.kind!=='parking'){owned(n,'metal',.2,.67,.2,1.2,.65,1.2);owned(n,'black',.2,1.02,.2,.80,.03,.80,{geo:'cylinder'});for(let j=0;j<5;j++)owned(n,'trim',-.3+j*.23,.7,.82,.06,.5,.04,{detail:true});}
        
        if(b.kind==='bank'&&n.iz===b.nz-1&&n.ix===1){
          owned(n,'stone',0,.6,half+.10,14.7,4.8,1.1,{geo:'pediment',facade:true});owned(n,'trim',0,.73,half+.74,13.1,3.6,.08,{geo:'pediment',facade:true});owned(n,'stone',0,.50,half+.45,15.4,.37,1.2);
          owned(n,'roof',0,1.55,half+.82,.8,.8,.08,{geo:'cylinder',rx:Math.PI/2});
        }
      }
    }
    const frontNode=plan.nodes[b.nodes.find(id=>{let n=plan.nodes[id];return n.f===0&&n.ix===1&&n.iz===b.nz-1;})||b.nodes[0]];
    const sign=b.kind==='bank'?'M E R C A N T I L E':b.kind==='parking'?'P   •   MUNICIPAL':b.kind==='brick'?'UNION  /  1926':b.kind==='hotel'?'THE JUNIPER':b.kind==='water'?'CEDAR & WATER':null;
    if(sign)label(sign,frontNode,0,-.65,b.bay*.5+.38,b.kind==='bank'?13:8,.7,b.kind==='bank'?'#524d38':'#faf0ca',b.kind==='bank'?'#dec89c':'#456564');
  }
 for(const b of plan.buildings)building(b);
 return {parts,labels};
}
