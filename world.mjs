export const FLOOR={minX:-2.72,maxX:2.72,minZ:-1.65,maxZ:1.65};
export const SUN={x:-.405,y:.810,z:.425};
export const IDS=['sparrow-a','sparrow-b','snail','butterfly'];
export const MEMORY_TYPES=['arrived','drank','fed','sheltered','waited','disturbed','target_moved','blocked','neighbor_arrived','neighbor_left','shared_space'];
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export const groundDist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const point=a=>({x:a.x,y:a.y,z:a.z});
const copy=a=>JSON.parse(JSON.stringify(a));
const finite=Number.isFinite;

export function createWorld(){
  const resident=(id,species,x,y,z,need,preference)=>({id,species,x,y,z,heading:0,need,preference,memory:[],action:null,queue:[],support:({'sparrow-a':'rail-left','sparrow-b':'rail-right',snail:'ground-left',butterfly:'flower-top'})[id],cooldown:1+IDS.indexOf(id)*.65,lastDecision:-30,startled:0,seen:[],shared:{}});
  return {version:2,revision:0,time:0,eventId:0,events:[],sensorTick:0,growthTick:0,
    objects:[
      {id:'ficus',type:'tree',species:'ficus',name:'小叶榕',x:-1.55,y:0,z:-.55,radius:.43,moisture:.68,growth:0},
      {id:'maple',type:'tree',species:'maple',name:'鸡爪槭',x:1.68,y:0,z:-.68,radius:.40,moisture:.58,growth:0},
      {id:'flowers',type:'flowers',name:'小花盆',x:1.12,y:0,z:1.10,radius:.28,moisture:.65},
      {id:'water',type:'water',name:'水盘',x:-.42,y:0,z:.78,radius:.47,water:.76,wet:.3},
      {id:'shade',type:'shade',name:'遮阴板',x:-2.18,y:0,z:.72,radius:.38,width:.86,depth:.22}
    ],
    residents:{
      'sparrow-a':resident('sparrow-a','sparrow',-2.35,.78,-1.96,.78,'Amber: curious, approaches resources readily, tolerates a familiar neighbor, avoids repeated disturbance.'),
      'sparrow-b':resident('sparrow-b','sparrow',2.35,.78,-1.96,.57,'Ash: cautious, watches before approaching, remembers who recently occupied a place, may share after calm encounters.'),
      snail:resident('snail','snail',-1.52,0,1.40,.65,'Persistent, seeks moist shade, waits or changes direction when a nearby bird disturbs the ground.'),
      butterfly:resident('butterfly','butterfly',1.12,.63,1.10,.60,'Explores flowers and sunny resting places, gives birds space, returns to a place after a calm visit.')
    }
  };
}

export function recordEvent(w,type,residentId,targetId,extra={}){
  const e={id:++w.eventId,at:Math.round(w.time*10)/10,type,residentId,targetId,...extra};
  w.events.push(e);if(w.events.length>400)w.events.shift();
  const a=w.residents[residentId];
  if(a&&MEMORY_TYPES.includes(type)){a.memory.push({...e,position:point(a)});a.memory=a.memory.slice(-12);}
  return e;
}

export function sprout(o,k=o.growth){
  const from={x:o.x+(o.species==='ficus'?-.31:.29),y:o.species==='ficus'?1.50:1.67,z:o.z+.06};
  const to={x:o.x+(o.species==='ficus'?-.53:.57),y:1.79,z:o.z+.06};
  return {from,to:{x:from.x+(to.x-from.x)*k,y:from.y+(to.y-from.y)*k,z:to.z}};
}

// The same canopy volumes and screen slats are drawn by art.mjs and queried here.
export function canopy(o){
  if(o.type!=='tree')return [];
  const specs=o.species==='ficus'?[
    [0,1.56,0,.43,.37,.41],[-.35,1.48,.08,.38,.30,.35],[.31,1.62,-.07,.39,.32,.33],[-.12,1.80,-.1,.34,.28,.31],[.19,1.46,.25,.34,.28,.32]
  ]:[[-.35,1.51,.04,.44,.20,.36],[.29,1.67,-.08,.46,.21,.37],[-.02,1.84,-.12,.36,.19,.31],[.12,1.44,.30,.33,.18,.31]];
  const result=specs.map((s,i)=>({kind:'ellipsoid',owner:o.id,id:o.id+'-canopy-'+i,x:o.x+s[0],y:s[1],z:o.z+s[2],rx:s[3],ry:s[4],rz:s[5],species:o.species}));
  if(o.growth>.05){const k=clamp(o.growth,0,1);result.push({kind:'ellipsoid',owner:o.id,id:o.id+'-new',...sprout(o,k).to,rx:.18*k,ry:.13*k,rz:.17*k,species:o.species,newLeaf:true});}
  return result;
}
export function occluders(w){
  const list=[];
  for(const o of w.objects){
    if(o.type==='tree'){
      list.push({kind:'ellipsoid',owner:o.id,x:o.x,y:.22,z:o.z,rx:o.radius,ry:.23,rz:o.radius});
      list.push({kind:'ellipsoid',owner:o.id,x:o.x,y:.77,z:o.z,rx:.075,ry:.48,rz:.075});
      list.push(...canopy(o));
    }else if(o.type==='shade'){
      for(let i=0;i<8;i++)list.push({kind:'box',owner:o.id,x:o.x,y:.32+i*.10,z:o.z,hx:.43,hy:.037,hz:.035});
    }
  }
  return list;
}
function hitVolume(origin,dir,length,v){
  if(v.kind==='ellipsoid'){
    const px=(origin.x-v.x)/v.rx,py=(origin.y-v.y)/v.ry,pz=(origin.z-v.z)/v.rz;
    const dx=dir.x/v.rx,dy=dir.y/v.ry,dz=dir.z/v.rz,A=dx*dx+dy*dy+dz*dz,B=2*(px*dx+py*dy+pz*dz),C=px*px+py*py+pz*pz-1,D=B*B-4*A*C;
    if(D<0)return false;const t1=(-B-Math.sqrt(D))/(2*A),t2=(-B+Math.sqrt(D))/(2*A);
    return t2>.015&&t1<length-.015;
  }
  let low=0,high=length;
  for(const k of ['x','y','z']){
    const h=v['h'+k],d=dir[k],p=origin[k]-v[k];
    if(Math.abs(d)<1e-8){if(Math.abs(p)>h)return false;continue;}
    const a=(-h-p)/d,b=(h-p)/d;low=Math.max(low,Math.min(a,b));high=Math.min(high,Math.max(a,b));if(low>high)return false;
  }
  return high>.015&&low<length-.015;
}
export function lineBlocked(w,a,b,ignore=null){
  const d=dist(a,b);if(d<.001)return false;
  const dir={x:(b.x-a.x)/d,y:(b.y-a.y)/d,z:(b.z-a.z)/d};
  return occluders(w).some(v=>v.owner!==ignore&&hitVolume(a,dir,d,v));
}
export function inShade(w,p){return occluders(w).some(v=>hitVolume({...p,y:Math.max(.025,p.y)},SUN,15,v));}
export function blocked(w,x,z,padding=.10,ignore=null){
  if(x<FLOOR.minX||x>FLOOR.maxX||z<FLOOR.minZ||z>FLOOR.maxZ)return true;
  return w.objects.some(o=>o.id!==ignore&&(o.type==='shade'?Math.abs(x-o.x)<o.width/2+padding&&Math.abs(z-o.z)<o.depth/2+padding:Math.hypot(x-o.x,z-o.z)<o.radius+padding));
}
export function findPath(w,start,goal){
  const step=.16,cols=35,rows=21;
  const p=i=>({x:FLOOR.minX+(i%cols)*step,y:0,z:FLOOR.minZ+Math.floor(i/cols)*step});
  const index=a=>clamp(Math.round((a.x-FLOOR.minX)/step),0,cols-1)+clamp(Math.round((a.z-FLOOR.minZ)/step),0,rows-1)*cols;
  const s=index(start),end=index(goal),open=[s],prev=new Map([[s,null]]);let found=null;
  for(let head=0;head<open.length;head++){
    const curr=open[head],at=p(curr);
    if((curr===end||groundDist(at,goal)<step)&&!blocked(w,goal.x,goal.z)){found=curr;break;}
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
      const x=curr%cols+dx,z=Math.floor(curr/cols)+dz;if(x<0||x>=cols||z<0||z>=rows)continue;
      const next=z*cols+x,n=p(next);if(prev.has(next)||blocked(w,n.x,n.z))continue;
      if(dx&&dz&&(blocked(w,at.x+dx*step,at.z)||blocked(w,at.x,at.z+dz*step)))continue;
      prev.set(next,curr);open.push(next);
    }
  }
  if(found===null)return null;
  const path=[];for(let n=found;n!==s;n=prev.get(n))path.push(p(n));path.reverse();path.push(point(goal));return path;
}

export function targets(w,residentId){
  const a=w.residents[residentId],water=w.objects.find(o=>o.id==='water'),flower=w.objects.find(o=>o.id==='flowers');
  let list=[];
  if(a.species==='sparrow'){
    list=[{id:'rail-left',x:-2.35,y:.78,z:-1.96,kind:'perch'},{id:'rail-right',x:2.35,y:.78,z:-1.96,kind:'perch'},
      {id:'water-near',owner:'water',x:water.x,y:.15,z:water.z+.40,kind:'water'},
      {id:'water-far',owner:'water',x:water.x,y:.15,z:water.z-.40,kind:'water'},
      {id:'water-wait',owner:'water',x:water.x+.73,y:0,z:water.z+.19,kind:'waiting'}];
    for(const o of w.objects.filter(o=>o.type==='tree'))list.push({id:o.id+'-branch',owner:o.id,x:o.x+(o.species==='ficus'?.73:-.70),y:o.species==='ficus'?1.10:1.05,z:o.z+.28,kind:'perch'});
  }else if(a.species==='butterfly'){
    list=[{id:'flower-top',owner:'flowers',x:flower.x,y:.63,z:flower.z,kind:'flower'},
      {id:'sun-rest',x:2.12,y:.08,z:1.38,kind:'resting'},
      ...w.objects.filter(o=>o.type==='tree').map(o=>({id:o.id+'-tip',owner:o.id,x:o.x+.25,y:2.02,z:o.z-.12,kind:'perch'}))];
  }else{
    list=[{id:'ground-left',x:-1.52,y:0,z:1.42,kind:'ground'},{id:'ground-middle',x:.2,y:0,z:1.42,kind:'ground'},{id:'ground-right',x:2.2,y:0,z:.7,kind:'ground'},
      {id:'water-edge',owner:'water',x:water.x-.65,y:0,z:water.z+.1,kind:'damp'}];
    for(const o of w.objects.filter(o=>o.type==='tree'||o.type==='shade')){
      const spots=[];for(let i=0;i<8;i++){const angle=i*Math.PI/4,r=o.radius+.28;const p={x:o.x+Math.sin(angle)*r,y:0,z:o.z+Math.cos(angle)*r};if(!blocked(w,p.x,p.z))spots.push({...p,shade:inShade(w,p)});}
      spots.sort((u,v)=>Number(v.shade)-Number(u.shade));
      if(spots[0])list.push({id:o.id+'-edge',owner:o.id,...spots[0],kind:'ground'});
    }
    list=list.filter(p=>!blocked(w,p.x,p.z));
  }
  return list.filter(p=>p.x>=-2.9&&p.x<=2.9&&p.z>=-2.04&&p.z<=1.8).map(t=>({...t,shade:inShade(w,t),water:water.water,damp:t.owner==='water'&&water.wet>.08}));
}
export function occupied(w,targetId,except){return Object.values(w.residents).find(a=>a.id!==except&&(a.action?.targetId===targetId||a.support===targetId));}
export function candidates(w,id){
  const a=w.residents[id],options=[];
  for(const t of targets(w,id)){
    if(occupied(w,t.id,id))continue;
    if(a.species==='snail'&&(groundDist(a,t)>2.5||findPath(w,a,t)===null))continue;
    const push=(kind,description)=>options.push({id:kind+':'+t.id,kind,targetId:t.id,description,position:point(t),shade:t.shade,damp:!!t.damp});
    if(dist(a,t)>.12)push('visit','Move to '+t.id+' and look around');
    if(t.kind==='water'&&t.water>.02)push('drink','Drink at the bowl; another bird may use the other rim');
    if(t.kind==='waiting')push('wait','Wait near the water and watch its users');
    if(t.kind==='flower')push('feed','Visit the flowers for nectar');
    if(a.species==='snail'&&(t.shade||t.damp))push('shelter','Settle in this sheltered or damp place');
  }
  options.push({id:'rest:here',kind:'rest',targetId:'here',description:'Stay in place and observe briefly',position:point(a),shade:inShade(w,a)});
  return options;
}
export function neighbors(w,id){
  const a=w.residents[id],range=a.species==='snail'?1.65:a.species==='sparrow'?3.6:2.7,eye=point(a);eye.y+=a.species==='sparrow'?.22:.10;
  return Object.values(w.residents).filter(b=>b.id!==id&&dist(a,b)<range&&!lineBlocked(w,eye,{x:b.x,y:b.y+.16,z:b.z})).map(b=>({residentId:b.id,species:b.species,position:point(b),activity:b.action?.phase==='moving'?'moving':b.action?.kind||'rest',distance:Math.round(dist(a,b)*100)/100}));
}
export function perception(w,id){
  const a=w.residents[id];return {residentId:id,species:a.species,revision:w.revision,
    perception:{position:point(a),need:Math.round(a.need*100)/100,needMeans:a.species==='sparrow'?'thirst':a.species==='snail'?'need for moist shelter':'need for nectar',preference:a.preference,inShade:inShade(w,a)},
    neighbors:neighbors(w,id),memory:copy(a.memory),candidates:candidates(w,id)};
}
export function validatePlan(request,plan){
  if(!plan||!Array.isArray(plan.actions)||plan.actions.length<1||plan.actions.length>3)throw Error('invalid_actions');
  const allowed=new Set(request.candidates.map(c=>c.id));if(plan.actions.some(id=>typeof id!=='string'||!allowed.has(id)))throw Error('unknown_action');
  return {actions:[...plan.actions]};
}
export function installPlan(w,id,revision,actions,source='model'){
  const a=w.residents[id];if(!a||revision!==w.revision)return {ok:false,reason:'stale_revision'};
  try{validatePlan(perception(w,id),{actions});}catch{return {ok:false,reason:'invalid_actions'};}
  a.queue=actions.map(id=>({id,source}));a.cooldown=0;a.lastDecision=w.time;recordEvent(w,'plan_accepted',id,null,{actions,source});return {ok:true};
}
function flightHeight(w,a,goal){
  let top=Math.max(a.y,goal.y)+.35;
  for(const o of w.objects){
    if(o.type!=='tree'&&o.type!=='shade')continue;
    for(let i=1;i<10;i++){const t=i/10,x=a.x+(goal.x-a.x)*t,z=a.z+(goal.z-a.z)*t;if(Math.hypot(x-o.x,z-o.z)<(o.type==='tree'?.78:.6)){top=Math.max(top,o.type==='tree'?2.35:1.45);break;}}
  }
  return top;
}
function begin(w,a,item){
  const goal=item.position,path=a.species==='snail'?findPath(w,a,goal):null;
  if(a.species==='snail'&&path===null){recordEvent(w,'blocked',a.id,item.targetId);return;}
  if(dist(a,goal)<.03&&item.targetId!=='here')a.support=item.targetId;
  a.action={...item,goal:point(goal),from:point(a),path,pathIndex:0,elapsed:0,phaseTime:0,phase:dist(a,goal)<.03?'doing':'moving',travel:Math.max(.8,dist(a,goal)/(a.species==='butterfly'?.85:1.25)),apex:flightHeight(w,a,goal),duration:item.kind==='wait'?7:item.kind==='shelter'?9:item.kind==='rest'?6:5};
  if(a.action.phase==='moving')a.support=null;
}
function startNext(w,a){
  const next=a.queue.shift();if(!next)return;
  const item=candidates(w,a.id).find(c=>c.id===next.id);
  if(!item){a.queue=[];a.cooldown=1;recordEvent(w,'blocked',a.id,next.id);return;}
  begin(w,a,{...item,source:next.source});
}
function safety(w,a){
  a.queue=[];
  if(a.species==='snail'){a.action=null;a.startled=1.2;}
  else{
    const choices=targets(w,a.id).filter(t=>!t.owner&&!occupied(w,t.id,a.id));
    const t=choices.sort((u,v)=>dist(a,u)-dist(a,v))[0]||{id:'safe-air',x:a.x,y:Math.max(a.y,.7),z:a.z};
    begin(w,a,{id:'recovery:'+t.id,kind:'recovery',targetId:t.id,position:point(t),source:'safety'});
  }
  a.cooldown=.8;
}
function sense(w){
  for(const a of Object.values(w.residents)){
    const now=neighbors(w,a.id).map(n=>n.residentId);
    for(const otherId of now)if(!a.seen.includes(otherId))recordEvent(w,'neighbor_arrived',a.id,'nearby',{otherId});
    for(const otherId of a.seen)if(!now.includes(otherId))recordEvent(w,'neighbor_left',a.id,'nearby',{otherId});
    a.seen=now;
    for(const b of Object.values(w.residents)){
      if(b.id===a.id)continue;
      const shared=now.includes(b.id)&&dist(a,b)<.95&&a.action?.phase!=='moving'&&b.action?.phase!=='moving';
      if(!shared){delete a.shared[b.id];continue;}
      if(a.shared[b.id]===undefined)a.shared[b.id]=w.time;
      if(a.shared[b.id]!==-1&&w.time-a.shared[b.id]>3){recordEvent(w,'shared_space',a.id,a.support||'nearby',{otherId:b.id});a.shared[b.id]=-1;}
    }
  }
}
export function stepWorld(w,dt){
  dt=clamp(dt,0,.1);w.time+=dt;w.sensorTick+=dt;w.growthTick+=dt;
  if(w.sensorTick>=.3){w.sensorTick=0;sense(w);}
  if(w.growthTick>=1){
    const elapsed=w.growthTick;w.growthTick=0;
    for(const o of w.objects){
      if(o.type==='tree'){
        const tip={x:o.x-.12,y:1.94,z:o.z},light=lineBlocked(w,tip,{x:tip.x+SUN.x*10,y:tip.y+SUN.y*10,z:tip.z+SUN.z*10},o.id)?.35:1;
        const suitability=o.species==='maple'?(light<.5?.9:.68):light;
        const branch=sprout(o,Math.min(1,o.growth+.06));o.growthBlocked=lineBlocked(w,branch.from,branch.to,o.id);o.light=light;if(o.moisture>.15&&!o.growthBlocked)o.growth=Math.min(1,o.growth+elapsed*suitability*o.moisture/110);
        o.moisture=Math.max(0,o.moisture-elapsed*.0007);
      }
      if(o.type==='water'){o.water=Math.max(0,o.water-elapsed*.0003);o.wet=Math.max(0,o.wet-elapsed*.0015);}
    }
  }
  for(const a of Object.values(w.residents)){
    a.cooldown=Math.max(0,a.cooldown-dt);a.startled=Math.max(0,a.startled-dt);a.need=clamp(a.need+dt*.0018,0,1);
    if(!a.action&&a.queue.length&&a.cooldown===0)startNext(w,a);
    const act=a.action;if(!act)continue;
    act.elapsed+=dt;act.phaseTime+=dt;
    const live=act.targetId==='here'||act.targetId==='safe-air'?act.goal:targets(w,a.id).find(t=>t.id===act.targetId);
    if(!live||dist(live,act.goal)>.035){safety(w,a);recordEvent(w,'target_moved',a.id,act.targetId);continue;}
    if(act.phase==='moving'){
      if(a.species==='snail'){
        const p=act.path[act.pathIndex];
        if(!p){act.phase='doing';act.phaseTime=0;a.support=act.targetId;recordEvent(w,'arrived',a.id,act.targetId,{source:act.source});}
        else if(blocked(w,p.x,p.z)){a.action=null;a.queue=[];recordEvent(w,'blocked',a.id,act.targetId);}
        else{const d=dist(a,p),s=.14*dt;a.heading=Math.atan2(p.x-a.x,p.z-a.z);if(d<=s){Object.assign(a,p);act.pathIndex++;}else{a.x+=(p.x-a.x)*s/d;a.z+=(p.z-a.z)*s/d;}}
      }else{
        const u=clamp(act.phaseTime/act.travel,0,1),t=u*u*(3-2*u);
        a.x=act.from.x+(act.goal.x-act.from.x)*t;a.z=act.from.z+(act.goal.z-act.from.z)*t;
        a.y=act.from.y+(act.goal.y-act.from.y)*t+Math.sin(Math.PI*t)*(act.apex-Math.max(act.from.y,act.goal.y));
        if(groundDist(act.from,act.goal)>.01)a.heading=Math.atan2(act.goal.x-act.from.x,act.goal.z-act.from.z);
        if(u===1){Object.assign(a,act.goal);a.support=act.targetId;act.phase='landing';act.phaseTime=0;}
      }
    }else if(act.phase==='landing'){
      if(act.phaseTime>.38){act.phase='doing';act.phaseTime=0;recordEvent(w,'arrived',a.id,act.targetId,{source:act.source});}
    }else{
      if(['drink','wait'].includes(act.kind)){const water=w.objects.find(o=>o.id==='water');a.heading=Math.atan2(water.x-a.x,water.z-a.z);}
      if(act.phaseTime>=act.duration){
        const water=w.objects.find(o=>o.id==='water');
        if(act.kind==='drink'&&water.water>.02){water.water=Math.max(0,water.water-.07);a.need=Math.max(0,a.need-.65);recordEvent(w,'drank',a.id,'water',{source:act.source});}
        if(act.kind==='feed'){a.need=Math.max(0,a.need-.6);recordEvent(w,'fed',a.id,'flowers',{source:act.source});}
        if(act.kind==='shelter'&&(inShade(w,a)||act.damp)){a.need=Math.max(0,a.need-.45);recordEvent(w,'sheltered',a.id,act.targetId,{source:act.source});}
        if(act.kind==='wait')recordEvent(w,'waited',a.id,act.targetId,{nearby:neighbors(w,a.id).map(n=>n.residentId),source:act.source});
        recordEvent(w,'action_completed',a.id,act.targetId,{action:act.id,source:act.source});a.action=null;a.cooldown=.8;
      }
    }
  }
}
export function invalidateForEdit(w,id){
  w.revision++;
  const o=w.objects.find(o=>o.id===id);
  for(const a of Object.values(w.residents)){
    a.queue=[];
    const target=targets(w,a.id).find(t=>t.id===(a.action?.targetId||a.support));
    if(target?.owner===id){safety(w,a);recordEvent(w,'target_moved',a.id,id);}
    if(o&&groundDist(a,o)<1.05){a.startled=1.2;recordEvent(w,'disturbed',a.id,id);}
  }
}
export function moveObject(w,id,x,z){
  const o=w.objects.find(o=>o.id===id);if(!o||!finite(x)||!finite(z))return false;
  x=clamp(x,FLOOR.minX+o.radius,FLOOR.maxX-o.radius);z=clamp(z,FLOOR.minZ+o.radius,FLOOR.maxZ-o.radius);
  if(w.objects.some(b=>b.id!==id&&Math.hypot(b.x-x,b.z-z)<o.radius+b.radius+.10))return false;
  if(Object.values(w.residents).some(a=>a.y<.12&&Math.hypot(a.x-x,a.z-z)<o.radius+.18))return false;
  o.x=x;o.z=z;return true;
}
export function addWater(w,id='water'){
  const o=w.objects.find(o=>o.id===id);if(!o)return;
  if(o.type==='water'){o.water=1;o.wet=1;}else if('moisture'in o)o.moisture=1;else return;
  w.revision++;recordEvent(w,'water_added',null,id);
}
export function saveWorld(w){
  const saved=copy(w);saved.events=[];
  for(const a of Object.values(saved.residents)){a.resumeActions=[...(a.action&&a.action.kind!=='recovery'?[{id:a.action.id,source:a.action.source}]:[]),...a.queue].slice(0,3);a.action=null;a.queue=[];a.seen=[];a.shared={};}
  return saved;
}
export function restoreWorld(value){
  const fresh=createWorld();
  try{
    const s=typeof value==='string'?JSON.parse(value):value;
    if(s?.version!==2||!finite(s.time)||s.time<0||!Number.isSafeInteger(s.revision)||s.revision<0)return fresh;
    for(const o of fresh.objects){const b=s.objects?.find(v=>v.id===o.id);if(!b||![b.x,b.z].every(finite)||b.x<-2.8||b.x>2.8||b.z<-1.8||b.z>1.8)return createWorld();o.x=b.x;o.z=b.z;for(const k of ['water','wet','moisture','growth'])if(k in o&&finite(b[k]))o[k]=clamp(b[k],0,1);}
    for(const id of IDS){
      const a=fresh.residents[id],b=s.residents?.[id];if(!b||![b.x,b.y,b.z].every(finite)||Math.abs(b.x)>3||Math.abs(b.z)>2.2||b.y<0||b.y>4)return createWorld();
      Object.assign(a,point(b));a.heading=finite(b.heading)?b.heading:0;a.need=finite(b.need)?clamp(b.need,0,1):.5;
      a.memory=Array.isArray(b.memory)?b.memory.filter(e=>e&&Number.isSafeInteger(e.id)&&MEMORY_TYPES.includes(e.type)&&e.residentId===id&&typeof e.targetId==='string'&&finite(e.at)).slice(-12).map(e=>({id:e.id,at:e.at,type:e.type,residentId:id,targetId:e.targetId.slice(0,48),...(IDS.includes(e.otherId)?{otherId:e.otherId}:{})})):[];
      a.support=targets(fresh,id).find(t=>t.id===b.support&&dist(t,a)<.04)?.id||null;
      if(!a.support&&a.species!=='snail'&&a.y>.05)safety(fresh,a);
      const allowed=new Set(candidates(fresh,id).map(c=>c.id));a.queue=Array.isArray(b.resumeActions)?b.resumeActions.filter(q=>q&&allowed.has(q.id)&&['model','manual'].includes(q.source)).slice(0,3):[];
    }
    fresh.time=s.time;fresh.revision=s.revision;fresh.eventId=Math.max(0,...Object.values(fresh.residents).flatMap(a=>a.memory.map(m=>m.id)));return fresh;
  }catch{return fresh;}
}
