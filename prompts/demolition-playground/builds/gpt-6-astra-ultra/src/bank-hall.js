// One authored ground-floor room. Props are retained bodies, not a damage-time
// replacement set. The existing structural floor and exterior enclose it.
export function furnishHall({body,add,nodeAt}) {
  const owner=(x,z)=>nodeAt(0,Math.max(0,Math.min(2,Math.round(x/4)+1)),Math.max(0,Math.min(2,Math.round(z/(11/3))+1)));
  const item=(role,x,y,z,mass,extra={})=>body(owner(x,z),role,x,y,z,{mass,content:true,...extra});
  const box=(b,m,x,y,z,w,h,d)=>add(b,m,x,y,z,w,h,d);
  // Paneled rear partition, finite sections seated on the floor. The open
  // return on the right leads behind the teller line rather than sealing a box.
  for(const x of [-4,-2,0,2]) {
    const wall=body(owner(x,-3),'partition',x,1.95,-3.5,{mass:1.4});
    box(wall,'plaster',x,2.05,-3.5,1.97,3.7,.24);
    box(wall,'green',x,.85,-3.34,1.94,1.3,.1);
    box(wall,'brass',x,1.52,-3.26,1.96,.055,.055);
    for(const dx of [-.86,.86])box(wall,'timber',x+dx,.85,-3.25,.05,1.2,.07);
  }
  // Three recognizable teller stations: inset green panels, dark plinths,
  // stone tops, brass dividers, green banker lamps, cash trays and ledgers.
  for(const x of [-3.5,0,3.5]) {
    const z=-.55,desk=item('counter',x,.87,z,1.5);
    box(desk,'timber',x,.82,z,3.05,1.27,.86);
    box(desk,'ink',x,.29,z,3.15,.18,.98);
    box(desk,'green',x,.85,z+.445,2.82,.92,.035);
    for(const dx of [-1.38,0,1.38])box(desk,'brass',x+dx,.85,z+.47,.035,.97,.045);
    box(desk,'carved',x,1.51,z,3.25,.15,1.1);
    for(const dx of [-1.49,1.49]) {
      box(desk,'brass',x+dx,2.13,z,.045,1.1,.045);
      box(desk,'brass',x+dx,2.68,z,.17,.08,.17);
    }
    box(desk,'brass',x,2.67,z,3.03,.055,.055);
    // Each station's numbered plaque is geometry, so headless and browser
    // recipes have identical furnishings and contact ownership.
    box(desk,'ink',x,2.58,z+.04,.42,.3,.05);
    const count=Math.round(x/3.5)+2;
    for(let i=0;i<count;i++)box(desk,'brass',x+(i-(count-1)/2)*.09,2.58,z+.075,.035,.16,.015);
    const lamp=item('equipment',x-.9,1.82,z, .08,{restsOn:desk.id});
    box(lamp,'brass',x-.9,1.62,z,.4,.06,.3);box(lamp,'brass',x-.9,1.86,z,.035,.44,.04);
    box(lamp,'green',x-.9,2.1,z,.55,.18,.31);box(lamp,'paper',x-.9,2.005,z,.45,.015,.25);
    const tray=item('equipment',x+.9,1.67,z,.13,{restsOn:desk.id});
    box(tray,'ink',x+.9,1.65,z,.65,.15,.43);
    for(let i=0;i<5;i++) {
      const cash=item('paper',x+.68+i*.11,1.75,z,.002,{restsOn:tray.id});
      box(cash,'cash',x+.68+i*.11,1.75,z,.1,.018,.27);
      box(cash,'paper',x+.68+i*.11,1.762,z,.1,.007,.05);
    }
    chair(x,-1.85);
  }
  function chair(x,z) {
    const b=item('chair',x,.77,z,.22);
    box(b,'leather',x,.8,z,.78,.17,.75);box(b,'leather',x,1.25,z-.33,.77,.85,.14);
    for(const dx of [-.29,.29])for(const dz of [-.28,.28])box(b,'timber',x+dx,.47,z+dz,.09,.56,.09);
    for(const dx of [-.29,.29])box(b,'timber',x+dx,1.14,z-.36,.08,.95,.09);
  }
  // Writing tables sit in the incoming ball path; the clear central aisle
  // preserves the entrance's sightline to the teller counter.
  for(const x of [-3.7,3.7]) {
    const z=3.15,desk=item('table',x,.85,z,.42);
    box(desk,'timber',x,1.3,z,1.9,.18,.95);
    for(const dx of [-.76,.76])for(const dz of [-.32,.32])box(desk,'timber',x+dx,.75,z+dz,.11,1,.11);
    box(desk,'green',x,1.398,z,1.15,.018,.7);
    for(let i=0;i<8;i++) {
      const xx=x-.55+(i%3)*.16,zz=z-.12+Math.floor(i/3)*.13;
      const paper=item('paper',xx,1.416+i*.006,zz,.002,{restsOn:desk.id});
      box(paper,'paper',xx,1.416+i*.006,zz,.27,.009,.34);
      for(let line=0;line<3;line++)box(paper,'ink',xx,1.422+i*.006,zz-.08+line*.055,.17,.002,.008);
    }
    const book=item('equipment',x+.53,1.45,z,.08,{restsOn:desk.id});
    box(book,'leather',x+.53,1.45,z,.4,.1,.51);box(book,'paper',x+.54,1.45,z+.015,.37,.066,.46);
  }
  for(const x of [-4.6,4.6])chair(x,1.35);
  // Compact deposit cabinet, with individual heavy drawer fronts; its color
  // and rows remain identifiable even after a larger architectural collapse.
  const cabinet=item('cabinet',3.9,1.35,-3.45,1.25);
  box(cabinet,'ink',3.9,1.35,-3.45,1.75,2.25,.7);
  for(let r=0;r<4;r++)for(let c=0;c<3;c++) {
    box(cabinet,'bronze',3.34+c*.56,.55+r*.52,-3.08,.52,.47,.055);
    box(cabinet,'brass',3.34+c*.56,.55+r*.52,-3.04,.16,.035,.07);
  }
}
