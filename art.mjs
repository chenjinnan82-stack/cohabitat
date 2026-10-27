import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {SUN,canopy,clamp,sprout} from './world.mjs';

const C={ground:0xdce5de,stone:0xc8cbbc,edge:0xaab9ad,rail:0x768b7f,clay:0xb97f63,wood:0x8c7055,leaf:0x628759,maple:0xac7553,ink:0x24372e};
const sphere=new T.SphereGeometry(1,18,12);
const materials=new Map();
function material(color,roughness=.85){const key=color+':'+roughness;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness,metalness:0}));return materials.get(key);}
function mesh(parent,geometry,color,x=0,y=0,z=0){const m=new T.Mesh(geometry,typeof color==='object'?color:material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ellipsoid(parent,x,y,z,sx,sy,sz,color){const m=mesh(parent,sphere,color,x,y,z);m.scale.set(sx,sy,sz);return m;}
function box(parent,x,y,z,sx,sy,sz,color,r=.025){return mesh(parent,new RoundedBoxGeometry(sx,sy,sz,2,Math.min(r,sx/3,sy/3,sz/3)),color,x,y,z);}
function tube(parent,points,r,color,segments=20){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return mesh(parent,new T.TubeGeometry(curve,segments,r,7,false),color);}
function cylinderBetween(parent,a,b,r1,r2,color){const start=new T.Vector3(...a),end=new T.Vector3(...b),d=end.clone().sub(start);const m=mesh(parent,new T.CylinderGeometry(r2,r1,d.length(),12),color);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
function seeded(i){return ((Math.sin(i*127.1+311.7)*43758.5453)%1+1)%1;}

function pot(g,r,h,color){
  const points=[[0,0],[r*.64,0],[r*.69,.04],[r*.96,h-.045],[r,h-.035],[r,h],[r*.87,h],[r*.84,h-.06],[0,h-.06]].map(p=>new T.Vector2(...p));
  mesh(g,new T.LatheGeometry(points,28),color);
  const soil=mesh(g,new T.CylinderGeometry(r*.85,r*.85,.025,24),0x5e5946,0,h-.046,0);soil.userData.soil=true;
  for(let i=0;i<7;i++){const angle=i*2.4,rr=r*(.25+.46*seeded(i));ellipsoid(g,Math.cos(angle)*rr,h-.025,Math.sin(angle)*rr,.026,.012,.02,i%2?0x8a8165:0xaaa185);}
}
function leafShape(){
  const s=new T.Shape();s.moveTo(0,-.65);
  for(const [x,y] of [[-.16,-.2],[-.60,-.20],[-.39,.05],[-.77,.34],[-.33,.27],[-.38,.78],[-.12,.48],[0,1],[.12,.48],[.38,.78],[.33,.27],[.77,.34],[.39,.05],[.60,-.20],[.16,-.2],[0,-.65]])s.lineTo(x,y);
  const geo=new T.ExtrudeGeometry(s,{depth:.045,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:1,steps:1});geo.rotateX(-Math.PI/2);return geo;
}
const mapleLeaf=leafShape();
function foliage(g,v,index){
  const root=group(g,v.x,v.y,v.z);root.scale.set(v.rx,v.ry,v.rz);
  const color=v.newLeaf?0xa5b56a:v.species==='ficus'?[0x52794d,0x668a56,0x739460][index%3]:[0xb47751,0xc68b59,0x9b6c4f][index%3];
  if(v.species==='ficus')ellipsoid(root,0,0,0,1,1,1,color);
  if(v.species==='ficus'){
    const leaves=new T.InstancedMesh(sphere,material(v.newLeaf?0xb5c87b:0x8aa66a),18);leaves.castShadow=true;leaves.receiveShadow=true;
    const dummy=new T.Object3D();
    for(let i=0;i<18;i++){const az=i*2.399,yy=-.15+seeded(i+index*39)*1.1,rr=Math.sqrt(Math.max(0,1-yy*yy));dummy.position.set(Math.cos(az)*rr*.89,yy,Math.sin(az)*rr*.89);dummy.scale.set(.19,.09,.29);dummy.rotation.set(seeded(i)*.8,az,.4);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);}root.add(leaves);
  }else{
    const leaves=new T.InstancedMesh(mapleLeaf,material(v.newLeaf?0xc1b67b:color),96);leaves.castShadow=true;leaves.receiveShadow=true;
    const dummy=new T.Object3D();
    for(let i=0;i<96;i++){const az=i*2.399,rr=Math.sqrt(seeded(i+index*13))*.98,yy=(seeded(i+7)-.35)*Math.sqrt(Math.max(0,1-rr*rr))*1.6;dummy.position.set(Math.cos(az)*rr,yy,Math.sin(az)*rr);dummy.scale.set(.43,1.0,.45);dummy.rotation.set(-.3+seeded(i)*.9,az,(seeded(i+3)-.5)*.7);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);}root.add(leaves);
  }
  return root;
}
function makeTree(o){
  const g=new T.Group();pot(g,o.radius,.46,o.species==='ficus'?0xb37b5d:0xb8b3a0);
  if(o.species==='ficus'){
    tube(g,[[0,.40,0],[-.08,.7,.02],[.06,1.03,-.02],[0,1.50,0]],.075,0x91836b);
    for(const sign of [-1,1])tube(g,[[sign*.25,.43,.09],[sign*.16,.50,.06],[sign*.07,.76,.015]],.035,0x9d8c70);
    for(const [x,y,z] of [[-.35,1.5,.08],[.31,1.62,-.07],[.19,1.46,.25]])cylinderBetween(g,[0,.91,0],[x,y,z],.047,.017,0x87765d);
    tube(g,[[.03,.85,0],[.38,1.00,.17],[.73,1.10,.28]],.028,0x88745b);
  }else{
    tube(g,[[0,.40,0],[.03,.82,0],[-.04,1.2,-.06],[.10,1.68,-.1]],.045,0x80674f);
    for(const [x,y,z] of [[-.35,1.51,.04],[.29,1.67,-.08],[-.02,1.84,-.12],[.12,1.44,.30]])tube(g,[[0,.77,0],[x*.6,1.12,z*.5],[x,y,z]],.026,0x83694f);
    tube(g,[[0,.78,0],[-.38,.97,.15],[-.70,1.05,.28]],.023,0x83694f);
  }
  const volumes=canopy({...o,x:0,z:0,growth:1});g.userData.newLeaves=[];
  volumes.forEach((v,i)=>{const f=foliage(g,v,i);if(v.newLeaf)g.userData.newLeaves.push({group:f,scale:f.scale.clone()});});
  const branch=sprout({...o,x:0,z:0},1),twig=group(g,branch.from.x,branch.from.y,branch.from.z);
  cylinderBetween(twig,[0,0,0],[branch.to.x-branch.from.x,branch.to.y-branch.from.y,0],.016,.006,0x8a8060);g.userData.twig=twig;
  return g;
}
function makeFlowers(o){
  const g=new T.Group();pot(g,.28,.23,0xcab79a);
  for(let i=0;i<7;i++){
    const a=i*2.4,r=.06+.11*seeded(i),x=Math.cos(a)*r,z=Math.sin(a)*r,h=.40+seeded(i+4)*.23;
    tube(g,[[x,.2,z],[x*.9,h*.7,z*.8],[x,h,z]],.012,0x748251,8);
    ellipsoid(g,x+.05,.30,z,.09,.021,.035,0x82975f).rotation.z=.4;
    for(let p=0;p<5;p++){const az=p*Math.PI*2/5;ellipsoid(g,x+Math.cos(az)*.043,h,z+Math.sin(az)*.043,.046,.022,.04,i%2?0xe5c580:0xf0e5b9);}
    ellipsoid(g,x,h+.015,z,.025,.018,.025,0xb69a57);
  }
  return g;
}
function makeWater(){
  const g=new T.Group(),profile=[[0,0],[.39,0],[.47,.07],[.47,.13],[.42,.16],[.37,.125],[.34,.045],[0,.045]].map(p=>new T.Vector2(...p));
  mesh(g,new T.LatheGeometry(profile,40),0xc8c9ac);
  const water=mesh(g,new T.CylinderGeometry(.38,.38,.012,40),new T.MeshStandardMaterial({color:0x82adb0,roughness:.20,metalness:.08}),0,.102,0);g.userData.water=water;
  const ripple=mesh(g,new T.TorusGeometry(.16,.006,5,40),new T.MeshBasicMaterial({color:0xd4e7de,transparent:true,opacity:.5}),0,.115,0);ripple.rotation.x=-Math.PI/2;g.userData.ripple=ripple;
  const wet=mesh(g,new T.CircleGeometry(.63,40),new T.MeshStandardMaterial({color:0x9aaea0,roughness:.9,transparent:true,opacity:.2,depthWrite:false}),-.08,.003,.08);wet.rotation.x=-Math.PI/2;wet.receiveShadow=true;wet.castShadow=false;g.userData.wet=wet;
  return g;
}
function makeShade(){
  const g=new T.Group();
  for(const x of [-.46,.46]){box(g,x,.59,0,.045,1.18,.05,0x8e795b);box(g,x,.035,0,.16,.07,.32,0x7e7059);}
  for(let i=0;i<8;i++)box(g,0,.32+i*.10,0,.86,.074,.07,i%2?0xbca476:0xc6ae7d,.012);
  return g;
}
function makeSparrow(id){
  const g=new T.Group(),warm=id==='sparrow-a',coat=warm?0x927354:0x7b7968,cap=warm?0x76533b:0x696250;
  const torso=group(g,0,.16,0);
  ellipsoid(torso,0,.07,-.015,.15,.17,.21,coat);
  ellipsoid(torso,0,.025,.095,.128,.13,.145,0xcfc6a8);
  const head=group(torso,0,.20,.105);ellipsoid(head,0,0,0,.112,.117,.115,cap);
  ellipsoid(head,0,-.036,.054,.095,.07,.080,0xddd3b6);
  for(const s of [-1,1]){
    ellipsoid(head,s*.083,-.014,.046,.020,.028,.029,0x423a2c);
    ellipsoid(head,s*.091,.024,.066,.017,.020,.020,0x222c24);
    ellipsoid(head,s*.099,.030,.073,.004,.005,.005,0xe8e4d4);
  }
  const beak=mesh(head,new T.ConeGeometry(.033,.10,10),0x74613e,0,-.015,.15);beak.rotation.x=Math.PI/2;
  const wings=[];
  for(const s of [-1,1]){
    const hinge=group(torso,s*.105,.12,-.02);const wing=ellipsoid(hinge,s*.035,-.055,-.035,.06,.13,.18,warm?0x6f604b:0x575f53);wing.rotation.x=-.28;
    for(let i=0;i<3;i++)ellipsoid(hinge,s*.07,-.055+i*.045,-.015,.014,.012,.12,0xbbae8f).rotation.x=-.25;
    wings.push(hinge);
  }
  const tail=ellipsoid(torso,0,.015,-.24,.075,.025,.17,0x665b47);tail.rotation.x=-.23;
  const feet=[];
  for(const s of [-1,1]){
    const foot=group(g,s*.058,0,.018);tube(foot,[[0,.105,-.015],[0,.026,0],[0,.014,.065]],.012,0x816c4b,6);
    for(const dx of [-.035,.035])tube(foot,[[0,.016,.012],[dx,.01,.053]],.008,0x816c4b,4);feet.push(foot);
  }
  g.userData={torso,head,wings,feet,tail};return g;
}
function makeSnail(){
  const g=new T.Group(),body=group(g);
  ellipsoid(body,0,.075,0,.105,.07,.24,0xb8aa7c);
  ellipsoid(body,0,.056,-.12,.11,.032,.24,0xc6b88d);
  const neck=group(body,0,.11,.17);ellipsoid(neck,0,.02,.025,.075,.075,.07,0xc5b788);
  const feelers=[];
  for(const s of [-1,1]){const f=group(neck,s*.037,.055,.018);tube(f,[[0,0,0],[s*.017,.08,.02],[s*.028,.13,.035]],.009,0xb2a677,8);ellipsoid(f,s*.028,.13,.035,.014,.016,.014,0x4f5542);feelers.push(f);}
  const shell=group(g,0,.195,-.055);ellipsoid(shell,0,0,0,.145,.17,.16,0xac8559);
  const spiral=[];for(let i=0;i<90;i++){const a=i/89*Math.PI*4.4,r=.012+.105*i/89;spiral.push([.139+Math.sin(i*.1)*.002,Math.cos(a)*r,Math.sin(a)*r]);}
  tube(shell,spiral,.012,0x7d5f3e,90);
  ellipsoid(shell,-.042,.06,.01,.105,.11,.12,0xc29b67);
  g.userData={body,neck,feelers,shell};return g;
}
function butterflyWing(){
  const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(.10,.19,.32,.21,.30,.08);s.bezierCurveTo(.29,-.01,.19,-.025,.17,-.05);s.bezierCurveTo(.31,-.18,.16,-.24,.06,-.13);s.quadraticCurveTo(.01,-.08,0,0);
  return new T.ExtrudeGeometry(s,{depth:.008,bevelEnabled:true,bevelThickness:.008,bevelSize:.007,bevelSegments:2,steps:1});
}
function makeButterfly(){
  const g=new T.Group(),wings=[],geo=butterflyWing();
  ellipsoid(g,0,.035,0,.017,.022,.11,0x625b39);ellipsoid(g,0,.043,.10,.031,.031,.032,0x625b39);
  for(const sign of [-1,1]){
    const hinge=group(g,0,.04,0);hinge.scale.x=sign;const wing=mesh(hinge,geo,new T.MeshStandardMaterial({color:0xe7bc64,roughness:.9,side:T.DoubleSide}));wing.rotation.x=-Math.PI/2;
    for(let i=0;i<5;i++){const p=ellipsoid(hinge,.06+i*.035,.013,.07+Math.sin(i)*.035,.012,.004,.025,0x956f3e);p.rotation.y=.45;}
    wings.push(hinge);
  }
  for(const s of [-1,1])tube(g,[[s*.015,.055,.11],[s*.03,.08,.15],[s*.045,.09,.16]],.004,0x6b6848,6);
  g.userData={wings};return g;
}

export function createView(canvas,world){
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;
  const scene=new T.Scene();scene.background=new T.Color(C.ground);scene.fog=new T.Fog(C.ground,18,40);
  scene.add(new T.HemisphereLight(0xeaf2e3,0x9d8d75,2.2));
  const sun=new T.DirectionalLight(0xffe4bc,3.0);sun.position.set(SUN.x*9,SUN.y*9,SUN.z*9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-4.7;sun.shadow.camera.right=4.7;sun.shadow.camera.top=4.7;sun.shadow.camera.bottom=-4.7;sun.shadow.camera.near=.1;sun.shadow.camera.far=18;sun.shadow.bias=-.0003;sun.shadow.normalBias=.025;sun.shadow.radius=3;scene.add(sun);scene.add(sun.target);
  const ground=mesh(scene,new T.PlaneGeometry(200,200),C.ground,0,-.34,0);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
  box(scene,0,-.22,0,6.32,.24,4.18,C.edge,.10);
  box(scene,0,-.05,0,6.22,.10,4.08,C.stone,.06);
  // Quiet tile seams establish a floor that remains legible from every direction.
  for(let i=-2;i<=2;i++)box(scene,i*1.02,.002,0,.007,.004,3.98,0xb4bcad,.001);
  for(const z of [-1.02,0,1.02])box(scene,0,.002,z,6.1,.004,.007,0xb5bdae,.001);
  for(let i=0;i<8;i++){const x=-2.9+i*.83;box(scene,x,.37,-1.96,.045,.74,.045,C.rail,.015);}
  box(scene,0,.735,-1.96,6.12,.09,.09,C.rail,.03);
  box(scene,0,.20,-1.96,6.12,.035,.035,0x91a08e,.012);
  for(const s of [-1,1]){
    for(const z of [-1.3,-.65,0])box(scene,s*3.02,.30,z,.045,.60,.045,C.rail,.015);
    box(scene,s*3.02,.62,-.97,.09,.08,2.06,C.rail,.025);
  }
  // Rounded stepping stones and a small moss patch give the near edge a scale cue.
  for(const [x,z,r] of [[2.12,1.38,.24],[-2.15,1.42,.12],[.35,-1.47,.15]])ellipsoid(scene,x,.035,z,r,.05,r*.7,0xaeb6a2);
  for(let i=0;i<5;i++)ellipsoid(scene,2.45+seeded(i)*.30,.05,.8+seeded(i+7)*.4,.12,.035,.09,0x8f9e77);
  const objects=new Map(),residents=new Map();
  for(const o of world.objects){const g=o.type==='tree'?makeTree(o):o.type==='flowers'?makeFlowers(o):o.type==='water'?makeWater():makeShade();g.position.set(o.x,0,o.z);g.userData.objectId=o.id;g.traverse(n=>{n.userData.objectId=o.id;});scene.add(g);objects.set(o.id,g);}
  for(const a of Object.values(world.residents)){const g=a.species==='sparrow'?makeSparrow(a.id):a.species==='snail'?makeSnail():makeButterfly();g.position.set(a.x,a.y,a.z);g.userData.residentId=a.id;g.traverse(n=>{n.userData.residentId=a.id;});scene.add(g);residents.set(a.id,g);}
  const ring=mesh(scene,new T.RingGeometry(.94,1,64),new T.MeshBasicMaterial({color:0xb29b5c,transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false}),0,.006,0);ring.rotation.x=-Math.PI/2;ring.visible=false;ring.castShadow=false;
  const camera=new T.PerspectiveCamera(37,1,.1,80);camera.position.set(6.4,4.5,6.6);
  const controls=new OrbitControls(camera,canvas);controls.target.set(0,.64,0);controls.enableDamping=true;controls.dampingFactor=.09;controls.enablePan=false;controls.minDistance=3.8;controls.maxDistance=11.5;controls.minPolarAngle=.30;controls.maxPolarAngle=Math.PI*.455;controls.mouseButtons.RIGHT=T.MOUSE.ROTATE;controls.update();
  const ray=new T.Raycaster(),pointer=new T.Vector2(),plane=new T.Plane(new T.Vector3(0,1,0),0);
  function setRay(clientX,clientY){const r=canvas.getBoundingClientRect();pointer.set((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);}
  function pick(clientX,clientY){setRay(clientX,clientY);return ray.intersectObjects([...objects.values()],true).find(h=>h.object.visible)?.object.userData.objectId||null;}
  function groundPoint(clientX,clientY){setRay(clientX,clientY);const p=new T.Vector3();return ray.ray.intersectPlane(plane,p)?{x:p.x,z:p.z}:null;}
  function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
  function orbit(angle){const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new T.Vector3(0,1,0),angle);camera.position.copy(controls.target).add(offset);controls.update();}
  function zoom(factor){const offset=camera.position.clone().sub(controls.target);offset.multiplyScalar(factor);offset.clampLength(controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(offset);controls.update();}
  function resetCamera(){camera.position.set(6.4,4.5,6.6);controls.target.set(0,.64,0);controls.update();}
  function movement(dx,dz){const f=camera.getWorldDirection(new T.Vector3());f.y=0;f.normalize();const right=new T.Vector3().crossVectors(f,new T.Vector3(0,1,0));return {x:right.x*dx+f.x*dz,z:right.z*dx+f.z*dz};}
  function update(w,ui,dt){
    const t=w.time;
    for(const o of w.objects){const g=objects.get(o.id);g.position.set(o.x,0,o.z);
      if(o.type==='tree'){const tip=sprout({...o,x:0,z:0}).to;for(const n of g.userData.newLeaves){n.group.scale.copy(n.scale).multiplyScalar(Math.max(.005,o.growth));n.group.position.set(tip.x,tip.y,tip.z);}g.userData.twig.scale.setScalar(Math.max(.005,o.growth));}
      if(o.type==='water'){
        g.userData.water.visible=o.water>.02;g.userData.water.position.y=.065+o.water*.044;
        const drinking=Object.values(w.residents).some(a=>a.action?.kind==='drink'&&a.action.phase==='doing');g.userData.ripple.visible=o.water>.02;g.userData.ripple.position.y=g.userData.water.position.y+.009;g.userData.ripple.scale.setScalar(drinking?.6+(t*.5%1):.93+Math.sin(t*.8)*.025);g.userData.ripple.material.opacity=drinking?.45:.24;g.userData.wet.material.opacity=o.wet*.35;
      }
      if('moisture'in o)g.traverse(n=>{if(n.userData.soil)n.material=material(o.moisture>.75?0x4f4c3d:0x5e5946);});
    }
    for(const a of Object.values(w.residents)){
      const g=residents.get(a.id),moving=a.action?.phase==='moving',landing=a.action?.phase==='landing';
      g.position.set(a.x,a.y,a.z);const angle=Math.atan2(Math.sin(a.heading-g.rotation.y),Math.cos(a.heading-g.rotation.y));g.rotation.y+=angle*Math.min(1,dt*8);
      if(a.species==='sparrow'){
        const p=g.userData,drink=a.action?.kind==='drink'&&a.action.phase==='doing';
        p.torso.rotation.x=drink?.35+Math.max(0,Math.sin(t*4))*.55:moving?-.15:Math.sin(t*1.6)*.018;
        p.torso.position.y=.16+(moving?0:Math.sin(t*2.2)*.003)+(landing?Math.sin(a.action.phaseTime/.38*Math.PI)*-.035:0);
        p.head.rotation.y=moving?0:Math.sin(t*.65+(a.id==='sparrow-a'?0:2))*.25;p.head.rotation.x=drink?.30:0;
        p.wings.forEach((wing,i)=>{const sign=i===0?-1:1;wing.rotation.z=moving?sign*(.9+Math.sin(t*28)*.85):sign*.035;wing.rotation.x=moving?-.25:0;});
        p.feet.forEach(f=>{f.rotation.x=moving?-.6:0;});
        if(a.startled>0&&!moving)p.head.position.y=.20+Math.sin(t*9)*.008;
      }else if(a.species==='snail'){
        const p=g.userData,hide=a.startled>0;p.body.scale.z=moving?1+Math.sin(t*7)*.06:1;
        p.neck.scale.setScalar(hide?.35:1);p.shell.rotation.x=moving?Math.sin(t*7)*.02:0;p.feelers.forEach((f,i)=>{f.rotation.x=Math.sin(t*1.8+i)*.10;f.rotation.z=Math.sin(t*1.1+i)*.14;});
      }else{
        const angle=moving?.65+Math.sin(t*23)*.70:.75+Math.sin(t*1.5)*.12;
        g.userData.wings.forEach((wing,i)=>{wing.rotation.z=(i===0?1:-1)*angle;});
        if(moving)g.position.y+=Math.sin(t*5)*.018;
      }
    }
    const id=ui.selected||ui.hover,o=w.objects.find(o=>o.id===id);ring.visible=!!o;
    if(o){ring.position.set(o.x,.006,o.z);ring.scale.setScalar(o.radius+.14);ring.material.color.set(ui.invalid?0xba765b:0xb29b5c);}
    controls.update();renderer.render(scene,camera);
  }
  resize();return {renderer,scene,camera,controls,pick,groundPoint,resize,orbit,zoom,resetCamera,movement,update};
}
