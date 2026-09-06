import * as THREE from 'three';

// The banking court is a volume through the original support grid, with two
// occupied side galleries and a light steel/glass vault. Everything here is
// retained construction. Connections name actual bodies, never event times.
export function buildBankCourt({bank,body,add,nodeAt,shapes}) {
  const H=4.3,D=11/3;
  const owner=(l,x,z)=>nodeAt(l,x< -2?0:x>2?2:1,Math.max(0,Math.min(2,Math.round(z/D)+1)));
  const piece=(n,role,x,y,z,mass,extra={})=>body(n,role,x,y,z,{mass,...extra});
  const beam=(b,mat,a,c,width,depth)=>{
    const dx=c[0]-a[0],dy=c[1]-a[1];
    add(b,mat,(a[0]+c[0])/2,(a[1]+c[1])/2,(a[2]+c[2])/2,Math.hypot(dx,dy),width,depth,0,Math.atan2(dy,dx));
  };

  // Gallery fronts and their deep, dark beams are visible through a breach.
  // Railings travel with the supporting floor plate until that plate falls.
  for(let l=0;l<2;l++)for(const side of [-1,1])for(let iz=1;iz<3;iz++) {
    if(side===-1&&iz===1)continue; // the open stairwell replaces this floor
    const n=nodeAt(l,side<0?0:2,iz),z=(iz-1)*D,y=(l+1)*H;
    const floor=n.bodies.map(id=>bank.bodies[id]).filter(b=>b.role==='slab');
    for(const dz of [-1,1]) {
      const zz=z+dz*D/4,slab=floor.find(b=>Math.sign(b.origin.z-bank.building.z-z)===dz&&Math.abs(b.origin.x-bank.building.x)<4);
      const rail=piece(n,'gallery',side*2.03,y+.55,zz,.42,{restsOn:slab.id});
      add(rail,'green',side*2.03,y+.3,zz,.14,.55,D/2-.04);
      add(rail,'brass',side*2.03,y+.92,zz,.09,.085,D/2+.02);
      for(let k=0;k<5;k++)add(rail,'bronze',side*2.03,y+.65,zz+(k-2)*D/10,.05,.56,.05);
      const girder=piece(n,'girder',side*2,y-.31,zz,1.2,{restsOn:slab.id});
      add(girder,'steel',side*2,y-.28,zz,.2,.4,D/2);
      add(girder,'bronze',side*2,y-.5,zz,.3,.07,D/2);
    }
    // Warm walls and office doors give the galleries an occupied scale,
    // without populating another furniture inventory.
    for(const zz of [z-.82,z+.82]) {
      const panel=piece(n,'partition',side*5.3,y-2,zz,.8);
      add(panel,'green',side*5.3,y-2.65,zz,.13,1.12,1.45);
      add(panel,'plaster',side*5.3,y-1.15,zz,.16,1.8,1.45);
      add(panel,'timber',side*5.18,y-2.15,zz,.12,2.25,.7);
      add(panel,'brass',side*5.08,y-2.2,zz+.22,.06,.09,.1);
    }
  }

  // Rear transfer gallery: a readable crosspiece around the open court.
  for(let l=0;l<2;l++)for(const x of [-1,1]) {
    const n=nodeAt(l,1,0),y=(l+1)*H;
    const floor=n.bodies.map(id=>bank.bodies[id]).find(b=>b.role==='slab'&&Math.sign(b.origin.x-bank.building.x)===x&&b.origin.z>bank.building.z-D);
    const rail=piece(n,'gallery',x,y+.5,-D/2,.6,{restsOn:floor.id});
    add(rail,'green',x,y+.29,-D/2,1.97,.52,.16);
    add(rail,'brass',x,y+.92,-D/2,1.99,.08,.09);
    for(let k=0;k<6;k++)add(rail,'bronze',x+(k-2.5)*.31,y+.65,-D/2,.045,.55,.045);
  }

  // A pair of open stair flights climbs the side galleries. Treads and the
  // stringer are finite sections carried by the floor at their upper end.
  for(let l=0;l<2;l++)for(let flight=0;flight<2;flight++) {
    const y=l*H,x=flight===0?-4.85:-3.15,n=owner(l,-4,0);
    for(let k=0;k<7;k++) {
      const yy=y+.24+k*.285+flight*H/2,zz=(flight===0?1:-1)*(1.3-k*.4);
      const stair=piece(n,'stair',x,yy,zz,.75);
      add(stair,'core',x,yy,zz,1.42,.22,.41);
      add(stair,'carved',x,yy+.13,zz,1.48,.07,.43);
      add(stair,'bronze',x+(flight===0?.69:-.69),yy+.55,zz,.04,.95,.045);
    }
    const landing=piece(n,'slab',flight===0?-4:-3.15,y+(flight===0?H/2:H)-.13,flight===0?-1.52:1.52,2.2);
    add(landing,'floor',flight===0?-4:-3.15,y+(flight===0?H/2:H)-.13,flight===0?-1.52:1.52,flight===0?3.15:1.65,.24,.62);
    const stringer=piece(n,'girder',x,y+1+flight*H/2,0,.8);
    add(stringer,'steel',x,y+1+flight*H/2,0,.14,3.2,.2,Math.PI/2,(flight===0?1:-1)*.94);
  }

  // The two upper central windows become a single monumental arched light.
  // Its mullion sections each belong to their own level, so a lost lower
  // section does not leave the entire window as an indestructible rectangle.
  for(let l=1;l<3;l++) {
    const n=nodeAt(l,1,2),y=l*H;
    for(const side of [-1,1])for(let k=0;k<7;k++) {
      const b=piece(n,'masonry',side*1.84,y+.31+k*.58,5.5,.95);
      add(b,'core',side*1.84,y+.31+k*.58,5.18,.42,.55,.52);
      add(b,'limestone',side*1.84,y+.31+k*.58,5.56,.39,.56,.31);
      add(b,'carved',side*1.88,y+.31+k*.58,5.82,.25,.56,.2);
    }
    for(let row=0;row<5;row++)for(let col=0;col<4;col++) {
      const x=(col-1.5)*.76,yy=y+.39+row*.79;
      if(yy>10.35&&x*x+(yy-10.35)**2>1.55**2)continue;
      const glass=piece(n,'glass',x,yy,5.18,.035);
      add(glass,'glass',x,yy,5.18,.72,.75,.03);
      const frame=piece(n,'joinery',x,yy,5.23,.12);
      add(frame,'bronze',x-.38,yy,5.23,.045,.79,.065);
      add(frame,'bronze',x,yy-.395,5.23,.76,.045,.065);
    }
  }
  for(let i=0;i<13;i++) {
    const angle=(i+.5)*Math.PI/13,x=Math.cos(angle)*1.71,y=10.35+Math.sin(angle)*1.71,n=nodeAt(2,1,2);
    const b=piece(n,'arch',x,y,5.5,.68);
    add(b,'carved',x,y,5.5,.43,.35,.69,0,angle-Math.PI/2);
  }
  for(const side of [-1,1]) {
    const key='court-spandrel'+side,shape=new THREE.Shape();
    shape.moveTo(side*1.65,0);shape.lineTo(side*1.65,1.82);shape.lineTo(0,1.82);
    for(let k=12;k>=0;k--){const a=k*Math.PI/24;shape.lineTo(side*1.65*Math.cos(a),1.65*Math.sin(a));}
    shape.closePath();shapes[key]=new THREE.ExtrudeGeometry(shape,{depth:.56,bevelEnabled:false});
    const stone=piece(nodeAt(2,1,2),'masonry',0,10.35,5.15,1);
    add(stone,'limestone',0,10.35,5.15,1,1,1,0,0,key);
  }
  const crown=piece(nodeAt(2,1,2),'lintel',0,12.5,5.5,2.4);
  add(crown,'core',0,12.5,5.22,3.95,.69,.5);
  add(crown,'limestone',0,12.5,5.55,3.95,.69,.32);
  for(const yy of [4.3,12.9]) {
    const n=nodeAt(yy<5?0:2,1,2),b=piece(n,'cornice',0,yy,5.75,2);
    add(b,'carved',0,yy,5.75,4.15,.25,1.02);
    add(b,'limestone',0,yy+.2,5.78,4.25,.13,1.1);
  }

  // Glazed barrel vault: five transverse ribs, each with two independently
  // supported half-arches. Panel attachments refer to the physical rib on
  // either side; losing a foot can unzip one part while another remains.
  const ribRows=[];
  for(let row=0;row<5;row++) {
    const z=-2.7+row*1.95,iz=Math.max(0,Math.min(2,Math.round(z/D)+1)),halves=[];
    for(const side of [-1,1]) {
      const n=nodeAt(2,side<0?0:2,iz),foot=n.bodies.map(id=>bank.bodies[id]).filter(b=>b.role==='pier').sort((a,b)=>Math.abs(a.origin.x-bank.building.x)-Math.abs(b.origin.x-bank.building.x)||Math.abs(a.origin.z-bank.building.z-z)-Math.abs(b.origin.z-bank.building.z-z))[0];
      const rib=piece(n,'vault-rib',side*1.65,14.15,z,1.7,{restsOn:foot.id});
      for(let k=0;k<6;k++) {
        const a=k*Math.PI/12,c=(k+1)*Math.PI/12;
        beam(rib,'steel',[side*2.65*Math.cos(a),12.96+2.65*Math.sin(a),z],[side*2.65*Math.cos(c),12.96+2.65*Math.sin(c),z],.13,.16);
      }
      add(rib,'brass',side*2.65,12.94,z,.4,.16,.45);halves.push(rib);
    }
    ribRows.push(halves);
  }
  for(let row=0;row<4;row++)for(let half=0;half<2;half++)for(let k=0;k<6;k++) {
    const side=half===0?-1:1,a=(k+.5)*Math.PI/12,z=-2.7+(row+.5)*1.95;
    const x=side*2.65*Math.cos(a),y=12.96+2.65*Math.sin(a),rib=ribRows[row][half],next=ribRows[row+1][half];
    const n=bank.nodes[rib.node];
    const pane=piece(n,'glass',x,y,z,.065,{attachments:[rib.id,next.id],minimumAttachments:2});
    add(pane,k===0?'roof':'vaultGlass',x,y,z,.69,.036,1.91,0,side*(Math.PI/2-a));
    const seam=piece(n,'vault-seam',x,y+.025,z,.16,{attachments:[rib.id,next.id],minimumAttachments:1});
    add(seam,'roof',x,y+.025,z,.065,.06,1.95,0,side*(Math.PI/2-a));
  }
  // Copper end fans finish the vault's silhouette; individual panes remain
  // exposed and breakable through normal charge targeting.
  for(const row of [0,4])for(let k=0;k<12;k++) {
    const a=k*Math.PI/12,b=(k+1)*Math.PI/12,key='vault-fan'+k,z=-2.7+row*1.95;
    const shape=new THREE.Shape([new THREE.Vector2(0,0),new THREE.Vector2(Math.cos(a)*2.58,Math.sin(a)*2.58),new THREE.Vector2(Math.cos(b)*2.58,Math.sin(b)*2.58)]);
    shapes[key]=new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:false});
    const rib=ribRows[row][k<6?1:0],pane=piece(bank.nodes[rib.node],'glass',0,12.96,z,.055,{restsOn:rib.id});
    add(pane,'vaultGlass',0,12.96,z,1,1,1,0,0,key);
  }

  // A heavy vault wall anchors the rear of the court: recognizable as bank
  // architecture at a breach, and still heavy masonry in the final ruin.
  for(let c=0;c<5;c++)for(let r=0;r<6;r++) {
    if(c===2&&r<4)continue;
    const x=(c-2)*.68,y=.55+r*.56,n=nodeAt(0,1,0),b=piece(n,'vault-wall',x,y,-4.5,.9);
    add(b,'core',x,y,-4.5,.65,.53,.7);add(b,'stone',x,y,-4.11,.66,.54,.13);
  }
  const door=piece(nodeAt(0,1,0),'vault-door',.7,1.56,-4.05,3.2);
  add(door,'steel',.7,1.56,-4.05,1.25,2.27,.23,.4);
  add(door,'brass',.7,1.56,-3.87,.66,.66,.08,0,0,'torus');
  for(let i=0;i<4;i++)add(door,'bronze',.7,1.56,-3.82,.58,.065,.08,0,i*Math.PI/4);
}
