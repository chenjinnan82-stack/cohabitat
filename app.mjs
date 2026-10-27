import {IDS,createWorld,stepWorld,perception,installPlan,moveObject,invalidateForEdit,addWater,saveWorld,restoreWorld,recordEvent} from './world.mjs';
import {createView} from './art.mjs';
const $=s=>document.querySelector(s),canvas=$('#scene'),params=new URLSearchParams(location.search),mode=params.get('mode')==='motion'?'motion':'live';
const storageKey='cohabitat-world-v2',api=name=>new URL('./api/'+name,import.meta.url);
let world=createWorld(),view,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,selected=null,drag=null,hover=null,configured=false,status=null,recording=null;
let lastFrame=performance.now(),started=performance.now(),activeSeconds=0,lastSave=0,manual=[],cursor=0,interventions=[],interventionCursor=0,benchmarkStart=null;
const ui={selected:null,hover:null,invalid:false},pending=new Map(),calls=[],retryAt={},frames=[],draws=[],inputs=[],decisions=[],failures=[];
let droppedFrames=0,longFrames=0,maxFrame=0;
function notice(s){$('#notice').hidden=!s;$('#notice-text').textContent=s||'';}
function announce(s){$('#announcement').textContent=s;}
function persist(){if(mode==='live')try{localStorage.setItem(storageKey,JSON.stringify(saveWorld(world)));}catch{notice('浏览器未能保存布局，本次阳台仍可继续。');}}
function abortDecisions(){for(const t of pending.values())t.controller.abort();pending.clear();}
function feedback(at){requestAnimationFrame(()=>{inputs.push(performance.now()-at);if(inputs.length>5000)inputs.shift();});}
function select(id){selected=id;ui.selected=id;$('#hint').textContent=id?'方向键移动 · Shift 加快 · Esc 取消选择':'拖空处转动 · 拖物件摆放 · 滚轮拉近';document.querySelectorAll('[data-object]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.object===id)));const o=world.objects.find(o=>o.id===id);$('#water').textContent=o&&['tree','flowers'].includes(o.type)?'浇水':'加水';}
function beginEdit(id){abortDecisions();invalidateForEdit(world,id);}
function relocate(id,x,z){const changed=moveObject(world,id,x,z);if(changed)beginEdit(id);recordEvent(world,'environment_edited',null,id,{changed});persist();return changed;}
function water(){const at=performance.now();abortDecisions();const o=world.objects.find(o=>o.id===selected);addWater(world,o&&['tree','flowers'].includes(o.type)?selected:'water');persist();feedback(at);announce(o&&['tree','flowers'].includes(o.type)?'已浇水':'水盘已加水');}
function shade(){const o=world.objects.find(o=>o.id==='shade');const ok=o.x<0?relocate(o.id,1.9,.35):relocate(o.id,-1.55,1.25);if(!ok)announce('另一侧暂时放不下，可以直接拖动遮阴板。');}
function manualTimeline(){
  // This is a labelled, inspectable action score. It is never used in live mode.
  manual=[
    [0,()=>{installPlan(world,'sparrow-a',world.revision,['drink:water-near','visit:ficus-branch'],'manual');installPlan(world,'snail',world.revision,['visit:water-edge','shelter:water-edge'],'manual');installPlan(world,'butterfly',world.revision,['feed:flower-top','visit:maple-tip'],'manual');}],
    [1.8,()=>installPlan(world,'sparrow-b',world.revision,['wait:water-wait','drink:water-far'],'manual')],
    [12,()=>installPlan(world,'sparrow-a',world.revision,['visit:rail-left','drink:water-near'],'manual')],
    [14,()=>{relocate('shade',-1.55,1.25);installPlan(world,'snail',world.revision,['shelter:water-edge'],'manual');}],
    [18,()=>installPlan(world,'butterfly',world.revision,['feed:flower-top'],'manual')],
    [24,()=>installPlan(world,'sparrow-b',world.revision,['visit:maple-branch'],'manual')]
  ];cursor=0;
}
function resetWorld(){abortDecisions();world=createWorld();select(null);interventions=[];benchmarkStart=null;for(const id of IDS)retryAt[id]=0;if(mode==='motion')manualTimeline();persist();}
function pause(value=!paused){paused=value;$('#pause').textContent=paused?'▷':'Ⅱ';$('#pause').setAttribute('aria-label',paused?'继续阳台':'暂停阳台');$('#pause').title=paused?'继续':'暂停';$('#pause-label').hidden=!paused;if(paused)abortDecisions();}

canvas.addEventListener('pointerdown',e=>{
  if(!view||e.button!==0)return;const id=view.pick(e.clientX,e.clientY);if(!id){select(null);return;}
  const p=view.groundPoint(e.clientX,e.clientY),o=world.objects.find(o=>o.id===id);if(!p)return;
  e.stopImmediatePropagation();view.controls.enabled=false;select(id);drag={id,startX:e.clientX,startY:e.clientY,dx:p.x-o.x,dz:p.z-o.z,active:false};canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});
},{capture:true});
canvas.addEventListener('pointermove',e=>{
  if(!view)return;
  if(drag){
    e.stopImmediatePropagation();if(!drag.active&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<4)return;
    const at=performance.now(),p=view.groundPoint(e.clientX,e.clientY);if(p){const moved=moveObject(world,drag.id,p.x-drag.dx,p.z-drag.dz);ui.invalid=!moved;if(moved&&!drag.active){drag.active=true;beginEdit(drag.id);canvas.classList.add('dragging');}feedback(at);}
  }else{hover=view.pick(e.clientX,e.clientY);ui.hover=hover;canvas.classList.toggle('over-object',!!hover);}
},{capture:true});
function endDrag(e){if(!drag)return;e?.stopImmediatePropagation();if(drag.active){recordEvent(world,'environment_edited',null,drag.id);persist();announce(ui.invalid?'已保留最近的有效位置':'已移动物件');}drag=null;ui.invalid=false;canvas.classList.remove('dragging');view.controls.enabled=true;}
canvas.addEventListener('pointerup',endDrag,{capture:true});canvas.addEventListener('pointercancel',endDrag,{capture:true});canvas.addEventListener('lostpointercapture',endDrag);canvas.addEventListener('pointerleave',()=>{ui.hover=null;});
canvas.addEventListener('keydown',e=>{
  if(e.key==='Escape'){select(null);return;}if(e.key===' '){e.preventDefault();pause();return;}
  const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[e.key];
  if(delta){e.preventDefault();if(selected){const at=performance.now(),o=world.objects.find(o=>o.id===selected),s=e.shiftKey?.25:.08,d=view.movement(delta[0]*s,delta[1]*s);const ok=relocate(o.id,o.x+d.x,o.z+d.z);announce(ok?'已移动':'这里放不下');feedback(at);}else if(delta[0])view.orbit(delta[0]*.18);else view.zoom(delta[1]>0?.9:1.1);}
});
document.querySelectorAll('[data-object]').forEach(b=>b.addEventListener('click',()=>{select(b.dataset.object);canvas.focus({preventScroll:true});$('#hint').textContent='方向键移动 · Shift 加快 · Esc 取消选择';}));
$('#water').addEventListener('click',water);$('#shade').addEventListener('click',shade);$('#pause').addEventListener('click',()=>pause());
$('#rotate-left').addEventListener('click',()=>view.orbit(-Math.PI/6));$('#rotate-right').addEventListener('click',()=>view.orbit(Math.PI/6));$('#zoom-in').addEventListener('click',()=>view.zoom(.85));$('#zoom-out').addEventListener('click',()=>view.zoom(1.17));$('#camera-reset').addEventListener('click',()=>view.resetCamera());
$('#reset').addEventListener('click',()=>$('#reset-dialog').showModal());$('#reset-dialog').addEventListener('close',()=>{if($('#reset-dialog').returnValue==='confirm')resetWorld();});
const messages={key_missing:'尚未连接 Nebius。可以先摆放阳台，或查看动作测试。',provider_auth_failed:'Nebius 凭据未通过验证，请检查本地配置后重试。',model_unavailable:'当前账号未提供配置的 Nemotron 模型。',budget_exhausted:'本项目调用额度已用完，居民会完成已有动作。',pricing_unverified:'模型单价尚未核实，暂不发起付费请求。',provider_timeout_or_cancelled:'这次决策等待过久，居民先停留。',invalid_model_response:'这次行动格式不可执行，已保留原有状态。'};
async function connection(){try{const r=await fetch(api('status'),{signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error();status=await r.json();configured=status.configured;if(mode==='live'){$('#mode-label').textContent=status.provider==='ollama'?'Ollama · 本地测试':'Nebius · Nemotron';notice(configured?'':status.provider==='ollama'?'本机 Ollama 或指定模型尚未就绪。':messages.key_missing);}for(const id of IDS)retryAt[id]=0;}catch{configured=false;notice('暂时无法连接本地服务，请重试。');}}
$('#retry').addEventListener('click',connection);
async function ask(id){
  const controller=new AbortController(),request=perception(world,id),began=performance.now(),token={controller};pending.set(id,token);calls.push(began);world.residents[id].lastDecision=world.time;
  try{
    const r=await fetch(api('decide'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:controller.signal}),data=await r.json();
    if(!r.ok){retryAt[id]=performance.now()+(r.status===429?data.retryAfterMs||15000:30000);failures.push({residentId:id,status:r.status,error:data.error,at:world.time});if(r.status!==429&&r.status!==409)notice(messages[data.error]||'这次居民决策未完成，可以重试。');return;}
    if(data.source!==status?.provider)throw Error('unexpected_source');
    const applied=!paused&&!document.hidden&&!drag&&pending.get(id)===token?installPlan(world,id,data.revision,data.actions,'model'):{ok:false,reason:'cancelled'};
    decisions.push({...data,receivedMs:Math.round(performance.now()-began),applied:applied.ok,rejection:applied.reason,request});if(decisions.length>250)decisions.shift();
    recordEvent(world,applied.ok?'model_applied':'model_rejected',id,null,{decisionId:data.id,reason:applied.reason});if(applied.ok)notice('');
  }catch(e){if(e.name!=='AbortError'){failures.push({residentId:id,error:'connection_failed',at:world.time});retryAt[id]=performance.now()+30000;notice('连接暂时中断，居民会安全完成已有动作。');}}
  finally{if(pending.get(id)===token)pending.delete(id);}
}
setInterval(()=>{
  if(mode!=='live'||!configured||paused||document.hidden||drag||!view)return;
  const now=performance.now();while(calls.length&&now-calls[0]>60000)calls.shift();
  const ready=Object.values(world.residents).filter(a=>!a.action&&!a.queue.length&&!pending.has(a.id)&&a.cooldown===0&&now>=(retryAt[a.id]||0)).sort((a,b)=>a.lastDecision-b.lastDecision);
  if(pending.size<(status?.maxParallel||1)&&calls.length<12&&ready[0])ask(ready[0].id);
},300);
function percentile(a,p){if(!a.length)return null;const b=[...a].sort((x,y)=>x-y);return Math.round(b[Math.min(b.length-1,Math.ceil(p*b.length)-1)]*100)/100;}
function report(){return {version:2,mode,wallSeconds:Math.round((performance.now()-started)/1000),activeSeconds:Math.round(activeSeconds),simulationSeconds:Math.round(world.time),frameSamples:frames.length,frameMs:{p50:percentile(frames,.5),p95:percentile(frames,.95),max:Math.round(maxFrame*100)/100,over50ms:longFrames,over100ms:droppedFrames},drawMs:{p50:percentile(draws,.5),p95:percentile(draws,.95)},inputFeedbackMs:{count:inputs.length,p50:percentile(inputs,.5),p95:percentile(inputs,.95)},renderer:view?{calls:view.renderer.info.render.calls,triangles:view.renderer.info.render.triangles,pixelRatio:view.renderer.getPixelRatio(),camera:{x:view.camera.position.x,y:view.camera.position.y,z:view.camera.position.z}}:null,model:{configured,provider:status?.provider,model:status?.model,calls:decisions.length,applied:decisions.filter(d=>d.applied).length,failures:failures.length,p50:percentile(decisions.map(d=>d.receivedMs),.5),p95:percentile(decisions.map(d=>d.receivedMs),.95)},decisions,failures,events:world.events,state:saveWorld(world)};}
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#export').addEventListener('click',()=>download(new Blob([JSON.stringify(report(),null,2)],{type:'application/json'}),'cohabitat-3d-'+mode+'-'+Date.now()+'.json'));
function startRecording(seconds,resetMotion=true){
  if(recording){recording.recorder.stop();return;}if(!window.MediaRecorder){notice('此浏览器不支持录制。');return;}
  if(mode==='motion'&&resetMotion){resetWorld();view.resetCamera();pause(false);}
  const output=document.createElement('canvas');output.width=1280;output.height=Math.round(1280*canvas.clientHeight/canvas.clientWidth/2)*2;
  const context=output.getContext('2d'),stream=output.captureStream(30),mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/mp4'].find(m=>MediaRecorder.isTypeSupported(m));
  const recorder=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:4500000}:{}),chunks=[],instance={recorder,context,output,started:performance.now(),timer:null};
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>{clearTimeout(instance.timer);stream.getTracks().forEach(t=>t.stop());download(new Blob(chunks,{type:recorder.mimeType}),'cohabitat-3d-'+mode+'-'+Date.now()+'.'+(recorder.mimeType.includes('mp4')?'mp4':'webm'));recording=null;$('#record').textContent='录制';};
  recorder.onerror=()=>notice('录制未完成，请重试。');recording=instance;recorder.start(1000);instance.timer=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},seconds*1000);
}
$('#record').addEventListener('click',()=>startRecording(mode==='motion'?30:175));
$('#three-minute').addEventListener('click',()=>{if(mode==='live'&&!configured){notice(messages.key_missing);return;}resetWorld();pause(false);benchmarkStart=world.time;interventionCursor=0;interventions=[[25,()=>relocate('ficus',-1.7,-.8)],[55,()=>water()],[85,()=>shade()],[115,()=>relocate('water',-.05,.77)],[145,()=>{select('maple');water();select(null);}]];startRecording(175,false);});
function frame(now){
  const elapsed=now-lastFrame;lastFrame=now;
  if(view&&!document.hidden){
    if(!paused){activeSeconds+=elapsed/1000;stepWorld(world,elapsed/1000);if(mode==='motion')while(cursor<manual.length&&world.time>=manual[cursor][0])manual[cursor++][1]();if(benchmarkStart!==null)while(interventionCursor<interventions.length&&world.time-benchmarkStart>=interventions[interventionCursor][0])interventions[interventionCursor++][1]();}
    const before=performance.now();view.update(world,ui,Math.min(.1,elapsed/1000));
    if(recording){const c=recording.context,out=recording.output;c.drawImage(canvas,0,0,out.width,out.height);c.fillStyle='#edf0e9ed';c.fillRect(18,18,mode==='motion'?252:280,36);c.font='18px sans-serif';c.fillStyle='#41523e';c.fillText(mode==='motion'?'动作测试 · 人工编排':status?.provider==='ollama'?'共栖 · Ollama 本地测试':'共栖 · Nemotron 实时试玩',32,43);$('#record').textContent='停止 · '+Math.floor((now-recording.started)/1000)+'s';}
    const end=performance.now();if(now-started>1000){frames.push(elapsed);draws.push(end-before);maxFrame=Math.max(maxFrame,elapsed);if(elapsed>50)longFrames++;if(elapsed>100)droppedFrames++;if(frames.length>40000){frames.shift();draws.shift();}}
    if(now-lastSave>5000){lastSave=now;persist();if(!$('#diagnostics').hidden){const r=report();delete r.decisions;delete r.failures;delete r.events;delete r.state;$('#metrics').textContent=JSON.stringify(r,null,2);}}
  }
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();if(document.hidden){abortDecisions();persist();}});window.addEventListener('pagehide',()=>{abortDecisions();persist();});window.addEventListener('resize',()=>view?.resize());
try{
  if(mode==='live'){try{const saved=localStorage.getItem(storageKey);if(saved)world=restoreWorld(saved);}catch{}}
  else{manualTimeline();$('#test-badge').hidden=false;$('#mode-label').textContent='动作测试';$('#mode-link').textContent='返回阳台';$('#mode-link').href='./';}
  view=createView(canvas,world);pause(paused);$('#diagnostics').hidden=!params.has('debug');$('#loading').hidden=true;select(null);await connection();lastFrame=performance.now();requestAnimationFrame(frame);
}catch(e){$('#loading').textContent='三维画面未能启动：'+e.message;console.error(e);}
