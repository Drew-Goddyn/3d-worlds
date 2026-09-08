// Read-only evidence check against transformed solid parts. A path does not certify strength.
export function inspectSupport(bank){
 const boxes=bank.bodies.map(b=>bank.bounds(b)),parts=bank.bodies.map(b=>b.parts.map(p=>p.collisionBounds.clone().applyMatrix4(bank.bodyMatrix(b))));
 const solid=bank.bodies.filter(b=>b.state!==1&&!b.content&&!['glass','paper','vault-glass'].includes(b.role));
 const grid=new Map();for(const b of solid){const box=boxes[b.id].clone().expandByScalar(.18);for(let x=Math.floor(box.min.x/2);x<=Math.floor(box.max.x/2);x++)for(let z=Math.floor(box.min.z/2);z<=Math.floor(box.max.z/2);z++){const k=x+','+z;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(b.id);}}
 const adjacent=bank.bodies.map(()=>[]),seen=new Set();for(const ids of grid.values())for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){let a=ids[i],b=ids[j];if(a>b)[a,b]=[b,a];const key=a+':'+b;if(seen.has(key))continue;seen.add(key);if(!boxes[a].clone().expandByScalar(.18).intersectsBox(boxes[b]))continue;if(!parts[a].some(p=>parts[b].some(q=>p.clone().expandByScalar(.18).intersectsBox(q))))continue;adjacent[a].push(b);adjacent[b].push(a);}
 const rooted=new Set(solid.filter(b=>b.fixed||boxes[b.id].min.y<=.25).map(b=>b.id)),todo=[...rooted];for(let i=0;i<todo.length;i++)for(const n of adjacent[todo[i]])if(!rooted.has(n)){rooted.add(n);todo.push(n);}
 const detail=b=>({id:b.id,role:b.role,state:b.state,node:b.node,owner:bank.structure.owner[b.id],ownerState:bank.structure.carriers[bank.structure.owner[b.id]].state,hp:b.hp,bottom:boxes[b.id].min.y,top:boxes[b.id].max.y,pos:boxes[b.id].getCenter(bank.bodies[0].origin.clone()).toArray(),connections:adjacent[b.id]});
 const orphans=solid.filter(b=>!rooted.has(b.id));
 const stale=bank.bodies.filter(b=>b.state===0&&!b.fixed&&!b.content&&bank.structure.carriers[bank.structure.owner[b.id]].state===2);
 const st=bank.structure,graph=st.carriers.map(()=>[]),ground=new Set();for(const j of st.joints)if(st.held(j)){if(j.j<0)ground.add(j.i);else{graph[j.i].push(j.j);graph[j.j].push(j.i);}}for(const b of solid)if(b.state===0&&boxes[b.id].min.y<=.25)ground.add(st.owner[b.id]);const q=[...ground];for(let i=0;i<q.length;i++)for(const n of graph[q[i]])if(!ground.has(n)){ground.add(n);q.push(n);}
 const noRootCarriers=st.carriers.filter(n=>n.state!==2&&!ground.has(n.id)).map(n=>({id:n.id,active:st.frames[n.id].active,v:st.frames[n.id].v.length(),held:st.joints.filter(j=>(j.i===n.id||j.j===n.id)&&st.held(j)).length,members:st.members[n.id].filter(id=>bank.bodies[id].state===0)}));
 return {time:bank.sim.time,stats:bank.stats,geometricTolerance:.18,unrooted:orphans.map(detail),unrootedPiers:orphans.filter(b=>b.role==='pier').map(detail),staleOwner:stale.map(detail),noRootCarriers,structureSleeping:st.sleeping};
}
